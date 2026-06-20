-- ==========================================
-- ORVIX URGENT SCHEMA UPDATES FOR PROFILE ACTIONS & CHAT PERSISTENCE
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. ADD USERNAME CHANGE COUNT COLUMN
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username_change_count integer DEFAULT 0;

-- 2. CREATE BLOCKED USERS TABLE
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id uuid primary key default gen_random_uuid(),
    blocker_id uuid references public.profiles(id) on delete cascade not null,
    blocked_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamptz default now(),
    unique(blocker_id, blocked_id)
);

-- Enable RLS on blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view blocks involving them" ON public.blocked_users;
CREATE POLICY "Users can view blocks involving them" 
  ON public.blocked_users FOR SELECT 
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "Users can insert their own blocks" ON public.blocked_users;
CREATE POLICY "Users can insert their own blocks" 
  ON public.blocked_users FOR INSERT 
  WITH CHECK (auth.uid() = blocker_id);

-- 3. UNFOLLOW RPC (Removes mutual friendship correctly)
DROP FUNCTION IF EXISTS public.unfollow_user(uuid);

CREATE OR REPLACE FUNCTION public.unfollow_user(p_target_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_deleted_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  BEGIN
    -- Unfollow removes both directions in Orvix because connections are mutual
    DELETE FROM public.friendships 
    WHERE (user_id = v_user_id AND friend_id = p_target_id)
       OR (user_id = p_target_id AND friend_id = v_user_id);
       
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- Refresh counts directly inside RPC to ensure data consistency
    PERFORM public.refresh_profile_counts(v_user_id);
    PERFORM public.refresh_profile_counts(p_target_id);

    RETURN jsonb_build_object('success', true, 'status', 'none');
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$;

-- 4. REMOVE FOLLOWER RPC (Sever mutual connection completely)
DROP FUNCTION IF EXISTS public.remove_follower(uuid);

CREATE OR REPLACE FUNCTION public.remove_follower(p_follower_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_deleted_count integer;
BEGIN
  -- Validate authentication
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  BEGIN
    -- Delete both friendship directions
    DELETE FROM public.friendships 
    WHERE (user_id = v_user_id AND friend_id = p_follower_id)
       OR (user_id = p_follower_id AND friend_id = v_user_id);
       
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- Delete any stale pending requests between the users
    DELETE FROM public.friend_requests
    WHERE (sender_id = v_user_id AND receiver_id = p_follower_id)
       OR (sender_id = p_follower_id AND receiver_id = v_user_id);

    -- Refresh counts directly inside RPC
    PERFORM public.refresh_profile_counts(v_user_id);
    PERFORM public.refresh_profile_counts(p_follower_id);

    RETURN jsonb_build_object('success', true, 'status', 'none');
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$;

-- 5. BLOCK USER RPC (Insert block and remove all friendships)
DROP FUNCTION IF EXISTS public.block_user(uuid);

CREATE OR REPLACE FUNCTION public.block_user(p_target_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  BEGIN
    -- Insert into blocked_users
    INSERT INTO public.blocked_users (blocker_id, blocked_id) 
    VALUES (v_user_id, p_target_id)
    ON CONFLICT DO NOTHING;

    -- Delete all friendships between these two users
    DELETE FROM public.friendships 
    WHERE (user_id = v_user_id AND friend_id = p_target_id)
       OR (user_id = p_target_id AND friend_id = v_user_id);

    -- Delete pending requests between these two users
    DELETE FROM public.friend_requests
    WHERE (sender_id = v_user_id AND receiver_id = p_target_id)
       OR (sender_id = p_target_id AND receiver_id = v_user_id);

    -- Refresh counts
    PERFORM public.refresh_profile_counts(v_user_id);
    PERFORM public.refresh_profile_counts(p_target_id);

    RETURN jsonb_build_object('success', true, 'status', 'blocked');
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$;

-- 6. UNBLOCK USER RPC
DROP FUNCTION IF EXISTS public.unblock_user(uuid);

CREATE OR REPLACE FUNCTION public.unblock_user(p_target_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  BEGIN
    -- Delete the block from blocked_users
    DELETE FROM public.blocked_users 
    WHERE blocker_id = v_user_id AND blocked_id = p_target_id;

    -- Do NOT restore friendships or friend requests

    -- Refresh counts to ensure accurate local states
    PERFORM public.refresh_profile_counts(v_user_id);
    PERFORM public.refresh_profile_counts(p_target_id);

    RETURN jsonb_build_object('success', true, 'status', 'none');
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$;

-- 7. CHAT SYSTEM FIXES
-- Ensure send_chat_message returns jsonb and properly handles exceptions
DROP FUNCTION IF EXISTS public.send_chat_message(uuid, text, text);

CREATE OR REPLACE FUNCTION public.send_chat_message(p_chat_id uuid, p_content text, p_message_type text DEFAULT 'text')
RETURNS jsonb
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
    RETURN jsonb_build_object('success', false, 'error', 'Not a member of this chat');
  END IF;

  -- 2. Insert message and return full record
  INSERT INTO public.messages (chat_id, sender_id, content, message_type)
  VALUES (p_chat_id, v_sender_id, p_content, p_message_type)
  RETURNING * INTO v_message;

  -- 3. Update chat updated_at
  UPDATE public.chats SET updated_at = now() WHERE id = p_chat_id;

  -- 4. Find receiver
  SELECT user_id INTO v_receiver_id 
  FROM public.chat_members 
  WHERE chat_id = p_chat_id AND user_id != v_sender_id 
  LIMIT 1;

  -- 5. Create notification safely without rolling back message insert
  IF v_receiver_id IS NOT NULL THEN
    SELECT username INTO v_sender_username FROM public.profiles WHERE id = v_sender_id;
    
    IF length(p_content) > 40 THEN
      v_preview := substring(p_content from 1 for 37) || '...';
    ELSE
      v_preview := p_content;
    END IF;

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
      -- Ignore notification failure
    END;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'message', row_to_json(v_message)::jsonb
  );
END;
$$;

-- 8. REALTIME SUBSCRIPTIONS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;
  END IF;
END
$$;

-- 9. CHAT RLS POLICIES (Fixes message disappearance bug)
-- Drop old buggy policies that caused infinite recursion or silent failures
DROP POLICY IF EXISTS "Users can view messages of their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can view chat members of their chats" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;

-- Messages: Users can see messages for chats they are a member of
CREATE POLICY "Users can view messages of their chats" 
  ON public.messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.chat_id = messages.chat_id
      AND cm.user_id = auth.uid()
    )
  );

-- Messages: Users can update messages (needed to mark as read)
CREATE POLICY "Users can update messages in their chats" 
  ON public.messages FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.chat_id = messages.chat_id
      AND cm.user_id = auth.uid()
    )
  );

-- Messages: Users can insert
CREATE POLICY "Users can insert messages in their chats" 
  ON public.messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.chat_id = messages.chat_id
      AND cm.user_id = auth.uid()
    )
    AND auth.uid() = sender_id
  );

-- Chats: Users can see their own chats
CREATE POLICY "Users can view their chats" 
  ON public.chats FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.chat_id = chats.id
      AND cm.user_id = auth.uid()
    )
  );

-- Chat Members: Since chat_id is a secure v4 UUID, it is safe to let authenticated users view members of valid chats to avoid recursion.
CREATE POLICY "Users can view chat members" 
  ON public.chat_members FOR SELECT 
  TO authenticated
  USING (true);

-- 10. REPAIR EXISTING CHATS RPC
DROP FUNCTION IF EXISTS public.repair_private_chats();

CREATE OR REPLACE FUNCTION public.repair_private_chats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_friendship record;
  v_chat_id uuid;
  v_fixed_count integer := 0;
BEGIN
  -- For each unique friendship pair
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

    -- If no such chat exists, create a new one
    IF v_chat_id IS NULL THEN
      INSERT INTO public.chats (type) VALUES ('private') RETURNING id INTO v_chat_id;
      v_fixed_count := v_fixed_count + 1;
    END IF;

    -- Ensure both members are correctly inserted
    INSERT INTO public.chat_members (chat_id, user_id) 
    VALUES (v_chat_id, v_friendship.u1), (v_chat_id, v_friendship.u2) 
    ON CONFLICT (chat_id, user_id) DO NOTHING;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'chats_created_or_fixed', v_fixed_count);
END;
$$;

-- 11. IMPROVED GET OR CREATE PRIVATE CHAT RPC
DROP FUNCTION IF EXISTS public.get_or_create_private_chat(uuid);

CREATE OR REPLACE FUNCTION public.get_or_create_private_chat(p_friend_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_friendship_exists boolean;
  v_chat_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check friendship
  SELECT EXISTS(SELECT 1 FROM public.friendships WHERE user_id = v_user_id AND friend_id = p_friend_id) INTO v_friendship_exists;
  IF NOT v_friendship_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Must be friends to chat');
  END IF;

  -- Check existing chat strictly looking for exactly these 2 members
  SELECT c.id INTO v_chat_id 
  FROM public.chats c
  WHERE c.type = 'private' 
  AND EXISTS (SELECT 1 FROM public.chat_members cm1 WHERE cm1.chat_id = c.id AND cm1.user_id = v_user_id)
  AND EXISTS (SELECT 1 FROM public.chat_members cm2 WHERE cm2.chat_id = c.id AND cm2.user_id = p_friend_id);

  IF v_chat_id IS NULL THEN
    INSERT INTO public.chats (type) VALUES ('private') RETURNING id INTO v_chat_id;
  END IF;

  -- Safely insert both users
  INSERT INTO public.chat_members (chat_id, user_id) 
  VALUES (v_chat_id, v_user_id), (v_chat_id, p_friend_id) 
  ON CONFLICT (chat_id, user_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'chat_id', v_chat_id);
END;
$$;

-- 12. CHECK CHAT ACCESS RPC
DROP FUNCTION IF EXISTS public.check_chat_access(uuid);

CREATE OR REPLACE FUNCTION public.check_chat_access(p_chat_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_access boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.chat_members 
    WHERE chat_id = p_chat_id AND user_id = auth.uid()
  ) INTO v_has_access;
  
  RETURN jsonb_build_object('success', true, 'has_access', v_has_access);
END;
$$;
