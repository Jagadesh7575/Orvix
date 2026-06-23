import { supabase } from '../lib/supabase';

export const chatService = {
  getLocalReadMarker: (userId, chatId) => {
    if (!userId || !chatId) return null;
    return localStorage.getItem(`orvix_chat_read_${userId}_${chatId}`);
  },

  markChatReadLocally: (userId, chatId, messageId) => {
    if (!userId || !chatId || !messageId) return;
    localStorage.setItem(`orvix_chat_read_${userId}_${chatId}`, messageId);
  },

  isChatReadLocally: (userId, chatId, messageId) => {
    if (!userId || !chatId || !messageId) return false;
    return chatService.getLocalReadMarker(userId, chatId) === messageId;
  },

  markChatReadInSupabase: async (chatId, userId, latestMessageId) => {
    if (!chatId || !userId || !latestMessageId) {
      return { success: false, reason: "missing_required_fields" };
    }

    const { data, error } = await supabase
      .from("chat_members")
      .update({
        last_read_message_id: latestMessageId,
        last_read_at: new Date().toISOString()
      })
      .eq("chat_id", chatId)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("MARK_CHAT_READ_SUPABASE_ERROR", error);
      return { success: false, error };
    }

    return { success: true, data };
  },

  getUnreadCount: (messages = [], currentUserId, chatId, currentUserLastReadAt) => {
    if (!Array.isArray(messages) || !currentUserId || !chatId) return 0;

    const readMarkerId = chatService.getLocalReadMarker(currentUserId, chatId);

    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    let startIndex = -1;

    if (readMarkerId) {
      startIndex = sortedMessages.findIndex(msg => msg.id === readMarkerId);
    }

    let messagesAfterReadMarker = [];

    if (startIndex >= 0) {
      messagesAfterReadMarker = sortedMessages.slice(startIndex + 1);
    } else {
      if (currentUserLastReadAt) {
        const lastReadTime = new Date(currentUserLastReadAt).getTime();
        messagesAfterReadMarker = sortedMessages.filter(msg => new Date(msg.created_at).getTime() > lastReadTime);
      } else {
        // If we have no local marker and no supabase read date, to prevent old chats showing 4+,
        // we assume if it's not marked read anywhere, but it's an old chat, maybe it's read.
        // Wait, actually, if the chat is newly opened we should just clear it locally.
        // For now, if there's no read marker, we count all as unread.
        // However, if the user explicitly wants to not show "4+ new messages" for old chats:
        // We can just rely on the fallback below.
        messagesAfterReadMarker = sortedMessages;
      }
    }

    return messagesAfterReadMarker.filter(
      msg => msg.sender_id !== currentUserId
    ).length;
  },

  // Get all conversations for Chats page
  getConversations: async (currentUserId, options = {}) => {
    try {
      if (!currentUserId) {
        return [];
      }

      // 1. Fetch conversations using the new RPC
      const { data: rows, error } = await supabase.rpc("get_user_conversations_with_profiles");

      if (error) {
        throw error;
      }
      
      if (!rows || rows.length === 0) {
        return [];
      }

      const chatIds = rows.map(r => r.chat_id);

      // 2. Fetch messages to compute local unread count
      const { data: allMessages } = await supabase
        .from('messages')
        .select('id, chat_id, sender_id, content, created_at, message_type')
        .in('chat_id', chatIds);

      const messagesByChat = {};
      if (allMessages) {
        allMessages.forEach(m => {
          if (!messagesByChat[m.chat_id]) messagesByChat[m.chat_id] = [];
          messagesByChat[m.chat_id].push(m);
        });
      }

      // 3. For each chat, build the normalized object
      const formattedChats = [];
      for (const row of rows) {
        const friend = {
          id: row.other_user_id,
          username: row.other_username,
          full_name: row.other_full_name,
          avatar_url: row.other_avatar_url,
          is_online: row.other_is_online,
          last_seen: row.other_last_seen
        };

        const latestMessage = row.latest_message_id
          ? {
              id: row.latest_message_id,
              chat_id: row.chat_id,
              content: row.latest_message_content,
              sender_id: row.latest_message_sender_id,
              created_at: row.latest_message_created_at,
              message_type: 'unknown' // Usually fetched from allMessages below
            }
          : null;

        const isMine = row.latest_message_sender_id === currentUserId;

        const isSeen =
          isMine &&
          row.other_user_last_read_at &&
          row.latest_message_created_at &&
          new Date(row.other_user_last_read_at).getTime() >=
            new Date(row.latest_message_created_at).getTime();

        const messages = messagesByChat[row.chat_id] || [];
        
        // Enhance latestMessage with message_type if possible
        if (latestMessage && messages.length > 0) {
          const matchedMsg = messages.find(m => m.id === latestMessage.id);
          if (matchedMsg && matchedMsg.message_type) {
            latestMessage.message_type = matchedMsg.message_type;
          }
        }
        
        let unread = false;
        let unreadCount = 0;
        let unreadFailureReason = "none";
        
        const latestMessageIsMine = row.latest_message_sender_id === currentUserId;
        
        const isReadAccordingToSupabase = 
          (row.current_user_last_read_message_id && row.current_user_last_read_message_id === row.latest_message_id) ||
          (row.current_user_last_read_at && row.latest_message_created_at && new Date(row.current_user_last_read_at).getTime() >= new Date(row.latest_message_created_at).getTime());

        const isReadAccordingToLocal = chatService.getLocalReadMarker(currentUserId, row.chat_id) === row.latest_message_id;

        if (latestMessageIsMine) {
          unreadCount = 0;
          unread = false;
          unreadFailureReason = "latest_message_is_mine_should_not_be_unread";
        } else if (isReadAccordingToSupabase) {
          unreadCount = 0;
          unread = false;
          if (row.latest_message_id) {
            chatService.markChatReadLocally(currentUserId, row.chat_id, row.latest_message_id);
          }
        } else {
          // fallback to local calculation
          unreadCount = chatService.getUnreadCount(messages, currentUserId, row.chat_id, row.current_user_last_read_at);
          unread = unreadCount > 0;
          if (!unread && !isReadAccordingToSupabase) {
             unreadFailureReason = "ui_using_localstorage_instead_of_supabase";
          }
          if (unread && isReadAccordingToLocal) {
             unreadFailureReason = "localstorage_marker_stale";
          }
          if (!row.current_user_last_read_at && !latestMessageIsMine) {
             unreadFailureReason = "current_user_last_read_missing";
          }
        }

        const unreadPreviewText = (() => {
          if (!unreadCount || unreadCount <= 0) return null;
          if (unreadCount >= 4) return "4+ new messages";
          if (unreadCount === 1) return "1 new message";
          return `${unreadCount} new messages`;
        })();

        formattedChats.push({
          id: row.chat_id,
          chat_id: row.chat_id,
          updated_at: row.updated_at || row.latest_message_created_at,
          friend: friend,
          otherUser: friend,
          profile: friend,
          user: friend,
          last_message: latestMessage,
          latestMessage: latestMessage,
          lastMessage: latestMessage,
          unread: unread,
          unreadCount: unreadCount,
          hasMessages: !!latestMessage,
          isMine: isMine,
          isSeen: isSeen,
          otherUserLastReadAt: row.other_user_last_read_at,
          currentUserLastReadAt: row.current_user_last_read_at,
          currentUserLastReadMessageId: row.current_user_last_read_message_id,
          supabaseSaysRead: isReadAccordingToSupabase,
          localStorageSaysRead: isReadAccordingToLocal,
          unreadFailureReason
        });
      }

      return formattedChats;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  },

  // Get unread recent incoming chats for Home page
  getHomeRecentChats: async (currentUserId, options = {}) => {
    try {
      if (!currentUserId) {
        return [];
      }
      
      const conversations = await chatService.getConversations(currentUserId);
      
      const homeChats = conversations.filter(chat => {
        let shouldShowInHomeRecentChats = false;
        let hiddenReason = 'visible_unread_incoming';
        
        if (!chat.last_message) hiddenReason = 'no_latest_message';
        else if (!chat.unread) hiddenReason = 'marked_read_by_unified_unread_logic';
        else shouldShowInHomeRecentChats = true;
        
        return shouldShowInHomeRecentChats;
      });

      // Sort by newest first
      homeChats.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      return homeChats;
    } catch (error) {
      console.error('Error fetching home recent chats:', error);
      return [];
    }
  },

  // Get messages for a specific chat
  getMessages: async (chatId) => {
    try {
      if (!chatId) throw new Error("Missing chatId");
      
      console.log("GET_MESSAGES_CALLED_WITH_CHAT_ID", chatId);
      
      const { data, error } = await supabase
        .from('messages')
        .select('id, chat_id, sender_id, content, created_at, message_type')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true }); // Get ascending as strictly requested

      console.log("GET_MESSAGES_DATA", data);
      
      if (error) {
        console.error("GET_MESSAGES_ERROR", error);
        throw error;
      }
      
      // Return [] only if query succeeds and data is truly an array
      return Array.isArray(data) ? data : []; 
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send a message using the secure RPC
  sendMessage: async (chatId, content, type = 'text') => {
    try {
      const trimmedContent = content.trim();
      if (!trimmedContent) return null;

      console.log("SEND_MESSAGE_INPUT", { chatId, content: trimmedContent });

      const { data, error } = await supabase.rpc('send_chat_message', {
        p_chat_id: chatId,
        p_content: trimmedContent
      });

      console.log("SEND_MESSAGE_RPC_RESPONSE", { data, error });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to send message');

      let messageToReturn = null;

      // If RPC returns the full message via data.message, return it
      if (data.message) {
        messageToReturn = data.message;
      } else if (data.message_id) {
        // Fallback if RPC only returns message_id
        const { data: message, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('id', data.message_id)
          .single();
        if (msgError) throw msgError;
        messageToReturn = message;
      }

      // Trigger Push Notification safely without blocking
      if (messageToReturn) {
        console.log('[REAL_MESSAGE_FLOW] message_saved:', true);
        console.log('[REAL_MESSAGE_FLOW] message_id:', messageToReturn.id);
        console.log('[REAL_MESSAGE_FLOW] chat_id:', chatId);
        console.log('[REAL_MESSAGE_FLOW] sender_id:', messageToReturn.sender_id);
        
        (async () => {
          try {
            // Find receiver from chat_members
            const { data: members, error: memError } = await supabase
              .from('chat_members')
              .select('user_id')
              .eq('chat_id', chatId);

            if (!memError && members && members.length > 0) {
              const senderId = messageToReturn.sender_id;
              const otherMembers = members.filter(m => m.user_id !== senderId);
              
              for (const member of otherMembers) {
                console.log('[REAL_MESSAGE_FLOW] receiver_id:', member.user_id);
                console.log('[REAL_MESSAGE_FLOW] notification_function_called:', true);
                
                try {
                  const { data, error } = await supabase.functions.invoke('send-message-notification', {
                    body: {
                      mode: 'real-message',
                      chat_id: chatId,
                      message_id: messageToReturn.id,
                      sender_id: senderId,
                      receiver_id: member.user_id,
                      title: "New message",
                      body: messageToReturn.content
                    }
                  });
                  
                  if (error) {
                    let parsedError = error.message;
                    try {
                      if (error.context) {
                        const text = await error.context.text();
                        try { parsedError = JSON.parse(text); } catch { parsedError = text; }
                      }
                    } catch (e) {}
                    console.error('[REAL_MESSAGE_FLOW] function_error:', parsedError);
                  } else {
                    console.log('[REAL_MESSAGE_FLOW] function_response:', data);
                  }
                } catch (pushError) {
                  console.warn('[REAL_MESSAGE_FLOW] Push failed but message saved:', pushError);
                }
              }
            }
          } catch (err) {
            console.warn('[REAL_MESSAGE_FLOW] Failed to process push notifications:', err);
          }
        })();
      }

      return messageToReturn;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Send a media message using the secure RPC
  sendMediaMessage: async (chatId, metadata) => {
    try {
      const { data, error } = await supabase.rpc('send_media_message', {
        p_chat_id: chatId,
        p_content: metadata.caption || 'Photo',
        p_message_type: metadata.messageType || 'image',
        p_media_url: metadata.mediaUrl,
        p_media_key: metadata.mediaKey,
        p_thumbnail_url: metadata.thumbnailUrl || null,
        p_thumbnail_key: metadata.thumbnailKey || null,
        p_file_name: metadata.fileName,
        p_file_size: metadata.fileSize,
        p_mime_type: metadata.mimeType,
        p_media_width: metadata.mediaWidth || null,
        p_media_height: metadata.mediaHeight || null,
        p_storage_provider: metadata.storageProvider || 'none',
        p_upload_status: metadata.uploadStatus || 'sent',
        p_caption: metadata.caption || null
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to send media message');

      return data.message;
    } catch (error) {
      console.error('Error sending media message:', error);
      throw error;
    }
  },

  // Mark all messages in a chat as read by the current user
  markMessagesRead: async (chatId) => {
    try {
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  },

  // Subscribe to new messages for a specific chat
  subscribeToMessages: (chatId, callback) => {
    const subscription = supabase
      .channel(`chat_${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  // Get or Create Private Chat
  getOrCreatePrivateChat: async (friendId) => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_private_chat', {
        p_friend_id: friendId
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting/creating chat:', err);
      return { success: false, error: err.message };
    }
  },

  // Resolve Canonical Chat ID
  resolveChatId: async (chatId) => {
    try {
      const { data, error } = await supabase.rpc('resolve_chat_for_current_user', {
        p_chat_id: chatId
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error resolving chat ID:', err);
      return { success: false, error: err.message };
    }
  }
};
