-- migration.sql
-- Fixes message persistence issues and discover-to-chat flow

-- 1. Fix get_or_create_private_chat to allow non-friends to chat from Discover
CREATE OR REPLACE FUNCTION public.get_or_create_private_chat(p_friend_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_chat_id uuid;
BEGIN
  -- We NO LONGER check friendship here so users can chat from Discover search directly

  -- Check existing chat between the two users
  SELECT id INTO v_chat_id FROM public.chats c
  WHERE c.type = 'private' AND EXISTS (
    SELECT 1 FROM public.chat_members cm1 WHERE cm1.chat_id = c.id AND cm1.user_id = v_user_id
  ) AND EXISTS (
    SELECT 1 FROM public.chat_members cm2 WHERE cm2.chat_id = c.id AND cm2.user_id = p_friend_id
  );

  IF v_chat_id IS NULL THEN
    INSERT INTO public.chats (type) VALUES ('private') RETURNING id INTO v_chat_id;
  END IF;

  INSERT INTO public.chat_members (chat_id, user_id) 
  VALUES (v_chat_id, v_user_id), (v_chat_id, p_friend_id) 
  ON CONFLICT (chat_id, user_id) DO NOTHING;

  RETURN json_build_object('success', true, 'chat_id', v_chat_id);
END;
$$;

-- 2. Fix RLS for Messages so they don't disappear on fetch
-- We replace the SECURITY DEFINER function with direct EXISTS checks in the policies

DROP POLICY IF EXISTS "Users can view their chats" ON public.chats;
CREATE POLICY "Users can view their chats" 
  ON public.chats FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members 
      WHERE chat_id = chats.id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view chat members of their chats" ON public.chat_members;
CREATE POLICY "Users can view chat members of their chats" 
  ON public.chat_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members cm 
      WHERE cm.chat_id = chat_members.chat_id AND cm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view messages of their chats" ON public.messages;
CREATE POLICY "Users can view messages of their chats" 
  ON public.messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members 
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their chats" ON public.messages;
CREATE POLICY "Users can insert messages in their chats" 
  ON public.messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_members 
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    ) 
    AND auth.uid() = sender_id
  );

-- 3. Add missing UPDATE policy for messages (needed for marking as read)
DROP POLICY IF EXISTS "Users can update messages in their chats" ON public.messages;
CREATE POLICY "Users can update messages in their chats" 
  ON public.messages FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members 
      WHERE chat_id = messages.chat_id AND user_id = auth.uid()
    )
  );

-- Also ensure chat_members has an insert policy so users can be added if needed by other logic (though RPC handles it usually)
DROP POLICY IF EXISTS "Users can insert chat members" ON public.chat_members;
CREATE POLICY "Users can insert chat members"
  ON public.chat_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
