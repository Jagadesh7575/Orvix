-- ==========================================
-- PHASE 1: DEVICE TOKENS SQL
-- Run this in Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.device_tokens (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    token text not null,
    platform text default 'android',
    device_id text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id, token)
);

-- Enable RLS
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors on re-run
DROP POLICY IF EXISTS "Users can select their own tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.device_tokens;

-- RLS: users can select their own tokens
CREATE POLICY "Users can select their own tokens" 
  ON public.device_tokens FOR SELECT 
  USING (auth.uid() = user_id);

-- RLS: users can insert their own tokens
CREATE POLICY "Users can insert their own tokens" 
  ON public.device_tokens FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS: users can update their own tokens
CREATE POLICY "Users can update their own tokens" 
  ON public.device_tokens FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS: users can delete their own tokens
CREATE POLICY "Users can delete their own tokens" 
  ON public.device_tokens FOR DELETE 
  USING (auth.uid() = user_id);
