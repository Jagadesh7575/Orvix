import { supabase } from '../lib/supabase';

export const notificationService = {
  // Get all notifications for current user
  getNotifications: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id, type, title, body, is_read, created_at,
        actor_id,
        related_request_id,
        related_chat_id,
        profiles!notifications_actor_id_fkey (
          username, avatar_url, full_name
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      const { data, error } = await supabase.rpc('mark_notifications_read');
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      return { success: false, error: err.message };
    }
  },

  // Subscribe to real-time notifications
  subscribeToNotifications: (userId, callback) => {
    if (!userId) return null;

    const uniqueId = Math.random().toString(36).substring(7);
    const channel = supabase.channel(`notifications:${userId}:${uniqueId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to insert/update/delete
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return channel;
  }
};
