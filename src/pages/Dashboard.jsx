import React, { useState, useEffect } from 'react';
import { Search, MessageSquarePlus, Activity, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import UserSearch from '../components/chat/UserSearch';
import { isUserActuallyOnline } from '../utils/presence';
import { chatService } from '../services/chatService';

const Dashboard = React.memo(function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    fetchChats();

    const channel = supabase
      .channel('public:chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => fetchChats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_members' }, () => fetchChats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchChats())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const fetchChats = async () => {
    try {
      const data = await chatService.getChats();
      // Map to Dashboard expected format
      const formattedChats = data.map(chat => ({
        id: chat.id,
        type: 'private',
        otherMember: chat.friend,
        lastMessage: chat.last_message ? chat.last_message.content : 'Tap to chat...',
        timestamp: chat.last_message ? new Date(chat.last_message.created_at) : new Date(chat.updated_at)
      }));
      setChats(formattedChats);
    } catch (err) {
      console.error('Error fetching chats', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (selectedUser) => {
    setIsSearchOpen(false);
    
    const existingChat = chats.find(c => c.type === 'private' && c.otherMember?.id === selectedUser.id);
    if (existingChat) {
      navigate(`/app/chat/${existingChat.id}`);
      return;
    }

    try {
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert([{ type: 'private', created_by: user.id }])
        .select()
        .single();
      
      if (chatError) throw chatError;

      const { error: membersError } = await supabase
        .from('chat_members')
        .insert([
          { chat_id: newChat.id, user_id: user.id, role: 'admin' },
          { chat_id: newChat.id, user_id: selectedUser.id, role: 'member' }
        ]);

      if (membersError) throw membersError;
      navigate(`/app/chat/${newChat.id}`);
    } catch (err) {
      console.error('Error creating chat', err);
    }
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Orvix User";
  const username = profile?.username || "orvix_user";
  const bio = profile?.bio || "Private conversations. Premium vibes.";

  return (
    <div className="min-h-full w-full p-4 pb-24 md:max-w-xl mx-auto relative z-10">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold font-display app-text tracking-tight">Orvix</h1>
          <p className="text-sm flex items-center space-x-1" style={{ color: 'var(--theme-primary)' }}>
            <span className="w-1.5 h-1.5 rounded-full shadow-[var(--theme-glow)] animate-pulse" style={{ background: 'var(--theme-primary)' }} />
            <span>Online</span>
          </p>
        </div>
        <button onClick={() => navigate('/app/profile')} className="w-10 h-10 rounded-full app-surface border app-border flex items-center justify-center overflow-hidden hover:scale-105 transition-transform shadow-[var(--theme-glow)]">
          {profile?.avatar_url ? (
             <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
             <span className="app-text font-bold">{displayName.charAt(0).toUpperCase()}</span>
          )}
        </button>
      </motion.div>

      {/* Profile Summary Card */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-5 rounded-3xl mb-6 relative overflow-hidden group border app-border"
      >
        <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: 'linear-gradient(to bottom right, var(--theme-primary), transparent)' }} />
        <div className="relative z-10 flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full border flex items-center justify-center overflow-hidden flex-shrink-0 shadow-[var(--theme-glow)]" style={{ background: 'var(--theme-bg-soft)', borderColor: 'var(--theme-primary)' }}>
            {profile?.avatar_url ? (
               <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
               <span className="text-xl font-bold app-text">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-lg font-bold app-text truncate font-display">{displayName}</h2>
            <p className="text-sm app-muted truncate font-medium">@{username}</p>
            <p className="text-xs app-text opacity-80 mt-1 truncate">{bio}</p>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="relative z-10 flex items-center justify-between mt-5 pt-4 border-t app-border">
           <div className="text-center">
             <div className="text-sm font-bold app-text">{profile?.followers_count || 0}</div>
             <div className="text-[10px] app-muted uppercase tracking-wider font-semibold">Followers</div>
           </div>
           <div className="text-center">
             <div className="text-sm font-bold app-text">{profile?.following_count || 0}</div>
             <div className="text-[10px] app-muted uppercase tracking-wider font-semibold">Following</div>
           </div>
           <div className="text-center">
             <div className="text-sm font-bold app-text">{chats.length}</div>
             <div className="text-[10px] app-muted uppercase tracking-wider font-semibold">Chats</div>
           </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={() => setIsSearchOpen(true)}
        className="glass-panel w-full p-4 rounded-2xl flex items-center space-x-3 mb-6 cursor-text active:scale-[0.98] transition-transform border app-border"
      >
        <Search className="w-5 h-5 app-muted" />
        <span className="app-muted text-sm flex-1 font-medium">Search or start new chat...</span>
      </motion.div>

      {/* Recent Chats Section */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-bold app-muted mb-4 px-1 uppercase tracking-widest">Recent Conversations</h3>
        
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin shadow-[var(--theme-glow)]" style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : chats.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl text-center border app-border">
              <MessageSquare className="w-10 h-10 app-muted opacity-50 mx-auto mb-3" />
              <p className="app-text font-semibold mb-1">No chats yet</p>
              <p className="app-muted text-sm">Tap the floating button to start a private conversation.</p>
            </div>
          ) : (
            <AnimatePresence>
              {chats.map((chat, i) => (
                <motion.button 
                  key={chat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  onClick={() => navigate(`/app/chat/${chat.id}`)}
                  className="w-full glass-panel p-3 rounded-2xl flex items-center space-x-3 hover:bg-white/5 active:scale-[0.98] transition-all border border-transparent hover:border-[var(--theme-card-border)] group"
                >
                  <div className="w-12 h-12 rounded-full app-surface border app-border flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                    {chat.otherMember?.avatar_url ? (
                      <img src={chat.otherMember.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="app-text font-bold">{chat.otherMember?.full_name?.charAt(0) || chat.otherMember?.username?.charAt(0) || '?'}</span>
                    )}
                    {isUserActuallyOnline(chat.otherMember) && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[var(--theme-surface)] shadow-sm" style={{ background: 'var(--theme-success)' }} />
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[15px] app-text truncate font-display">{chat.otherMember?.full_name || chat.otherMember?.username || 'Unknown User'}</h4>
                      <span className="text-[11px] app-muted whitespace-nowrap ml-2 font-medium">
                        {chat.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[13px] app-muted truncate group-hover:text-[var(--theme-text)] transition-colors">
                      {chat.lastMessage}
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
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
    </div>
  );
});

export default Dashboard;
