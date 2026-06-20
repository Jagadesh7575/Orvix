ALTER TABLE public.chat_members
ADD COLUMN IF NOT EXISTS last_read_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_chat_members_chat_user_read
ON public.chat_members(chat_id, user_id, last_read_at);

DROP POLICY IF EXISTS "Users can update their own chat member read receipt" ON public.chat_members;
CREATE POLICY "Users can update their own chat member read receipt"
ON public.chat_members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
