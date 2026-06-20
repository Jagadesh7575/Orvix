-- Orvix Phase 1: HD Image Media System Migration
-- Run this in your Supabase SQL Editor carefully.

-- 1. Add new media metadata columns safely to the messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_key text,
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS thumbnail_key text,
ADD COLUMN IF NOT EXISTS file_name text,
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD COLUMN IF NOT EXISTS mime_type text,
ADD COLUMN IF NOT EXISTS media_width integer,
ADD COLUMN IF NOT EXISTS media_height integer,
ADD COLUMN IF NOT EXISTS media_duration numeric,
ADD COLUMN IF NOT EXISTS upload_status text DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS storage_provider text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS caption text;

-- (The message_type column already exists with 'image' as an allowed value based on the existing schema)

-- 2. Create a secure RPC for sending media messages without risking the original text logic.
CREATE OR REPLACE FUNCTION public.send_media_message(
    p_chat_id uuid,
    p_content text, -- Can be caption
    p_message_type text,
    p_media_url text,
    p_media_key text,
    p_thumbnail_url text,
    p_thumbnail_key text,
    p_file_name text,
    p_file_size bigint,
    p_mime_type text,
    p_media_width integer,
    p_media_height integer,
    p_storage_provider text DEFAULT 'none',
    p_upload_status text DEFAULT 'sent',
    p_caption text DEFAULT NULL
)
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

  -- 2. Insert message with metadata
  INSERT INTO public.messages (
      chat_id, sender_id, content, message_type, 
      media_url, media_key, thumbnail_url, thumbnail_key,
      file_name, file_size, mime_type, media_width, media_height,
      storage_provider, upload_status, caption
  )
  VALUES (
      p_chat_id, v_sender_id, p_content, p_message_type,
      p_media_url, p_media_key, p_thumbnail_url, p_thumbnail_key,
      p_file_name, p_file_size, p_mime_type, p_media_width, p_media_height,
      p_storage_provider, p_upload_status, p_caption
  )
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
    
    -- Generate preview based on type
    IF p_message_type = 'image' THEN
        v_preview := 'Sent a photo';
    ELSE
        IF length(p_content) > 40 THEN
          v_preview := substring(p_content from 1 for 37) || '...';
        ELSE
          v_preview := p_content;
        END IF;
    END IF;

    -- Try creating notification safely
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
