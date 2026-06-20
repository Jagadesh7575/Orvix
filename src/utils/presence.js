/**
 * Helper utilities for accurate online/offline presence tracking.
 * We require both is_online=true AND a recent last_seen to verify actual presence.
 */

// A user is considered offline if their last heartbeat was over 90 seconds ago.
const STALE_TIMEOUT_SECONDS = 90;

export const isUserActuallyOnline = (profile) => {
  if (!profile?.is_online || !profile?.last_seen) return false;

  const lastSeenTime = new Date(profile.last_seen).getTime();
  const now = Date.now();
  const diffSeconds = (now - lastSeenTime) / 1000;

  return diffSeconds <= STALE_TIMEOUT_SECONDS;
};

export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'recently';

  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);

  if (diffSeconds < 60) return 'Just now';
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `Last seen ${minutes} min ago`;
  }
  
  // Check if it's today
  const isToday = lastSeenDate.getDate() === now.getDate() &&
                  lastSeenDate.getMonth() === now.getMonth() &&
                  lastSeenDate.getFullYear() === now.getFullYear();
                  
  if (isToday) {
    const hours = Math.floor(diffSeconds / 3600);
    if (hours < 6) {
      return `Last seen ${hours} hr ago`;
    }
    return `Last seen today`;
  }
  
  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = lastSeenDate.getDate() === yesterday.getDate() &&
                      lastSeenDate.getMonth() === yesterday.getMonth() &&
                      lastSeenDate.getFullYear() === yesterday.getFullYear();
                      
  if (isYesterday) return 'Last seen yesterday';
  
  // Older
  const options = { month: 'short', day: 'numeric' };
  return `Last seen ${lastSeenDate.toLocaleDateString('en-US', options)}`;
};
