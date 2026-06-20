import { supabase } from '../lib/supabase';

export const friendService = {
  // Search users by username or full_name
  searchUsers: async (query) => {
    if (!query || query.length < 2) return [];

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const currentUserId = session.user.id;

    // We do a simple ilike search on username or full_name, excluding self
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio')
      .neq('id', currentUserId)
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data;
  },

  // Get relationship status with a specific user
  getRelationshipStatus: async (targetUserId) => {
    try {
      if (!targetUserId) return 'none';
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) return 'none';
      
      const currentUserId = session.user.id;
      const myId = currentUserId;

      if (currentUserId === targetUserId) return 'self';

      // 0. Check for blocks
      const { data: blockedData, error: blockErr } = await supabase
        .from('blocked_users')
        .select('blocker_id, blocked_id')
        .or(`and(blocker_id.eq.${myId},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${myId})`);
          
      if (blockErr) {
        console.error('getRelationshipStatus block check error:', blockErr);
      } else if (blockedData && blockedData.length > 0) {
        const iBlockedThem = blockedData.some(b => b.blocker_id === myId);
        return iBlockedThem ? 'blocked' : 'blocked_by';
      }

      // 1. Check friendship
      const { data: friendship, error: fError } = await supabase
        .from('friendships')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('friend_id', targetUserId)
        .maybeSingle();

      if (fError) {
        console.error('getRelationshipStatus friendship check error:', fError);
      } else if (friendship) {
        return 'friends';
      }

      // 2. Check pending request sent by me
      const { data: sentReq, error: sError } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('sender_id', currentUserId)
        .eq('receiver_id', targetUserId)
        .eq('status', 'pending')
        .maybeSingle();

      if (sError) {
        console.error('getRelationshipStatus sentReq check error:', sError);
      } else if (sentReq) {
        return 'pending_sent';
      }

      // 3. Check pending request received by me
      const { data: recReq, error: rError } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('sender_id', targetUserId)
        .eq('receiver_id', currentUserId)
        .eq('status', 'pending')
        .maybeSingle();

      if (rError) {
        console.error('getRelationshipStatus recReq check error:', rError);
      } else if (recReq) {
        return 'pending_received';
      }

      return 'none';
    } catch (err) {
      console.error('getRelationshipStatus fatal error:', err);
      return 'none';
    }
  },

  // Send a friend request
  sendFriendRequest: async (receiverId) => {
    if (!receiverId) return { success: false, error: 'Missing target user id' };
    try {
      const { data, error } = await supabase.rpc('send_friend_request', {
        p_receiver_id: receiverId
      });

      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || 'Failed to send request');
      
      return data || { success: true, status: 'pending_sent' };
    } catch (err) {
      console.error('Error sending friend request:', err);
      return { success: false, error: err.message };
    }
  },

  // Accept a friend request
  acceptFriendRequest: async (requestId) => {
    if (!requestId) return { success: false, error: 'Missing request id' };
    try {
      const { data, error } = await supabase.rpc('respond_friend_request', {
        p_request_id: requestId,
        p_action: 'accept'
      });

      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || 'Failed to accept request');
      
      return data || { success: true, status: 'friends' };
    } catch (err) {
      console.error('Error accepting friend request:', err);
      return { success: false, error: err.message };
    }
  },

  // Decline a friend request
  declineFriendRequest: async (requestId) => {
    if (!requestId) return { success: false, error: 'Missing request id' };
    try {
      const { data, error } = await supabase.rpc('respond_friend_request', {
        p_request_id: requestId,
        p_action: 'decline'
      });

      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || 'Failed to decline request');
      
      return data || { success: true, status: 'none' };
    } catch (err) {
      console.error('Error declining friend request:', err);
      return { success: false, error: err.message };
    }
  },

  // Accept a friend request from a specific user
  acceptRequestFromUser: async (senderId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { success: false, error: 'Not authenticated' };

      const { data: req, error: reqErr } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('sender_id', senderId)
        .eq('receiver_id', session.user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (reqErr || !req) throw reqErr || new Error('Request not found');

      return await friendService.acceptFriendRequest(req.id);
    } catch (err) {
      console.error('Error accepting request from user:', err);
      return { success: false, error: err.message };
    }
  },

  // Decline a friend request from a specific user
  declineRequestFromUser: async (senderId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return { success: false, error: 'Not authenticated' };

      const { data: req, error: reqErr } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('sender_id', senderId)
        .eq('receiver_id', session.user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (reqErr || !req) throw reqErr || new Error('Request not found');

      return await friendService.declineFriendRequest(req.id);
    } catch (err) {
      console.error('Error declining request from user:', err);
      return { success: false, error: err.message };
    }
  },

  // Get incoming requests
  getIncomingRequests: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        created_at,
        profiles!friend_requests_sender_id_fkey (
          id, username, full_name, avatar_url, bio
        )
      `)
      .eq('receiver_id', session.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching incoming requests:', error);
      return [];
    }

    return data;
  },

  // Get sent requests
  getSentRequests: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        created_at,
        profiles!friend_requests_receiver_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('sender_id', session.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sent requests:', error);
      return [];
    }

    return data;
  },

  // ==========================================
  // BLOCKING AND UNFOLLOWING LOGIC
  // ==========================================

  async blockUser(targetUserId) {
    if (!targetUserId) throw new Error('Missing target user id');
    const { data, error } = await supabase.rpc('block_user', { p_target_id: targetUserId });
    if (error) {
      console.error('block_user RPC error:', error);
      throw error;
    }
    if (data?.success === false) {
      throw new Error(data?.error || 'Could not block user');
    }
    return data || { success: true, status: 'blocked' };
  },

  // Get blocked users
  getBlockedUsers: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return [];

      const currentUserId = session.user.id;

      const { data: blockedRows, error: blockedErr } = await supabase
        .from('blocked_users')
        .select('blocked_id, created_at')
        .eq('blocker_id', currentUserId)
        .order('created_at', { ascending: false });

      if (blockedErr) throw blockedErr;
      if (!blockedRows || blockedRows.length === 0) return [];

      const blockedIds = blockedRows.map(row => row.blocked_id);

      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, is_online, last_seen, created_at')
        .in('id', blockedIds);

      if (profErr) throw profErr;

      // Map blocked_at for convenience
      return (profiles || []).map(profile => {
        const row = blockedRows.find(b => b.blocked_id === profile.id);
        return { ...profile, blocked_at: row?.created_at };
      });
    } catch (err) {
      console.error('Error fetching blocked users:', err);
      return [];
    }
  },

  async unblockUser(targetUserId) {
    if (!targetUserId) throw new Error('Missing target user id');
    try {
      const { data, error } = await supabase.rpc('unblock_user', { p_target_id: targetUserId });
      if (error) {
        console.error('unblock_user RPC error:', error);
        throw error;
      }
      if (data?.success === false) {
        throw new Error(data?.error || 'Could not unblock user');
      }
      return data || { success: true, status: 'none' };
    } catch (err) {
      console.error('unblockUser service error:', err);
      throw err;
    }
  },

  async unfollowUser(targetUserId) {
    if (!targetUserId) throw new Error('Missing target user id');
    const { data, error } = await supabase.rpc('unfollow_user', { p_target_id: targetUserId });
    if (error) {
      console.error('unfollow_user RPC error:', error);
      throw error;
    }
    if (data?.success === false) {
      throw new Error(data?.error || 'Could not unfollow user');
    }
    return data || { success: true, status: 'none' };
  },

  async removeFollower(targetUserId) {
    if (!targetUserId) throw new Error('Missing target user id');
    const { data, error } = await supabase.rpc('remove_follower', { p_follower_id: targetUserId });
    if (error) {
      console.error('remove_follower RPC error:', error);
      throw error;
    }
    if (data?.success === false) {
      throw new Error(data?.error || 'Could not remove follower');
    }
    return data || { success: true, status: 'none' };
  },

  // ==========================================
  // OTHER METHODS
  // ==========================================

  // Get friends
  getFriends: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        friend_id,
        profiles!friendships_friend_id_fkey (
          id, username, full_name, avatar_url
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching friends:', error);
      return [];
    }

    return data;
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

  // Get Followers
  getFollowers: async (userId) => {
    try {
      // Step 1: Get user_ids of people who added `userId` as friend (followers)
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('user_id')
        .eq('friend_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`getFollowers friendship rows for ${userId}:`, friendships);
      
      if (!friendships || friendships.length === 0) return [];

      const userIds = friendships.map(f => f.user_id);
      console.log(`getFollowers profile ids:`, userIds);
      
      // Step 2: Fetch profiles for those user_ids
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url, followers_count, following_count, is_online, last_seen, created_at')
        .in('id', userIds);

      if (profErr) throw profErr;
      
      return (profiles || []).map(p => ({ ...p, source: 'accepted_follower' }));
    } catch (err) {
      console.error('Error fetching followers:', err);
      return [];
    }
  },

  // Get Following
  getFollowing: async (userId) => {
    try {
      // Step 1: Get friend_ids of people `userId` added as friend (following)
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`getFollowing friendship rows for ${userId}:`, friendships);
      
      if (!friendships || friendships.length === 0) return [];

      const friendIds = friendships.map(f => f.friend_id);
      console.log(`getFollowing profile ids:`, friendIds);
      
      // Step 2: Fetch profiles for those friend_ids
      let acceptedFollowing = [];
      if (friendIds.length > 0) {
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('id, username, full_name, bio, avatar_url, followers_count, following_count, is_online, last_seen, created_at')
          .in('id', friendIds);

        if (profErr) throw profErr;
        acceptedFollowing = (profiles || []).map(p => ({ ...p, source: 'accepted_following' }));
      }
      
      // Step 3: If viewing own profile, also merge pending outgoing requests
      let pendingOutgoing = [];
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && session.user.id === userId) {
        const { data: sentReqs, error: sentErr } = await supabase
          .from('friend_requests')
          .select('receiver_id')
          .eq('sender_id', userId)
          .eq('status', 'pending');
          
        if (!sentErr && sentReqs && sentReqs.length > 0) {
          const pendingIds = sentReqs.map(r => r.receiver_id);
          const { data: pendingProfiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, bio, avatar_url, followers_count, following_count, is_online, last_seen, created_at')
            .in('id', pendingIds);
            
          pendingOutgoing = (pendingProfiles || []).map(p => ({ ...p, source: 'pending_outgoing' }));
        }
      }
      
      return [...acceptedFollowing, ...pendingOutgoing];
    } catch (err) {
      console.error('Error fetching following:', err);
      return [];
    }
  },

  // Get user profile (public fields only)
  getUserProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url, followers_count, following_count, is_online, last_seen, created_at')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  }
};
