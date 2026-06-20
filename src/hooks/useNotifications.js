import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { supabase } from '../lib/supabase';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const notifs = await notificationService.getNotifications();
      setNotifications(notifs || []);
      const unread = notifs?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const handleReadEvent = () => {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };
    window.addEventListener('notifications_read_global', handleReadEvent);

    let channel = null;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;

      channel = notificationService.subscribeToNotifications(userId, () => {
        fetchNotifications();
      });
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener('notifications_read_global', handleReadEvent);
    };
  }, [fetchNotifications]);

  const markAsRead = async () => {
    // Optimistic instant global update
    window.dispatchEvent(new CustomEvent('notifications_read_global'));
    
    const res = await notificationService.markAllAsRead();
    if (res?.success) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead
  };
};
