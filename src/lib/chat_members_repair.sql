-- ==========================================
-- ORVIX SAFER CHAT MEMBERS REPAIR & DEDUPLICATION
-- 1. DO NOT GUESS MISSING MEMBERS. USE NOTIFICATIONS AS PROOF.
-- 2. BACKUP TABLES CREATED BEFORE MUTATION.
-- 3. NOTIFICATIONS UPDATED ON MERGE.
-- ==========================================

-- 1. CREATE BACKUP TABLES
CREATE TABLE IF NOT EXISTS public.chat_members_backup_before_repair AS SELECT * FROM public.chat_members;
CREATE TABLE IF NOT EXISTS public.chats_backup_before_repair AS SELECT * FROM public.chats;
CREATE TABLE IF NOT EXISTS public.messages_backup_before_repair AS SELECT * FROM public.messages;

-- 2. READ-ONLY DIAGNOSTIC VIEW
DROP VIEW IF EXISTS public.diagnostic_broken_chats;
CREATE VIEW public.diagnostic_broken_chats AS
SELECT 
  c.id as chat_id,
  (SELECT count(*) FROM public.chat_members WHERE chat_id = c.id) as member_count,
  array(SELECT p.username FROM public.chat_members cm JOIN public.profiles p ON p.id = cm.user_id WHERE cm.chat_id = c.id) as members,
  (SELECT count(*) FROM public.messages WHERE chat_id = c.id) as message_count,
  (SELECT content FROM public.messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as latest_message,
  (SELECT array[actor_id::text, user_id::text] FROM public.notifications WHERE related_chat_id = c.id AND type = 'new_message' LIMIT 1) as notification_pair
FROM public.chats c
WHERE c.type = 'private';

-- 3. CLEAN EXISTING EXACT DUPLICATE ROWS IN CHAT MEMBERS
DELETE FROM public.chat_members a USING (
    SELECT MIN(ctid) as ctid, chat_id, user_id
    FROM public.chat_members 
    GROUP BY chat_id, user_id HAVING COUNT(*) > 1
) b
WHERE a.chat_id = b.chat_id AND a.user_id = b.user_id AND a.ctid <> b.ctid;

-- 4. ADD STRICT UNIQUE CONSTRAINT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_members_chat_user_key'
  ) THEN
    ALTER TABLE public.chat_members ADD CONSTRAINT chat_members_chat_user_key UNIQUE(chat_id, user_id);
  END IF;
END $$;

-- 5. REWRITE GET_OR_CREATE_PRIVATE_CHAT (SAFE & STRICT)
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

  SELECT EXISTS(SELECT 1 FROM public.friendships WHERE user_id = v_user_id AND friend_id = p_friend_id) INTO v_friendship_exists;
  IF NOT v_friendship_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Must be friends to chat');
  END IF;

  -- Strict search: exact unordered pair, must have exactly 2 members total
  SELECT c.id INTO v_chat_id 
  FROM public.chats c
  WHERE c.type = 'private' 
  AND (SELECT count(*) FROM public.chat_members WHERE chat_id = c.id) = 2
  AND EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = c.id AND user_id = v_user_id)
  AND EXISTS (SELECT 1 FROM public.chat_members WHERE chat_id = c.id AND user_id = p_friend_id)
  LIMIT 1;

  IF v_chat_id IS NULL THEN
    INSERT INTO public.chats (type, created_by) VALUES ('private', v_user_id) RETURNING id INTO v_chat_id;
  END IF;

  -- Safe insert with ON CONFLICT DO NOTHING
  INSERT INTO public.chat_members (chat_id, user_id) 
  VALUES (v_chat_id, v_user_id), (v_chat_id, p_friend_id) 
  ON CONFLICT ON CONSTRAINT chat_members_chat_user_key DO NOTHING;

  RETURN jsonb_build_object('success', true, 'chat_id', v_chat_id);
END;
$$;

-- 6. CREATE SAFER REPAIR RPC (NO GUESSING)
DROP FUNCTION IF EXISTS public.repair_private_chats_safer();

CREATE OR REPLACE FUNCTION public.repair_private_chats_safer()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_chat record;
  v_notif record;
  v_pair record;
  v_dup record;
  v_canonical_id uuid;
  v_moved_count integer;
  v_notif_count integer;
  
  v_repaired_pairs integer := 0;
  v_moved_messages integer := 0;
  v_updated_notifications integer := 0;
  v_deleted_chats integer := 0;
  v_unsafe integer := 0;
BEGIN
  -- PASS 1: Identify missing members using rock-solid notifications evidence
  FOR v_chat IN 
    SELECT c.id, (SELECT count(*) FROM public.chat_members WHERE chat_id = c.id) as m_count
    FROM public.chats c WHERE c.type = 'private'
  LOOP
    IF v_chat.m_count < 2 THEN
      -- Try to find exact notification evidence for this exact chat
      SELECT actor_id, user_id INTO v_notif 
      FROM public.notifications 
      WHERE related_chat_id = v_chat.id AND type = 'new_message' LIMIT 1;
      
      IF FOUND THEN
        -- Safely enforce both members
        INSERT INTO public.chat_members (chat_id, user_id) VALUES (v_chat.id, v_notif.actor_id) ON CONFLICT ON CONSTRAINT chat_members_chat_user_key DO NOTHING;
        INSERT INTO public.chat_members (chat_id, user_id) VALUES (v_chat.id, v_notif.user_id) ON CONFLICT ON CONSTRAINT chat_members_chat_user_key DO NOTHING;
      ELSE
        -- No notification proof found. Do NOT guess. Mark as unsafe if it has messages.
        IF (SELECT count(*) FROM public.messages WHERE chat_id = v_chat.id) > 0 THEN
          v_unsafe := v_unsafe + 1;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- PASS 2: Merge duplicate chats that possess EXACTLY the same 2 members
  CREATE TEMP TABLE temp_chat_pairs ON COMMIT DROP AS
  SELECT 
    chat_id, 
    LEAST(MIN(user_id), MAX(user_id)) as u1, 
    GREATEST(MIN(user_id), MAX(user_id)) as u2
  FROM public.chat_members
  GROUP BY chat_id
  HAVING count(*) = 2 AND MIN(user_id) <> MAX(user_id);
  
  FOR v_pair IN 
    SELECT u1, u2 FROM temp_chat_pairs GROUP BY u1, u2 HAVING count(*) > 1
  LOOP
    v_canonical_id := NULL;
    
    FOR v_dup IN 
      SELECT tcp.chat_id, (SELECT count(*) FROM public.messages WHERE chat_id = tcp.chat_id) as msg_count, c.updated_at
      FROM temp_chat_pairs tcp
      JOIN public.chats c ON c.id = tcp.chat_id
      WHERE tcp.u1 = v_pair.u1 AND tcp.u2 = v_pair.u2
      ORDER BY msg_count DESC, c.updated_at DESC
    LOOP
      IF v_canonical_id IS NULL THEN
        -- Priority 1: Canonical Chat
        v_canonical_id := v_dup.chat_id;
        v_repaired_pairs := v_repaired_pairs + 1;
      ELSE
        -- Priority 2: Duplicate Chat -> Move Messages & Notifications
        WITH moved_msgs AS (
          UPDATE public.messages SET chat_id = v_canonical_id WHERE chat_id = v_dup.chat_id RETURNING 1
        )
        SELECT count(*) INTO v_moved_count FROM moved_msgs;
        v_moved_messages := v_moved_messages + COALESCE(v_moved_count, 0);
        
        WITH moved_notifs AS (
          UPDATE public.notifications SET related_chat_id = v_canonical_id WHERE related_chat_id = v_dup.chat_id RETURNING 1
        )
        SELECT count(*) INTO v_notif_count FROM moved_notifs;
        v_updated_notifications := v_updated_notifications + COALESCE(v_notif_count, 0);
        
        -- Delete duplicate chat safely
        DELETE FROM public.chat_members WHERE chat_id = v_dup.chat_id;
        DELETE FROM public.chats WHERE id = v_dup.chat_id;
        v_deleted_chats := v_deleted_chats + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true, 
    'repaired_pairs', v_repaired_pairs, 
    'moved_messages', v_moved_messages,
    'updated_notifications', v_updated_notifications,
    'deleted_duplicate_chats', v_deleted_chats,
    'unsafe_manual_review', v_unsafe
  );
END;
$$;
