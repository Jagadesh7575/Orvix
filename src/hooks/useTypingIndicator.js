import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useTypingIndicator(chatId) {
  const { user } = useAuth();
  const [remoteTypingUser, setRemoteTypingUser] = useState(null);
  
  const debugRef = useRef({
    typingChannelName: null,
    typingSubscriptionStatus: 'UNSUBSCRIBED',
    lastTypingEventReceivedTime: null,
    remoteTypingUserId: null,
    remoteTypingUsername: null,
    isRemoteTyping: false,
    lastTypingTrueSentTime: null,
    lastTypingFalseSentTime: null,
    typingAutoHideTimeoutMs: 2500,
    typingBroadcastError: null,
    typingEventsReceivedCount: 0,
    typingEventsSentCount: 0
  });

  const channelRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const lastSentTimeRef = useRef(0);

  // Set up the typing broadcast channel
  useEffect(() => {
    if (!chatId || !user) return;

    const channelName = `typing:${chatId}`;
    debugRef.current.typingChannelName = channelName;

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false }
      }
    });

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        debugRef.current.typingEventsReceivedCount++;
        debugRef.current.lastTypingEventReceivedTime = new Date().toISOString();
        
        const { userId, username, isTyping } = payload.payload;
        
        // Ignore our own typing events just in case
        if (userId === user.id) return;

        if (isTyping) {
          setRemoteTypingUser({ id: userId, username });
          debugRef.current.remoteTypingUserId = userId;
          debugRef.current.remoteTypingUsername = username;
          debugRef.current.isRemoteTyping = true;
          
          // Auto-hide after 2.5 seconds of silence
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = setTimeout(() => {
            setRemoteTypingUser(null);
            debugRef.current.isRemoteTyping = false;
          }, 2500);
        } else {
          setRemoteTypingUser(null);
          debugRef.current.isRemoteTyping = false;
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        }
      })
      .subscribe((status) => {
        debugRef.current.typingSubscriptionStatus = status;
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [chatId, user]);

  const sendTypingEvent = useCallback(async (isTyping) => {
    if (!channelRef.current || !user) return;
    
    // Throttle typing=true to once every 1000ms
    const now = Date.now();
    if (isTyping) {
      if (now - lastSentTimeRef.current < 1000) return;
      lastSentTimeRef.current = now;
      debugRef.current.lastTypingTrueSentTime = new Date().toISOString();
    } else {
      lastSentTimeRef.current = 0; // reset to allow immediate true later
      debugRef.current.lastTypingFalseSentTime = new Date().toISOString();
    }

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          chatId,
          userId: user.id,
          username: user.username,
          isTyping,
          timestamp: now
        }
      });
      debugRef.current.typingEventsSentCount++;
    } catch (err) {
      debugRef.current.typingBroadcastError = String(err);
      console.error('Typing broadcast error:', err);
    }
  }, [chatId, user]);

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      // Best effort send false on unmount
      if (channelRef.current && user) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            chatId,
            userId: user.id,
            username: user.username,
            isTyping: false,
            timestamp: Date.now()
          }
        }).catch(() => {});
      }
    };
  }, [chatId, user]);

  return {
    remoteTypingUser,
    sendTypingEvent,
    typingDebugMetrics: debugRef.current
  };
}
