/**
 * Centralized utility to calculate visible Activity items
 * Ensures the Activity badge count strictly matches what is visible on the Activity page.
 */
export const getVisibleActivityItems = (rawNotifications = [], incomingRequests = [], sentRequests = []) => {
  // 1. Filter out raw messages and stale raw request notifications
  const baseVisibleNotifications = rawNotifications.filter(
    n => n.type !== 'new_message' && n.type !== 'friend_request_received'
  );
  
  // 2. Deduplicate accepted notifications by actor_id
  const deduplicatedNotifications = [];
  const seenActorsForAccepted = new Set();
  
  baseVisibleNotifications.forEach(notif => {
    const isAcceptedType = notif.type === 'friend_request_accepted' || notif.type === 'follow_request_accepted';
    
    if (isAcceptedType) {
      if (!seenActorsForAccepted.has(notif.actor_id)) {
        seenActorsForAccepted.add(notif.actor_id);
        deduplicatedNotifications.push(notif);
      }
    } else {
      deduplicatedNotifications.push(notif);
    }
  });

  // Calculate debug metrics
  const rawCount = rawNotifications.length;
  const hiddenMessageCount = rawNotifications.filter(n => n.type === 'new_message').length;
  const staleRequestCount = rawNotifications.filter(n => n.type === 'friend_request_received').length;
  const acceptedRawCount = baseVisibleNotifications.filter(n => n.type === 'friend_request_accepted' || n.type === 'follow_request_accepted').length;
  const acceptedDedupedCount = deduplicatedNotifications.filter(n => n.type === 'friend_request_accepted' || n.type === 'follow_request_accepted').length;
  const duplicateAcceptedHiddenCount = acceptedRawCount - acceptedDedupedCount;

  // The actual visible total consists of incoming requests + valid notifications
  const visibleCount = incomingRequests.length + deduplicatedNotifications.length;

  // The badge count should only include UNREAD valid notifications + pending requests
  const unreadVisibleCount = incomingRequests.length + deduplicatedNotifications.filter(n => !n.is_read).length;

  return {
    visibleNotifications: deduplicatedNotifications,
    incomingRequests,
    sentRequests,
    visibleCount,
    unreadVisibleCount,
    debugMetrics: {
      rawCount,
      visibleCount,
      hiddenMessageCount,
      staleRequestCount,
      duplicateAcceptedHiddenCount,
      finalBadgeCount: unreadVisibleCount > 0 ? unreadVisibleCount : null
    }
  };
};
