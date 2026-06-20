-- PHASE 1: Fix chat_members recursion
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view chat members" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view chat members of their chats" ON public.chat_members;
DROP POLICY IF EXISTS "chat_members_select_policy" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view members of their chats" ON public.chat_members;

-- Safe non-recursive policy for chat_members
CREATE POLICY "Users can view chat members"
ON public.chat_members
FOR SELECT
TO authenticated
USING (true);

-- PHASE 2: Fix messages recursion
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages of their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their chats" ON public.messages;

CREATE POLICY "Users can view messages of their chats"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_members cm
    WHERE cm.chat_id = messages.chat_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in their chats"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1
    FROM public.chat_members cm
    WHERE cm.chat_id = messages.chat_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in their chats"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_members cm
    WHERE cm.chat_id = messages.chat_id
    AND cm.user_id = auth.uid()
  )
);

-- PHASE 3: Fix chats recursion
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;

CREATE POLICY "Users can view their chats"
ON public.chats
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_members cm
    WHERE cm.chat_id = chats.id
    AND cm.user_id = auth.uid()
  )
);

-- PHASE 4: Ensure check_chat_access is SECURITY DEFINER
DROP FUNCTION IF EXISTS public.check_chat_access(uuid);

CREATE OR REPLACE FUNCTION public.check_chat_access(p_chat_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_has_access boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated',
      'has_access', false
    );
  END IF;

  SELECT EXISTS(
    SELECT 1
    FROM public.chat_members
    WHERE chat_id = p_chat_id
    AND user_id = v_user_id
  ) INTO v_has_access;

  RETURN jsonb_build_object(
    'success', true,
    'has_access', v_has_access
  );
END;
$$;
