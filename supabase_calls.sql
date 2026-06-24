-- Migration: Add Agora Calls and Call Participants

-- 1. Create calls table
CREATE TABLE IF NOT EXISTS public.calls (
    id uuid primary key default gen_random_uuid(),
    chat_id uuid null,
    caller_id uuid not null references public.profiles(id) on delete cascade,
    receiver_id uuid not null references public.profiles(id) on delete cascade,
    call_type text not null check (call_type in ('voice', 'video')),
    status text not null default 'ringing' check (status in ('ringing', 'accepted', 'rejected', 'missed', 'ended', 'failed', 'cancelled')),
    agora_channel_name text not null unique,
    started_at timestamptz default now(),
    accepted_at timestamptz null,
    ended_at timestamptz null,
    duration_seconds integer default 0,
    ended_by uuid null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Create indexes for calls
CREATE INDEX IF NOT EXISTS calls_caller_id_idx ON public.calls(caller_id);
CREATE INDEX IF NOT EXISTS calls_receiver_id_idx ON public.calls(receiver_id);
CREATE INDEX IF NOT EXISTS calls_chat_id_idx ON public.calls(chat_id);
CREATE INDEX IF NOT EXISTS calls_status_idx ON public.calls(status);
CREATE INDEX IF NOT EXISTS calls_created_at_idx ON public.calls(created_at);

-- 3. Create call_participants table
CREATE TABLE IF NOT EXISTS public.call_participants (
    id uuid primary key default gen_random_uuid(),
    call_id uuid not null references public.calls(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    role text not null check (role in ('caller', 'receiver')),
    joined_at timestamptz null,
    left_at timestamptz null,
    connection_status text default 'pending',
    created_at timestamptz default now()
);

-- 4. Create indexes for call_participants
CREATE INDEX IF NOT EXISTS call_participants_call_id_idx ON public.call_participants(call_id);
CREATE INDEX IF NOT EXISTS call_participants_user_id_idx ON public.call_participants(user_id);

-- 5. Enable RLS
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for calls
-- Caller and receiver can read their calls
CREATE POLICY "Users can view their own calls" 
ON public.calls FOR SELECT 
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Caller can create a call
CREATE POLICY "Callers can insert calls" 
ON public.calls FOR INSERT 
WITH CHECK (auth.uid() = caller_id);

-- Caller and receiver can update their call
CREATE POLICY "Participants can update calls" 
ON public.calls FOR UPDATE 
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- 7. RLS Policies for call_participants
-- Participants can view their related call participants rows
CREATE POLICY "Users can view participants of their calls" 
ON public.call_participants FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.calls c 
        WHERE c.id = call_participants.call_id 
        AND (c.caller_id = auth.uid() OR c.receiver_id = auth.uid())
    )
);

-- Caller can insert participant rows for both caller and receiver during creation
CREATE POLICY "Callers can insert participants" 
ON public.call_participants FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.calls c 
        WHERE c.id = call_participants.call_id 
        AND c.caller_id = auth.uid()
    )
);

-- Participants can update their own participant row (e.g. joined_at, left_at)
CREATE POLICY "Users can update their own participant row" 
ON public.call_participants FOR UPDATE 
USING (auth.uid() = user_id);

-- Enable realtime for calls table
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
