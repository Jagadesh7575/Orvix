import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../services/chatService';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export function useChat(chatId, checkIsNearBottom) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  // Keep track of IDs to deduplicate realtime messages and optimistic UI
  const messageIds = useRef(new Set()); 
  
  // Debug metrics tracking
  const debugRef = useRef({
    channelName: null,
    subscriptionStatus: 'UNSUBSCRIBED',
    subscriptionCreatedTime: null,
    subscriptionReadyTime: null,
    latestPayloadReceivedTime: null,
    lastRefetchTime: null,
    refetchReason: 'initial',
    optimisticMessageId: null,
    optimisticReplaced: false,
    duplicateSkippedCount: 0,
    messageSendLocalTime: null,
    rpcResponseTime: null,
    // Polling additions
    pollingEnabled: false,
    pollingIntervalMs: 2000,
    lastPollingFetchTime: null,
    lastPollingNewMessagesCount: 0,
    lastPollingError: null,
    lastSuccessfulSyncSource: 'initial',
    realtimePayloadCount: 0
  });

  // Merge messages logic (reusable)
  const mergeMessages = useCallback((newMessagesArray, source) => {
    debugRef.current.lastSuccessfulSyncSource = source;
    
    setMessages(prev => {
      let addedCount = 0;
      const newState = [...prev];
      
      newMessagesArray.forEach(newMsg => {
        // If we already have it, skip
        if (messageIds.current.has(newMsg.id)) {
          debugRef.current.duplicateSkippedCount++;
          return;
        }
        
        // Add it
        newState.push(newMsg);
        messageIds.current.add(newMsg.id);
        addedCount++;
      });
      
      if (addedCount > 0) {
        if (source === 'polling') {
          debugRef.current.lastPollingNewMessagesCount = addedCount;
        }
        
        // Sort ascending by created_at
        return newState.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      }
      return prev;
    });
  }, []);

  // Safe full refetch (initial / resume)
  const doRefetch = useCallback(async (reason) => {
    if (!chatId) return;
    try {
      debugRef.current.lastRefetchTime = new Date().toISOString();
      debugRef.current.refetchReason = reason;
      
      const data = await chatService.getMessages(chatId);
      
      setMessages(prev => {
        const optimisticMsgs = prev.filter(m => m.id && m.id.toString().startsWith('temp-'));
        
        const newState = [...data];
        messageIds.current.clear();
        data.forEach(msg => messageIds.current.add(msg.id));
        
        optimisticMsgs.forEach(optMsg => {
          newState.push(optMsg);
          messageIds.current.add(optMsg.id);
        });
        
        const sorted = newState.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        return sorted;
      });
      
      debugRef.current.lastSuccessfulSyncSource = reason;
      
      chatService.markMessagesRead(chatId).catch(console.error);
    } catch (err) {
      console.error('Refetch failed:', err);
    }
  }, [chatId]);

  // Initial Load and Resume Logic
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!chatId) return;
      try {
        setLoading(true);
        await doRefetch('initial');
        if (mounted) setError(null);
      } catch (err) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    messageIds.current.clear();
    init();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && chatId) {
        console.log("App Resumed, refetching messages...");
        doRefetch('resume');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [chatId, doRefetch]);

  // Realtime Subscription Logic
  useEffect(() => {
    if (!chatId) return;

    const channelName = `messages:${chatId}`;
    debugRef.current.channelName = channelName;
    debugRef.current.subscriptionCreatedTime = new Date().toISOString();
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const newMessage = payload.new;
          debugRef.current.latestPayloadReceivedTime = new Date().toISOString();
          debugRef.current.realtimePayloadCount++;
          
          console.log("CHAT_REALTIME_MESSAGE_RECEIVED", {
            chatId,
            newMessageId: newMessage.id,
            senderId: newMessage.sender_id,
            currentUserId: user?.id
          });
          
          mergeMessages([newMessage], 'realtime');
          
          if (newMessage.sender_id !== user?.id) {
            chatService.markMessagesRead(chatId).catch(console.error);
          }
        }
      )
      .subscribe((status) => {
        debugRef.current.subscriptionStatus = status;
        if (status === 'SUBSCRIBED') {
          debugRef.current.subscriptionReadyTime = new Date().toISOString();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setTimeout(() => doRefetch('reconnect_recovery'), 2000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user?.id, doRefetch, mergeMessages]);

  // POLLING FALLBACK LOGIC
  useEffect(() => {
    if (!chatId) return;

    debugRef.current.pollingEnabled = true;
    
    const interval = setInterval(async () => {
      // Only poll when the app is visibly active to save resources
      if (document.visibilityState !== 'visible') return;

      try {
        const latest = await chatService.getMessages(chatId);
        debugRef.current.lastPollingFetchTime = new Date().toISOString();
        debugRef.current.lastPollingError = null;
        mergeMessages(latest, 'polling');
      } catch (err) {
        debugRef.current.lastPollingError = err?.message || String(err);
      }
    }, debugRef.current.pollingIntervalMs);

    return () => {
      clearInterval(interval);
      debugRef.current.pollingEnabled = false;
    };
  }, [chatId, mergeMessages]);

  // Send Message with Optimistic UI
  const sendMessage = useCallback(async (content) => {
    if (!content || !content.trim() || !chatId) return false;
    
    const trimmedContent = content.trim();
    const tempId = `temp-${Date.now()}`;
    const localSendTime = new Date().toISOString();
    
    debugRef.current.optimisticMessageId = tempId;
    debugRef.current.messageSendLocalTime = localSendTime;
    debugRef.current.optimisticReplaced = false;

    // Optimistic Render
    const optimisticMessage = {
      id: tempId,
      chat_id: chatId,
      sender_id: user.id,
      content: trimmedContent,
      created_at: localSendTime,
      isOptimistic: true 
    };

    setMessages(prev => {
      messageIds.current.add(tempId);
      return [...prev, optimisticMessage];
    });

    try {
      setIsSending(true);
      setError(null);
      
      const rpcStart = performance.now();
      const message = await chatService.sendMessage(chatId, trimmedContent);
      const rpcEnd = performance.now();
      debugRef.current.rpcResponseTime = `${(rpcEnd - rpcStart).toFixed(2)}ms`;
      
      if (!message) {
        throw new Error('Failed to send message');
      }
      
      // Replace Optimistic Message with Real DB Message
      setMessages(prev => {
        messageIds.current.delete(tempId);
        const filtered = prev.filter(m => m.id !== tempId);
        
        if (!messageIds.current.has(message.id)) {
          messageIds.current.add(message.id);
          filtered.push(message);
          debugRef.current.optimisticReplaced = true;
        } else {
          debugRef.current.duplicateSkippedCount++;
        }
        return filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });
      
      return true;
    } catch (err) {
      console.error('Send message error:', err);
      setError(err.message || 'Failed to send message');
      
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, isFailed: true, isOptimistic: false } : m
      ));
      
      return false;
    } finally {
      setIsSending(false);
    }
  }, [chatId, user]);

  return {
    messages,
    loading,
    error,
    isSending,
    sendMessage,
    debugMetrics: debugRef.current
  };
}
