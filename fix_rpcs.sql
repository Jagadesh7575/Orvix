-- UNFOLLOW RPC
CREATE OR REPLACE FUNCTION public.unfollow_user(p_target_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_deleted_count integer;
BEGIN
  DELETE FROM public.friendships 
  WHERE (user_id = v_user_id AND friend_id = p_target_id)
     OR (user_id = p_target_id AND friend_id = v_user_id);
     
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  PERFORM public.refresh_profile_counts(v_user_id);
  PERFORM public.refresh_profile_counts(p_target_id);

  RETURN json_build_object('success', true, 'status', 'none');
END;
$$;

-- REMOVE FOLLOWER RPC
CREATE OR REPLACE FUNCTION public.remove_follower(p_follower_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_deleted_count integer;
BEGIN
  -- We delete both directions because friendship in Orvix is mutual. 
  -- Removing a follower fully disconnects them.
  DELETE FROM public.friendships 
  WHERE (user_id = p_follower_id AND friend_id = v_user_id)
     OR (user_id = v_user_id AND friend_id = p_follower_id);
     
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count = 0 THEN
    RETURN json_build_object('success', false, 'error', 'This user is not your follower.');
  END IF;

  PERFORM public.refresh_profile_counts(v_user_id);
  PERFORM public.refresh_profile_counts(p_follower_id);

  RETURN json_build_object('success', true, 'status', 'none');
END;
$$;

-- BLOCK USER RPC
CREATE OR REPLACE FUNCTION public.block_user(p_target_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  INSERT INTO public.blocked_users (blocker_id, blocked_id) 
  VALUES (v_user_id, p_target_id)
  ON CONFLICT DO NOTHING;

  DELETE FROM public.friendships 
  WHERE (user_id = v_user_id AND friend_id = p_target_id)
     OR (user_id = p_target_id AND friend_id = v_user_id);

  DELETE FROM public.friend_requests
  WHERE (sender_id = v_user_id AND receiver_id = p_target_id)
     OR (sender_id = p_target_id AND receiver_id = v_user_id);

  PERFORM public.refresh_profile_counts(v_user_id);
  PERFORM public.refresh_profile_counts(p_target_id);

  RETURN json_build_object('success', true, 'status', 'blocked');
END;
$$;
