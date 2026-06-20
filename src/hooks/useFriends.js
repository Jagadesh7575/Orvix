import { useState, useEffect, useCallback } from 'react';
import { friendService } from '../services/friendService';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useFriends = () => {
  const { refreshProfile } = useAuth();
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [f, inc, sent] = await Promise.all([
        friendService.getFriends(),
        friendService.getIncomingRequests(),
        friendService.getSentRequests()
      ]);
      setFriends(f || []);
      setIncomingRequests(inc || []);
      setSentRequests(sent || []);
    } catch (err) {
      console.error('Error in useFriends fetchAllData:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();

    const handleSyncEvent = () => fetchAllData();
    window.addEventListener('friends_sync_global', handleSyncEvent);

    let channel = null;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;
      const uniqueId = Math.random().toString(36).substring(7);

      channel = supabase.channel(`friend_requests:${userId}:${uniqueId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friend_requests',
            filter: `receiver_id=eq.${userId}`
          },
          () => {
            fetchAllData(); // Re-fetch on any request change
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friend_requests',
            filter: `sender_id=eq.${userId}`
          },
          () => {
            fetchAllData();
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener('friends_sync_global', handleSyncEvent);
    };
  }, [fetchAllData]);

  const triggerGlobalSync = () => {
    window.dispatchEvent(new CustomEvent('friends_sync_global'));
  };

  const sendRequest = async (receiverId) => {
    const res = await friendService.sendFriendRequest(receiverId);
    if (res?.success) {
      await fetchAllData();
      triggerGlobalSync();
    }
    return res;
  };

  const acceptRequest = async (requestId) => {
    // Optimistic update
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
    const res = await friendService.acceptFriendRequest(requestId);
    if (res?.success) {
      await fetchAllData();
      triggerGlobalSync();
      if (refreshProfile) await refreshProfile();
    } else {
      // Revert on fail
      await fetchAllData();
    }
    return res;
  };

  const declineRequest = async (requestId) => {
    // Optimistic update
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
    const res = await friendService.declineFriendRequest(requestId);
    if (res?.success) {
      await fetchAllData();
      triggerGlobalSync();
    } else {
      // Revert on fail
      await fetchAllData();
    }
    return res;
  };

  return {
    friends,
    incomingRequests,
    sentRequests,
    loading,
    error,
    refresh: fetchAllData,
    sendRequest,
    acceptRequest,
    declineRequest
  };
};
