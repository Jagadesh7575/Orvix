import React, { useState, useEffect } from 'react';
import { Search, MessageSquarePlus, Activity, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import UserSearch from '../components/chat/UserSearch';
import { chatService } from '../services/chatService';
import { formatLastSeen, isUserActuallyOnline } from '../utils/presence';
import { useMinuteTicker } from '../hooks/useMinuteTicker';
import { formatInstagramRelativeTime } from '../utils/timeFormat';
import { pageFade, listContainer, listItem } from '../lib/motionVariants';
import Avatar from '../components/Avatar';
import { ListSkeleton } from '../components/Skeletons';

function getUnreadPreviewText(unreadCount) {
  if (!unreadCount || unreadCount <= 0) return null;
  if (unreadCount >= 4) return "4+ new messages";
  if (unreadCount === 1) return "1 new message";
  return `${unreadCount} new messages`;
}

const ChatsList = React.memo(function ChatsList() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [rawConversations, setRawConversations] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);
  
  const minuteTick = useMinuteTicker();

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    if (!user) return;
    
    fetchChats();

    let fetchTimeout;
    const debouncedFetch = () => {
      clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(() => fetchChats(), 1000);
    };

    const channel = supabase
      .channel('public:chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => debouncedFetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_members' }, () => debouncedFetch())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => debouncedFetch())
      .subscribe();

    // Fallback Polling (since Realtime can be unreliable)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchChats();
      }
    }, 10000); // 10s fallback for ChatsList

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchChats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const fetchChats = async () => {
    try {
      const data = await chatService.getConversations(user.id);
      const uniqueConversations = Array.from(
        new Map(data.map(c => [c.id, c])).values()
      );
      const withMessages = uniqueConversations.filter(c => !!c.last_message);
      setRawConversations(withMessages);
    } catch (err) {
      console.error('Error fetching chats', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (selectedUser) => {
    setIsSearchOpen(false);
    
    const existingChat = rawConversations.find(c => c.friend?.id === selectedUser.id);
    if (existingChat) {
      navigate(`/app/chat/${existingChat.id}`, { state: { scrollToBottom: true, from: 'recent_conversations' } });
      return;
    }

    try {
      const res = await chatService.getOrCreatePrivateChat(selectedUser.id);
      if (res?.success && res.chat_id) {
        navigate(`/app/chat/${res.chat_id}`, { state: { scrollToBottom: true, from: 'recent_conversations' } });
      } else {
        showToast('You can message only after request is accepted');
      }
    } catch (err) {
      console.error('Error creating chat', err);
      showToast('You can message only after request is accepted');
    }
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Orvix User";
  const username = profile?.username || "orvix_user";
  const bio = profile?.bio || "Private conversations. Premium vibes.";



  const normalizedConversations = React.useMemo(() => {
    return rawConversations.map(chat => {
      const unreadPreview = getUnreadPreviewText(chat.unreadCount);
      const timeText = new Date(chat.last_message?.created_at || chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const isMine = chat.isMine;
      let latestMessageText;
      let subtitleText;
      
      if (isMine) {
        const isSeen = chat.isSeen;
        const sentTime = formatInstagramRelativeTime(chat.last_message?.created_at || chat.updated_at);
        
        if (isSeen) {
          const seenTime = formatInstagramRelativeTime(chat.otherUserLastReadAt);
          latestMessageText = `Seen ${seenTime}`;
        } else {
          latestMessageText = `Sent ${sentTime}`;
        }
      } else {
        if (chat.last_message?.message_type === 'image') {
          latestMessageText = chat.last_message?.content && chat.last_message.content !== 'Photo' 
            ? `Photo: ${chat.last_message.content}`
            : 'Photo';
        } else {
          latestMessageText = chat.last_message?.content || 'Tap to start chatting';
        }
      }

      if (chat.unreadCount > 0) {
        subtitleText = `${unreadPreview} · ${timeText}`;
      } else {
        subtitleText = isMine ? latestMessageText : `${latestMessageText} · ${timeText}`;
      }

      return {
        ...chat,
        subtitleText
      };
    });
  }, [rawConversations, user?.id, minuteTick]);

  const unreadDebugData = React.useMemo(() => {
    const totalRenderedUnreadBadge = normalizedConversations.filter(c => c.unreadCount > 0).length;
    
    const conversations = normalizedConversations.map(c => {
      const duplicatePrivateChatKey = [user?.id, c.friend?.id].filter(Boolean).sort().join("_");
      return {
        chatId: c.id,
        otherUserId: c.friend?.id,
        otherUsername: c.friend?.username,
        otherFullName: c.friend?.full_name,
        latestMessageId: c.last_message?.id,
        latestMessageContent: c.last_message?.content,
        latestMessageSenderId: c.last_message?.sender_id,
        latestMessageCreatedAt: c.last_message?.created_at,
        latestMessageIsMine: c.isMine,
        currentUserLastReadMessageId: c.currentUserLastReadMessageId,
        currentUserLastReadAt: c.currentUserLastReadAt,
        localStorageReadMarker: chatService.getLocalReadMarker(user?.id, c.id),
        supabaseSaysRead: c.supabaseSaysRead,
        localStorageSaysRead: c.localStorageSaysRead,
        computedUnread: c.unread,
        computedUnreadCount: c.unreadCount,
        renderedUnreadText: c.subtitleText,
        renderedUnreadDot: c.unreadCount > 0,
        duplicatePrivateChatKey,
        unreadFailureReason: c.unreadFailureReason
      };
    });

    const duplicateKeys = {};
    const duplicatePrivateChats = [];
    conversations.forEach(c => {
      if (!c.duplicatePrivateChatKey) return;
      if (duplicateKeys[c.duplicatePrivateChatKey]) {
        duplicatePrivateChats.push(c);
      } else {
        duplicateKeys[c.duplicatePrivateChatKey] = true;
      }
    });

    return {
      debugPanel: "Unread Debug",
      page: "ChatsList",
      currentUserId: user?.id,
      totalRenderedUnreadBadge,
      bottomNavChatsBadgeValue: "Check BottomNav.jsx",
      conversations,
      duplicatePrivateChats
    };
  }, [normalizedConversations, user?.id]);

  return (
    <motion.div 
      variants={pageFade}
      initial="hidden"
      animate="show"
      className="app-page w-full p-4 md:max-w-xl mx-auto relative z-10 pb-[calc(env(safe-area-inset-bottom,20px)+80px)]"
    >
      
      {/* Header */}
      <motion.div 
        variants={listItem}
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-2xl font-bold font-display app-text tracking-tight">Chats</h1>
      </motion.div>

      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-surface border app-border text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg z-50 whitespace-nowrap"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <motion.div 
        variants={listItem}
        onClick={() => setIsSearchOpen(true)}
        className="glass-panel w-full p-4 rounded-2xl flex items-center space-x-3 mb-6 cursor-text active:scale-[0.98] transition-transform border app-border"
      >
        <Search className="w-5 h-5 app-muted" />
        <span className="app-muted text-sm flex-1 font-medium">Search or start new chat...</span>
      </motion.div>

      {/* Recent Chats Section */}
      <motion.div variants={listItem}>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-sm font-bold app-muted uppercase tracking-widest">Recent Conversations</h3>
        </div>
        <div className="space-y-2">
          {loading ? (
            <ListSkeleton rows={4} />
          ) : normalizedConversations.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl text-center border app-border">
              <MessageSquare className="w-10 h-10 app-muted opacity-50 mx-auto mb-3" />
              <p className="app-text font-semibold mb-1">No chats yet</p>
              <p className="app-muted text-sm">Send a friend request and start a private conversation.</p>
            </div>
          ) : (
            <div className="space-y-2 animate-fade-in">
              {normalizedConversations.map((chat) => {
                
                return (
                <button 
                  key={chat.id}
                  onClick={() => navigate(`/app/chat/${chat.id}`, { state: { scrollToBottom: true, from: 'recent_conversations', returnTo: '/app/chats', otherUser: chat.friend || chat.otherUser || chat.profile || chat.user, conversation: chat } })}
                  className="w-full glass-panel p-3 rounded-2xl flex items-center space-x-3 hover:bg-white/5 transition-all border border-transparent hover:border-[var(--theme-card-border)] group relative active:scale-[0.98]"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar 
                      url={chat.friend?.avatar_url}
                      name={chat.friend?.full_name}
                      username={chat.friend?.username}
                      className="w-12 h-12"
                    />
                    {isUserActuallyOnline(chat.friend) && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[var(--theme-bg)] shadow-sm" style={{ background: 'var(--theme-success)' }} />
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold text-[15px] truncate font-display ${chat.unread ? 'app-text' : 'app-text opacity-90'}`}>{chat.friend?.full_name || chat.friend?.username || 'Unknown User'}</h4>
                    </div>
                    <div className={`text-[13px] truncate transition-colors pr-6 mt-0.5 ${chat.unread ? 'text-[var(--theme-text)] font-semibold' : 'app-muted group-hover:text-[var(--theme-text)]'}`}>
                      <p className="conversation-subtitle">
                        {chat.subtitleText}
                      </p>
                    </div>
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-[9px] h-[9px] rounded-full flex-shrink-0" style={{ background: 'var(--theme-primary)', boxShadow: '0 0 10px var(--theme-glow)' }} />
                    </div>
                  )}
                </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsSearchOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full theme-gradient-btn text-white flex items-center justify-center shadow-[var(--theme-shadow)] z-40 overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 transition-transform rounded-full" />
        <MessageSquarePlus className="w-6 h-6 relative z-10" />
      </motion.button>

      <UserSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onSelectUser={handleStartChat}
      />



    </motion.div>
  );
});

export default ChatsList;
