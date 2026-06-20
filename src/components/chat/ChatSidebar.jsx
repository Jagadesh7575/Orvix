import React from 'react';
import { motion } from 'framer-motion';
import { Settings, LogOut, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function ChatSidebar({ 
  chats, 
  activeChatId, 
  setActiveChatId, 
  setIsSearchOpen, 
  setIsSettingsOpen, 
  isSidebarOpen, 
  setIsSidebarOpen 
}) {
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    // Note: is_online = false logic could be added to signOut in useAuth
    await signOut();
  };

  return (
    <motion.aside 
      initial={{ x: -300 }}
      animate={{ x: isSidebarOpen ? 0 : -300 }}
      className="fixed md:relative z-40 w-80 h-full bg-surface/80 border-r border-white/5 flex flex-col backdrop-blur-xl transition-transform duration-300 md:translate-x-0"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
           <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow overflow-hidden flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold">{profile?.full_name?.charAt(0).toUpperCase() || profile?.username?.charAt(0).toUpperCase() || 'U'}</span>
              )}
           </div>
           <div className="overflow-hidden">
              <h2 className="font-semibold text-white text-sm truncate">{profile?.full_name || profile?.username}</h2>
              <div className="text-xs text-primary flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow animate-pulse" />
                <span>Online</span>
              </div>
           </div>
        </div>
        <button 
          onClick={() => setIsSearchOpen(true)} 
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors text-white"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3">
        <div 
          onClick={() => setIsSearchOpen(true)}
          className="w-full bg-background/50 border app-border rounded-xl py-2 px-3 text-sm text-muted cursor-text hover:border-primary/50 transition-colors flex items-center space-x-2"
        >
           <span className="text-muted">Search users or chats...</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1 scroll-smooth">
        {chats.map(chat => (
          <button 
            key={chat.id}
            onClick={() => { setActiveChatId(chat.id); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 p-3 rounded-2xl transition-all ${
              activeChatId === chat.id 
                ? 'bg-primary/20 border-primary/30 shadow-glow' 
                : 'hover:bg-white/5 border-transparent'
            } border`}
          >
            <div className="w-12 h-12 rounded-full bg-background border app-border flex-shrink-0 flex items-center justify-center relative overflow-hidden">
              {chat.otherMember?.avatar_url ? (
                <img src={chat.otherMember.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-muted font-semibold">{chat.otherMember?.full_name?.charAt(0).toUpperCase() || chat.otherMember?.username?.charAt(0).toUpperCase() || '?'}</span>
              )}
              {chat.otherMember?.is_online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface" />
              )}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <div className="font-semibold text-sm text-white truncate">{chat.otherMember?.full_name || chat.otherMember?.username || 'Unknown User'}</div>
              <div className="text-xs text-muted truncate">{chat.lastMessage || 'Start typing...'}</div>
            </div>
          </button>
        ))}
        
        {chats.length === 0 && (
          <div className="text-center py-10 text-muted text-sm px-4">
            No chats yet. <br/>Click + to start a new private conversation.
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 flex items-center justify-between bg-background/50">
         <button onClick={() => setIsSettingsOpen(true)} className="flex items-center space-x-2 text-sm text-muted hover:text-white transition-colors">
           <Settings className="w-5 h-5" />
           <span>Settings</span>
         </button>
         <button onClick={handleLogout} className="text-muted hover:text-red-400 transition-colors p-2 -mr-2 rounded-full hover:bg-white/5">
           <LogOut className="w-5 h-5" />
         </button>
      </div>
    </motion.aside>
  );
}
