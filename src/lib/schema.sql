-- Orvix Profiles Table Migration
-- Run this script in the Supabase SQL Editor to ensure all required fields exist.

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS theme_id text DEFAULT 'cyber_violet';

-- Storage Bucket Setup for Avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Storage Policies for Avatars

-- Remove old conflicting policies if needed
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;

-- Allow public read access
create policy "Avatar images are publicly accessible"
on storage.objects for select
using (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own avatar
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own avatar
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- ==========================================
-- PHASE 1 & 2: MAJOR SOCIAL & CHAT FEATURES
-- ==========================================

-- 1. TABLES

-- Friend Requests
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id uuid primary key default gen_random_uuid(),
    sender_id uuid references public.profiles(id) on delete cascade not null,
    receiver_id uuid references public.profiles(id) on delete cascade not null,
    status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    CONSTRAINT sender_not_receiver CHECK (sender_id != receiver_id)
);

-- Friendships
CREATE TABLE IF NOT EXISTS public.friendships (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    friend_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamptz default now(),
    unique(user_id, friend_id),
    CONSTRAINT user_not_friend CHECK (user_id != friend_id)
);

-- Chats
CREATE TABLE IF NOT EXISTS public.chats (
    id uuid primary key default gen_random_uuid(),
    type text default 'private' check (type in ('private')),
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Chat Members
CREATE TABLE IF NOT EXISTS public.chat_members (
    id uuid primary key default gen_random_uuid(),
    chat_id uuid references public.chats(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    joined_at timestamptz default now(),
    last_read_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
    last_read_at timestamptz,
    unique(chat_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid primary key default gen_random_uuid(),
    chat_id uuid references public.chats(id) on delete cascade not null,
    sender_id uuid references public.profiles(id) on delete cascade not null,
    content text,
    message_type text default 'text' check (message_type in ('text', 'image', 'video', 'voice')),
    media_url text,
    is_read boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    actor_id uuid references public.profiles(id) on delete cascade,
    type text not null check (type in (
      'friend_request_received',
      'friend_request_sent',
      'friend_request_accepted',
      'friend_request_declined',
      'chat_unlocked',
      'new_message'
    )),
    title text,
    body text,
    related_request_id uuid references public.friend_requests(id) on delete cascade,
    related_chat_id uuid references public.chats(id) on delete cascade,
    is_read boolean default false,
    created_at timestamptz default now()
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON public.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_chat ON public.chat_members(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_chat_user_read ON public.chat_members(chat_id, user_id, last_read_at);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- 3. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Friend requests
CREATE POLICY "Users can insert their own friend requests" 
  ON public.friend_requests FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their own friend requests" 
  ON public.friend_requests FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can update their own friend requests" 
  ON public.friend_requests FOR UPDATE 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Friendships
CREATE POLICY "Users can view their own friendships" 
  ON public.friendships FOR SELECT 
  USING (auth.uid() = user_id);

-- Chat Members
CREATE OR REPLACE FUNCTION public.is_chat_member(p_chat_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.chat_members 
    WHERE chat_id = p_chat_id AND user_id = auth.uid()
  );
END;
$$;

DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
CREATE POLICY "Users can view their chats" 
  ON public.chats FOR SELECT 
  USING (public.is_chat_member(id));

DROP POLICY IF EXISTS "Users can view chat members of their chats" ON public.chat_members;
CREATE POLICY "Users can view chat members of their chats" 
  ON public.chat_members FOR SELECT 
  USING (public.is_chat_member(chat_id));

DROP POLICY IF EXISTS "Users can update their own chat member read receipt" ON public.chat_members;
CREATE POLICY "Users can update their own chat member read receipt"
  ON public.chat_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view messages of their chats" ON public.messages;
CREATE POLICY "Users can view messages of their chats" 
  ON public.messages FOR SELECT 
  USING (public.is_chat_member(chat_id));

DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.messages;
CREATE POLICY "Users can insert messages in their chats" 
  ON public.messages FOR INSERT 
  WITH CHECK (public.is_chat_member(chat_id) AND auth.uid() = sender_id);

-- Notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. RPC FUNCTIONS

-- Function: send_friend_request
CREATE OR REPLACE FUNCTION public.send_friend_request(p_receiver_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_id uuid := auth.uid();
  v_sender_username text;
  v_receiver_exists boolean;
  v_friendship_exists boolean;
  v_pending_exists boolean;
  v_reverse_pending_exists boolean;
  v_request_id uuid;
BEGIN
  -- 1. Check self request
  IF v_sender_id = p_receiver_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot send request to yourself', 'status', 'self_request');
  END IF;

  -- 2. Check receiver exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_receiver_id) INTO v_receiver_exists;
  IF NOT v_receiver_exists THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- 3. Check friendship already exists
  SELECT EXISTS(SELECT 1 FROM public.friendships WHERE user_id = v_sender_id AND friend_id = p_receiver_id) INTO v_friendship_exists;
  IF v_friendship_exists THEN
    RETURN json_build_object('success', false, 'error', 'Already friends', 'status', 'friends');
  END IF;

  -- 4. Check if pending request exists
  SELECT EXISTS(SELECT 1 FROM public.friend_requests WHERE sender_id = v_sender_id AND receiver_id = p_receiver_id AND status = 'pending') INTO v_pending_exists;
  IF v_pending_exists THEN
    RETURN json_build_object('success', false, 'error', 'Request already sent', 'status', 'pending_sent');
  END IF;

  -- 5. Check if reverse pending request exists
  SELECT EXISTS(SELECT 1 FROM public.friend_requests WHERE sender_id = p_receiver_id AND receiver_id = v_sender_id AND status = 'pending') INTO v_reverse_pending_exists;
  IF v_reverse_pending_exists THEN
    RETURN json_build_object('success', true, 'message', 'Reverse request exists', 'status', 'pending_received');
  END IF;

  -- 6. Create request
  INSERT INTO public.friend_requests (sender_id, receiver_id, status)
  VALUES (v_sender_id, p_receiver_id, 'pending')
  RETURNING id INTO v_request_id;

  -- 7. Create notification for receiver
  SELECT username INTO v_sender_username FROM public.profiles WHERE id = v_sender_id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, related_request_id)
  VALUES (
    p_receiver_id, 
    v_sender_id, 
    'friend_request_received', 
    'New friend request', 
    v_sender_username || ' sent you a friend request',
    v_request_id
  );

  RETURN json_build_object('success', true, 'status', 'pending_sent', 'request_id', v_request_id);
END;
$$;


-- Function: respond_friend_request
CREATE OR REPLACE FUNCTION public.respond_friend_request(p_request_id uuid, p_action text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_receiver_id uuid := auth.uid();
  v_sender_id uuid;
  v_current_status text;
  v_receiver_username text;
  v_chat_id uuid;
BEGIN
  -- 1. Check request exists and get sender
  SELECT sender_id, status INTO v_sender_id, v_current_status 
  FROM public.friend_requests 
  WHERE id = p_request_id AND receiver_id = v_receiver_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Request not found or unauthorized');
  END IF;

  IF v_current_status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Request is already ' || v_current_status);
  END IF;

  SELECT username INTO v_receiver_username FROM public.profiles WHERE id = v_receiver_id;

  IF p_action = 'accept' THEN
    -- Update status
    UPDATE public.friend_requests SET status = 'accepted', updated_at = now() WHERE id = p_request_id;
    
    -- Insert friendships (both directions)
    INSERT INTO public.friendships (user_id, friend_id) VALUES (v_sender_id, v_receiver_id) ON CONFLICT DO NOTHING;
    INSERT INTO public.friendships (user_id, friend_id) VALUES (v_receiver_id, v_sender_id) ON CONFLICT DO NOTHING;

    -- Create or get private chat
    SELECT id INTO v_chat_id FROM public.chats c
    WHERE c.type = 'private' AND EXISTS (
      SELECT 1 FROM public.chat_members cm1 WHERE cm1.chat_id = c.id AND cm1.user_id = v_sender_id
    ) AND EXISTS (
      SELECT 1 FROM public.chat_members cm2 WHERE cm2.chat_id = c.id AND cm2.user_id = v_receiver_id
    );

    IF v_chat_id IS NULL THEN
      INSERT INTO public.chats (type) VALUES ('private') RETURNING id INTO v_chat_id;
    END IF;
    
    -- Ensure both members exist (handles both new and existing incomplete chats safely)
    INSERT INTO public.chat_members (chat_id, user_id) VALUES (v_chat_id, v_sender_id), (v_chat_id, v_receiver_id) ON CONFLICT (chat_id, user_id) DO NOTHING;

    -- Create notification for sender
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, related_request_id, related_chat_id)
    VALUES (
      v_sender_id, 
      v_receiver_id, 
      'friend_request_accepted', 
      'Friend request accepted', 
      v_receiver_username || ' accepted your friend request',
      p_request_id,
      v_chat_id
    );

    -- Recalculate and update counts for both users safely
    UPDATE public.profiles
    SET 
      following_count = (SELECT count(*) FROM public.friendships WHERE user_id = profiles.id),
      followers_count = (SELECT count(*) FROM public.friendships WHERE friend_id = profiles.id),
      updated_at = now()
    WHERE id IN (v_sender_id, v_receiver_id);

    RETURN json_build_object('success', true, 'status', 'friends', 'chat_id', v_chat_id);

  ELSIF p_action = 'decline' THEN
    -- Update status
    UPDATE public.friend_requests SET status = 'declined', updated_at = now() WHERE id = p_request_id;
    
    RETURN json_build_object('success', true, 'status', 'none');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$;


-- Function: get_or_create_private_chat
CREATE OR REPLACE FUNCTION public.get_or_create_private_chat(p_friend_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_friendship_exists boolean;
  v_chat_id uuid;
BEGIN
  -- Check friendship
  SELECT EXISTS(SELECT 1 FROM public.friendships WHERE user_id = v_user_id AND friend_id = p_friend_id) INTO v_friendship_exists;
  IF NOT v_friendship_exists THEN
    RETURN json_build_object('success', false, 'error', 'Must be friends to chat');
  END IF;

  -- Check existing chat
  SELECT id INTO v_chat_id FROM public.chats c
  WHERE c.type = 'private' AND EXISTS (
    SELECT 1 FROM public.chat_members cm1 WHERE cm1.chat_id = c.id AND cm1.user_id = v_user_id
  ) AND EXISTS (
    SELECT 1 FROM public.chat_members cm2 WHERE cm2.chat_id = c.id AND cm2.user_id = p_friend_id
  );

  IF v_chat_id IS NULL THEN
    INSERT INTO public.chats (type) VALUES ('private') RETURNING id INTO v_chat_id;
  END IF;

  INSERT INTO public.chat_members (chat_id, user_id) VALUES (v_chat_id, v_user_id), (v_chat_id, p_friend_id) ON CONFLICT (chat_id, user_id) DO NOTHING;

  RETURN json_build_object('success', true, 'chat_id', v_chat_id);
END;
$$;

-- Function: repair_private_chats
CREATE OR REPLACE FUNCTION public.repair_private_chats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_friendship record;
  v_chat_id uuid;
  v_fixed_count integer := 0;
BEGIN
  -- For each unique friendship pair (where user_id < friend_id to avoid duplicates)
  FOR v_friendship IN 
    SELECT DISTINCT LEAST(user_id, friend_id) as u1, GREATEST(user_id, friend_id) as u2 
    FROM public.friendships
  LOOP
    -- Look for a chat that has both
    SELECT id INTO v_chat_id FROM public.chats c
    WHERE c.type = 'private' AND EXISTS (
      SELECT 1 FROM public.chat_members cm1 WHERE cm1.chat_id = c.id AND cm1.user_id = v_friendship.u1
    ) AND EXISTS (
      SELECT 1 FROM public.chat_members cm2 WHERE cm2.chat_id = c.id AND cm2.user_id = v_friendship.u2
    );

    -- If no such chat exists, look for one that has at least one of them, or create a new one
    IF v_chat_id IS NULL THEN
      INSERT INTO public.chats (type) VALUES ('private') RETURNING id INTO v_chat_id;
      v_fixed_count := v_fixed_count + 1;
    END IF;

    -- Ensure both members are correctly inserted
    INSERT INTO public.chat_members (chat_id, user_id) 
    VALUES (v_chat_id, v_friendship.u1), (v_chat_id, v_friendship.u2) 
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  END LOOP;

  RETURN json_build_object('success', true, 'chats_created_or_fixed', v_fixed_count);
END;
$$;


-- Function: mark_notifications_read
CREATE OR REPLACE FUNCTION public.mark_notifications_read()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_updated_count integer;
BEGIN
  UPDATE public.notifications 
  SET is_read = true 
  WHERE user_id = v_user_id AND is_read = false;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true, 
    'notifications_marked', v_updated_count
  );
END;
$$;

-- Function: check_chat_access
CREATE OR REPLACE FUNCTION public.check_chat_access(p_chat_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_access boolean;
BEGIN
  SELECT public.is_chat_member(p_chat_id) INTO v_has_access;
  RETURN json_build_object('success', true, 'has_access', v_has_access);
END;
$$;


-- Function: send_chat_message
CREATE OR REPLACE FUNCTION public.send_chat_message(p_chat_id uuid, p_content text, p_message_type text DEFAULT 'text')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_id uuid := auth.uid();
  v_is_member boolean;
  v_message record;
  v_receiver_id uuid;
  v_sender_username text;
  v_preview text;
BEGIN
  -- 1. Check if sender is a member of the chat
  SELECT EXISTS(
    SELECT 1 FROM public.chat_members 
    WHERE chat_id = p_chat_id AND user_id = v_sender_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN json_build_object('success', false, 'error', 'Not a member of this chat');
  END IF;

  -- 2. Insert message and return full record
  INSERT INTO public.messages (chat_id, sender_id, content, message_type)
  VALUES (p_chat_id, v_sender_id, p_content, p_message_type)
  RETURNING * INTO v_message;

  -- 3. Update chat updated_at
  UPDATE public.chats SET updated_at = now() WHERE id = p_chat_id;

  -- 4. Find receiver (assuming 1-on-1 private chat for now)
  SELECT user_id INTO v_receiver_id 
  FROM public.chat_members 
  WHERE chat_id = p_chat_id AND user_id != v_sender_id 
  LIMIT 1;

  -- 5. Create notification if receiver exists
  IF v_receiver_id IS NOT NULL THEN
    SELECT username INTO v_sender_username FROM public.profiles WHERE id = v_sender_id;
    
    -- Generate preview (first 40 chars)
    IF length(p_content) > 40 THEN
      v_preview := substring(p_content from 1 for 37) || '...';
    ELSE
      v_preview := p_content;
    END IF;

    -- Try creating notification safely without blocking message
    BEGIN
      INSERT INTO public.notifications (user_id, actor_id, type, title, body, related_chat_id)
      VALUES (
        v_receiver_id, 
        v_sender_id, 
        'new_message', 
        'New message from ' || v_sender_username, 
        v_preview,
        p_chat_id
      );
    EXCEPTION WHEN OTHERS THEN
      -- Ignore notification failure so message sending succeeds
    END;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'message', row_to_json(v_message)
  );
END;
$$;


-- Function: refresh_profile_counts
CREATE OR REPLACE FUNCTION public.refresh_profile_counts(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_following_count integer;
  v_followers_count integer;
BEGIN
  UPDATE public.profiles
  SET 
    following_count = (SELECT count(*) FROM public.friendships WHERE user_id = p_user_id),
    followers_count = (SELECT count(*) FROM public.friendships WHERE friend_id = p_user_id),
    updated_at = now()
  WHERE id = p_user_id
  RETURNING following_count, followers_count INTO v_following_count, v_followers_count;

  RETURN json_build_object(
    'success', true, 
    'following_count', v_following_count,
    'followers_count', v_followers_count
  );
END;
$$;


-- Function: refresh_all_profile_counts
CREATE OR REPLACE FUNCTION public.refresh_all_profile_counts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count integer;
BEGIN
  UPDATE public.profiles
  SET 
    following_count = (SELECT count(*) FROM public.friendships WHERE user_id = profiles.id),
    followers_count = (SELECT count(*) FROM public.friendships WHERE friend_id = profiles.id),
    updated_at = now();
    
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN json_build_object(
    'success', true, 
    'profiles_updated', v_updated_count
  );
END;
$$;
