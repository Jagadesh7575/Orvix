import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, MessageSquare, Settings, User, Palette, Search, Heart } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useFriends } from '../hooks/useFriends';
import { useAuth } from '../hooks/useAuth';
import { getVisibleActivityItems } from '../utils/activityFilters';
import { chatService } from '../services/chatService';
import { supabase } from '../lib/supabase';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: '/app/home', icon: LayoutDashboard, label: 'Home', exact: true },
    { path: '/app/discover', icon: Search, label: 'Discover' },
    { path: '/app/chats', icon: MessageSquare, label: 'Chats' },
    { path: '/app/activity', icon: Heart, label: 'Activity' },
    { path: '/app/profile', icon: User, label: 'Profile' },
  ];

  const { notifications } = useNotifications();
  const { incomingRequests, sentRequests } = useFriends();
  const { user } = useAuth();
  
  const { unreadVisibleCount } = getVisibleActivityItems(notifications || [], incomingRequests || [], sentRequests || []);

  const [unreadConversationCount, setUnreadConversationCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const conversations = await chatService.getConversations(user.id);
        const count = conversations.filter(c => c.unread).length;
        setUnreadConversationCount(count);
      } catch (err) {
        console.error('Error fetching unread chats for badge', err);
      }
    };

    fetchUnread();

    const channel = supabase
      .channel('public:messages_bottom_nav')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
         fetchUnread();
      })
      .subscribe();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchUnread();
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchUnread();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // We don't want to show bottom nav inside a specific chat window
  if (location.pathname.match(/\/app\/chat\/.+/)) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t pb-safe pt-2 px-2"
      style={{ background: 'var(--theme-nav-bg)', borderColor: 'var(--theme-card-border)' }}
    >
      <div className="flex items-center justify-around w-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.path 
            : location.pathname.startsWith(item.path);

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl"
            >
              {isActive && (
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none animate-fade-in"
                  style={{ background: 'var(--theme-primary)', opacity: 0.15 }}
                />
              )}
              
              <Icon 
                className="w-5 h-5 mb-1 transition-colors" 
                style={
                  isActive 
                  ? { color: 'var(--theme-primary)', filter: 'drop-shadow(0 0 8px var(--theme-glow))' } 
                  : { color: 'var(--theme-text-muted)' }
                }
              />
              
              {item.path === '/app/activity' && unreadVisibleCount > 0 && (
                <div className="absolute top-1 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-[var(--theme-glow)]" style={{ background: 'var(--theme-primary)', color: 'white' }}>
                  {unreadVisibleCount > 9 ? '9+' : unreadVisibleCount}
                </div>
              )}

              {item.path === '/app/chats' && unreadConversationCount > 0 && (
                <div className="absolute top-1 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-[var(--theme-glow)]" style={{ background: 'var(--theme-primary)', color: 'var(--theme-bg, #000)' }}>
                  {unreadConversationCount > 99 ? '99+' : unreadConversationCount}
                </div>
              )}

              <span 
                className="text-[10px] font-medium transition-colors"
                style={isActive ? { color: 'var(--theme-primary)' } : { color: 'var(--theme-text-muted)', opacity: 0.6 }}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
