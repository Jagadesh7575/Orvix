-- ==========================================
-- ORVIX FOLLOWERS / FOLLOWING BUG FIX (CORRECTED)
-- Safety measures, block checks, and hardened RPCs
-- ==========================================

-- 1. Create a safe backup before deleting anything
CREATE TABLE IF NOT EXISTS public.friendships_backup AS 
SELECT * FROM public.friendships;

ALTER TABLE public.friendships_backup ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No public access friendships backup" ON public.friendships_backup;
CREATE POLICY "No public access friendships backup"
ON public.friendships_backup
FOR ALL
USING (false)
WITH CHECK (false);


-- 2. Clean up corrupted rows: Delete friendships that exist while the request is still pending
-- Do NOT delete valid friendships where there is no pending request.
DELETE FROM public.friendships f
WHERE EXISTS (
  SELECT 1 FROM public.friend_requests req
  WHERE req.status = 'pending' 
    AND (
      (req.sender_id = f.user_id AND req.receiver_id = f.friend_id) OR
      (req.sender_id = f.friend_id AND req.receiver_id = f.user_id)
    )
);

-- ==========================================
-- 3. FIXED RPC: send_friend_request
-- Strict rule: Creates ONLY the pending request and notification.
-- Checks blocked_users both directions.
-- ==========================================
DROP FUNCTION IF EXISTS public.send_friend_request(uuid);
CREATE OR REPLACE FUNCTION public.send_friend_request(p_receiver_id uuid)
RETURNS jsonb
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
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send request to yourself', 'status', 'self_request');
  END IF;

  -- 2. Check receiver exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_receiver_id) INTO v_receiver_exists;
  IF NOT v_receiver_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- 3. Check for blocks (both directions)
  IF EXISTS (SELECT 1 FROM public.blocked_users WHERE blocker_id = v_sender_id AND blocked_id = p_receiver_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have blocked this user', 'status', 'blocked');
  END IF;

  IF EXISTS (SELECT 1 FROM public.blocked_users WHERE blocker_id = p_receiver_id AND blocked_id = v_sender_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have been blocked by this user', 'status', 'blocked_by');
  END IF;

  -- 4. Check friendship already exists
  SELECT EXISTS(SELECT 1 FROM public.friendships WHERE user_id = v_sender_id AND friend_id = p_receiver_id) INTO v_friendship_exists;
  IF v_friendship_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already friends', 'status', 'friends');
  END IF;

  -- 5. Check if pending request exists
  SELECT EXISTS(SELECT 1 FROM public.friend_requests WHERE sender_id = v_sender_id AND receiver_id = p_receiver_id AND status = 'pending') INTO v_pending_exists;
  IF v_pending_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already sent', 'status', 'pending_sent');
  END IF;

  -- 6. Check if reverse pending request exists
  SELECT EXISTS(SELECT 1 FROM public.friend_requests WHERE sender_id = p_receiver_id AND receiver_id = v_sender_id AND status = 'pending') INTO v_reverse_pending_exists;
  IF v_reverse_pending_exists THEN
    RETURN jsonb_build_object('success', true, 'message', 'Reverse request exists', 'status', 'pending_received');
  END IF;

  -- 7. Create request safely (NO FRIENDSHIP INSERTS HERE)
  INSERT INTO public.friend_requests (sender_id, receiver_id, status)
  VALUES (v_sender_id, p_receiver_id, 'pending')
  RETURNING id INTO v_request_id;

  -- 8. Create notification for receiver
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

  RETURN jsonb_build_object('success', true, 'status', 'pending_sent', 'request_id', v_request_id);
END;
$$;


-- ==========================================
-- 4. FIXED RPC: respond_friend_request
-- Strict rule: Creates friendships and updates counts ONLY if accepted.
-- ==========================================
DROP FUNCTION IF EXISTS public.respond_friend_request(uuid, text);
CREATE OR REPLACE FUNCTION public.respond_friend_request(p_request_id uuid, p_action text)
RETURNS jsonb
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
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or unauthorized');
  END IF;

  IF v_current_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request is already ' || v_current_status);
  END IF;

  SELECT username INTO v_receiver_username FROM public.profiles WHERE id = v_receiver_id;

  IF p_action IN ('accept', 'accepted') THEN
    -- Update status
    UPDATE public.friend_requests SET status = 'accepted', updated_at = now() WHERE id = p_request_id;
    
    -- Insert friendships safely (both directions)
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
    
    -- Ensure both members exist safely
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

    -- Recalculate and update counts for both users safely based ONLY on accepted friendships
    PERFORM public.refresh_profile_counts(v_sender_id);
    PERFORM public.refresh_profile_counts(v_receiver_id);

    RETURN jsonb_build_object('success', true, 'status', 'friends', 'chat_id', v_chat_id);

  ELSIF p_action IN ('decline', 'declined', 'delete') THEN
    -- Update status
    UPDATE public.friend_requests SET status = 'declined', updated_at = now() WHERE id = p_request_id;
    
    RETURN jsonb_build_object('success', true, 'status', 'none');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$;


-- ==========================================
-- 5. FIXED RPC: refresh_profile_counts
-- Strict rule: Followers/Following strictly counts from the friendships table only.
-- ==========================================
DROP FUNCTION IF EXISTS public.refresh_profile_counts(uuid);
CREATE OR REPLACE FUNCTION public.refresh_profile_counts(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_following_count integer;
  v_followers_count integer;
BEGIN
  -- Strict count based ONLY on accepted mutual friendships
  SELECT count(*) INTO v_following_count FROM public.friendships WHERE user_id = p_user_id;
  SELECT count(*) INTO v_followers_count FROM public.friendships WHERE friend_id = p_user_id;

  UPDATE public.profiles
  SET 
    following_count = v_following_count,
    followers_count = v_followers_count,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'following_count', v_following_count,
    'followers_count', v_followers_count
  );
END;
$$;

-- Force a global recalculation to instantly clean up profile counts using the safe logic
UPDATE public.profiles p
SET 
  following_count = (SELECT count(*) FROM public.friendships WHERE user_id = p.id),
  followers_count = (SELECT count(*) FROM public.friendships WHERE friend_id = p.id),
  updated_at = now();
