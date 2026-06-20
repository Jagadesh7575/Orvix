-- PHASE 2: Fix check_chat_access
CREATE OR REPLACE FUNCTION public.check_chat_access(p_chat_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_has_access boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated', 'has_access', false);
  END IF;

  SELECT EXISTS(
    SELECT 1
    FROM public.chat_members
    WHERE chat_id = p_chat_id
    AND user_id = v_user_id
  ) INTO v_has_access;

  RETURN jsonb_build_object('success', true, 'has_access', v_has_access);
END;
$$;

-- PHASE 3: Canonical chat resolver and redirect table
CREATE TABLE IF NOT EXISTS public.chat_id_redirects (
  old_chat_id uuid PRIMARY KEY,
  new_chat_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Note: Since the duplicates were already merged previously, 
-- you may want to manually populate chat_id_redirects if you have the old IDs,
-- but this function handles the lookup gracefully going forward.
CREATE OR REPLACE FUNCTION public.resolve_chat_for_current_user(p_chat_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_has_access boolean;
  v_new_chat_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated', 'has_access', false);
  END IF;

  -- 1. Check if user is already a member of the requested chat
  SELECT EXISTS(
    SELECT 1 FROM public.chat_members
    WHERE chat_id = p_chat_id AND user_id = v_user_id
  ) INTO v_has_access;

  IF v_has_access THEN
    RETURN jsonb_build_object('success', true, 'chat_id', p_chat_id, 'has_access', true);
  END IF;

  -- 2. Check if there's a redirect for this chat
  SELECT new_chat_id INTO v_new_chat_id
  FROM public.chat_id_redirects
  WHERE old_chat_id = p_chat_id
  LIMIT 1;

  IF v_new_chat_id IS NOT NULL THEN
    -- Verify access on the new chat
    SELECT EXISTS(
      SELECT 1 FROM public.chat_members
      WHERE chat_id = v_new_chat_id AND user_id = v_user_id
    ) INTO v_has_access;

    IF v_has_access THEN
      RETURN jsonb_build_object('success', true, 'chat_id', v_new_chat_id, 'has_access', true, 'redirected', true);
    END IF;
  END IF;

  -- If neither works, access is denied
  RETURN jsonb_build_object('success', false, 'error', 'You are not a member of this chat', 'has_access', false);
END;
$$;
