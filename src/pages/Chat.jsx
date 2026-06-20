import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Send, Lock, Image as ImageIcon, Smile, Mic, MoreVertical, Phone, Video } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { friendService } from '../services/friendService';
import { chatService } from '../services/chatService';
import { safeBack } from '../utils/navigation';
import { isUserActuallyOnline, formatLastSeen } from '../utils/presence';
import { pageFade } from '../lib/motionVariants';
import Avatar from '../components/Avatar';
import { ChatSkeleton } from '../components/Skeletons';
import { useMinuteTicker } from '../hooks/useMinuteTicker';
import { formatInstagramRelativeTime } from '../utils/timeFormat';

import AttachmentMenu from '../components/chat/AttachmentMenu';
import UploadProgressBubble from '../components/chat/UploadProgressBubble';
import ImageMessage from '../components/chat/ImageMessage';
import MediaViewer from '../components/chat/MediaViewer';

const ENABLE_SEEN_DEBUG = false;

const formatSeenTime = (seenAt) => {
  if (!seenAt) return null;

  const seenTime = new Date(seenAt).getTime();

  if (Number.isNaN(seenTime)) {
    return "Seen";
  }

  const diffMs = Date.now() - seenTime;
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) return "Seen just now";
  if (diffMinutes < 60) return `Seen ${diffMinutes}m ago`;
  if (diffHours < 24) return `Seen ${diffHours}h ago`;
  if (diffDays < 7) return `Seen ${diffDays}d ago`;
  return `Seen ${Math.max(1, diffWeeks)}w ago`;
};

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [activeChatId, setActiveChatId] = useState(null);
  
  const { messages, loading: messagesLoading, error: useChatError, isSending, sendMessage } = useChat(activeChatId);
  const { remoteTypingUser, sendTypingEvent } = useTypingIndicator(activeChatId);
  
  const [friend, setFriend] = useState(null);
  const [inputText, setInputText] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  
  // Specific Error States
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState(null);
  const [messagesError, setMessagesError] = useState(null);
  const [membersError, setMembersError] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const [toastMsg, setToastMsg] = useState(null);

  // Media States
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    previewUrl: null,
    error: null,
    file: null,
    messageType: 'image'
  });
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    message: null
  });
  
  const minuteTick = useMinuteTicker();
  const [seenTimeTick, setSeenTimeTick] = useState(0);
  const [chatMembersRead, setChatMembersRead] = useState([]);
  const [rawChatMembers, setRawChatMembers] = useState([]);
  const [showSeenDebug, setShowSeenDebug] = useState(false);
  const [readReceiptRealtimeEventCount, setReadReceiptRealtimeEventCount] = useState(0);
  const [seenPollingActive, setSeenPollingActive] = useState(false);
  const [seenPollingAttemptCount, setSeenPollingAttemptCount] = useState(0);
  const [seenPollingReason, setSeenPollingReason] = useState("none");
  const [lastSeenPollingRefetchAt, setLastSeenPollingRefetchAt] = useState(null);
  const [seenPollingStoppedReason, setSeenPollingStoppedReason] = useState("none");


  const [markReadLocalCalled, setMarkReadLocalCalled] = useState(false);
  const [markReadSupabaseCalled, setMarkReadSupabaseCalled] = useState(false);
  const [markReadSupabaseResult, setMarkReadSupabaseResult] = useState(null);
  const [markReadSupabaseError, setMarkReadSupabaseError] = useState(null);
  const [markReadTriggeredByMessageId, setMarkReadTriggeredByMessageId] = useState(null);
  const [markReadTriggeredAt, setMarkReadTriggeredAt] = useState(null);
  const [markReadSkipped, setMarkReadSkipped] = useState(null);
  const [markReadSkipReason, setMarkReadSkipReason] = useState(null);
  const [prevLastReadAt, setPrevLastReadAt] = useState(null);
  const [prevLastReadMsgId, setPrevLastReadMsgId] = useState(null);

  const [lastRealtimeReadReceiptPayload, setLastRealtimeReadReceiptPayload] = useState(null);
  const [lastRealtimeReadReceiptReceivedAt, setLastRealtimeReadReceiptReceivedAt] = useState(null);
  const [realtimeReadReceiptSubscriptionStatus, setRealtimeReadReceiptSubscriptionStatus] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  
  const hasInitialScrolledRef = useRef(false);
  const pendingAutoScrollRef = useRef(false);

  const returnTo = location.state?.returnTo;
  const from = location.state?.from;
  const stateOtherUser = location.state?.otherUser;
  const stateConversation = location.state?.conversation;

  const initialOtherUser = 
    stateOtherUser || 
    stateConversation?.friend || 
    stateConversation?.otherUser || 
    stateConversation?.profile || 
    null;

  const handleBack = useCallback(() => {
    if (returnTo) {
      navigate(returnTo, { replace: true });
      return;
    }
    if (from === "recent_conversations") {
      navigate("/app/chats", { replace: true });
      return;
    }
    if (from === "home_recent_chats") {
      navigate("/app/home", { replace: true });
      return;
    }
    navigate(-1);
  }, [navigate, returnTo, from]);

  useEffect(() => {
    console.log("CHAT_NAVIGATION_SOURCE", {
      chatId,
      from,
      returnTo,
      currentPath: location.pathname
    });

    return () => {
      console.log("CHAT_BACK_NAVIGATION", {
        chatId,
        from,
        returnTo,
        target: returnTo || from || "fallback"
      });
    };
  }, [chatId, from, returnTo, location.pathname]);

  useEffect(() => {
    const setupBackHandler = async () => {
      try {
        const { App: CapacitorApp } = await import("@capacitor/app");
        const listener = await CapacitorApp.addListener("backButton", () => {
          handleBack();
        });
        return listener;
      } catch (err) {
        console.warn("Capacitor App plugin not available", err);
        return null;
      }
    };

    let backListener;
    setupBackHandler().then(listener => {
      backListener = listener;
    });

    return () => {
      backListener?.remove?.();
    };
  }, [handleBack]);

  useEffect(() => {
    hasInitialScrolledRef.current = false;
    pendingAutoScrollRef.current = true;
  }, [chatId]);

  const forceInitialScroll = location.state?.scrollToBottom === true;

  const scrollToBottom = (behavior = "auto") => {
    const run = () => {
      messagesEndRef.current?.scrollIntoView({
        behavior,
        block: "end"
      });
    };

    requestAnimationFrame(() => {
      run();
      setTimeout(run, 80);
      setTimeout(run, 250);
      setTimeout(run, 500);
    });
  };

  const isNearBottom = () => {
    const el = chatContainerRef.current;
    if (!el) return true;
    const threshold = 160;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  const latestMessageId = messages && messages.length > 0 ? messages[messages.length - 1].id : null;
  const latestMessageSenderId = messages && messages.length > 0 ? messages[messages.length - 1].sender_id : null;

  useEffect(() => {
    if (!latestMessageId) return;

    if (!hasInitialScrolledRef.current || location.state?.scrollToBottom) {
      scrollToBottom("auto");
      hasInitialScrolledRef.current = true;
      pendingAutoScrollRef.current = false;
      return;
    }

    if (pendingAutoScrollRef.current) {
      scrollToBottom("smooth");
      pendingAutoScrollRef.current = false;
      return;
    }

    const shouldAutoScroll = 
      latestMessageSenderId === user?.id || 
      isNearBottom();

    console.log("CHAT_AUTOSCROLL_CHECK", {
      chatId,
      latestMessageId,
      messagesCount: messages?.length,
      isNearBottom: isNearBottom()
    });

    if (shouldAutoScroll) {
      setTimeout(() => scrollToBottom("smooth"), 80);
    }
  }, [latestMessageId, latestMessageSenderId, user?.id, chatId]);

  // Read Receipts fetching and subscription
  const refreshChatMembersReadState = useCallback(async () => {
    if (!activeChatId) return;
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: members } = await supabase
        .from('chat_members')
        .select('*')
        .eq('chat_id', activeChatId);
      if (members) setRawChatMembers(members);

      const { data, error } = await supabase.rpc("get_private_chat_read_status", {
        target_chat_id: activeChatId
      });
      
      if (import.meta.env.DEV) {
        console.log("[SeenDebug] get_private_chat_read_status result", { data, error });
      }
      
      if (data) {
        setChatMembersRead(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeChatId]);

  useEffect(() => {
    if (!user?.id || !activeChatId) return;

    const latestMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    
    let markReadSkippedLocal = false;
    let markReadSkipReasonLocal = "none";
    let currentUserLastReadMessageId = null;
    let currentUserLastReadAt = null;

    if (!latestMessage) {
      markReadSkippedLocal = true;
      markReadSkipReasonLocal = "no_latest_message";
    } else if (latestMessage.sender_id === user.id) {
      markReadSkippedLocal = true;
      markReadSkipReasonLocal = "latest_message_is_mine";
    } else {
      const currentUserMember = rawChatMembers?.find(m => m.user_id === user.id);
      currentUserLastReadMessageId = currentUserMember?.last_read_message_id || null;
      currentUserLastReadAt = currentUserMember?.last_read_at || null;

      if (currentUserLastReadMessageId === latestMessage.id) {
        markReadSkippedLocal = true;
        markReadSkipReasonLocal = "already_read_latest_message";
      } else if (currentUserLastReadAt && new Date(currentUserLastReadAt).getTime() >= new Date(latestMessage.created_at).getTime()) {
        markReadSkippedLocal = true;
        markReadSkipReasonLocal = "already_read_by_timestamp";
      } else {
        markReadSkippedLocal = false;
        markReadSkipReasonLocal = "new_unread_message_marked_read";
      }
    }

    setMarkReadSkipped(markReadSkippedLocal);
    setMarkReadSkipReason(markReadSkipReasonLocal);
    if (!markReadSkippedLocal) {
      setPrevLastReadAt(currentUserLastReadAt);
      setPrevLastReadMsgId(currentUserLastReadMessageId);
    }

    if (import.meta.env.DEV) {
      if (markReadSkippedLocal) {
        console.log("[SeenDebug] markChatRead skipped", { reason: markReadSkipReasonLocal });
      } else {
        console.log("[SeenDebug] markChatRead requested", { reason: markReadSkipReasonLocal });
        console.log("[SeenDebug] previous read receipt", { currentUserLastReadMessageId, currentUserLastReadAt });
      }
    }

    if (!markReadSkippedLocal && latestMessage) {
      const now = new Date().toISOString();
      if (import.meta.env.DEV) {
         console.log("[SeenDebug] markChatRead updated");
         console.log("[SeenDebug] new read receipt", { currentUserLastReadMessageId: latestMessage.id, currentUserLastReadAt: now });
      }
      chatService.markChatReadLocally(user.id, activeChatId, latestMessage.id);
      setMarkReadLocalCalled(true);
      setMarkReadTriggeredByMessageId(latestMessage.id);
      setMarkReadTriggeredAt(now);

      setMarkReadSupabaseCalled(true);
      chatService.markChatReadInSupabase(activeChatId, user.id, latestMessage.id).then(res => {
         setMarkReadSupabaseResult(res);
         refreshChatMembersReadState();
      }).catch(err => {
         console.error(err);
         setMarkReadSupabaseError(err?.message || "Error");
      });
    }
  }, [messages, user?.id, activeChatId, rawChatMembers, refreshChatMembersReadState]);


  useEffect(() => {
    if (activeChatId) {
      if (import.meta.env.DEV) {
        console.log("[SeenDebug] chat opened", { activeChatId });
      }
      refreshChatMembersReadState();
    }
  }, [activeChatId, refreshChatMembersReadState]);

  useEffect(() => {
    if (!activeChatId) return;
    let channel;
    const setupSubscription = async () => {
      const { supabase } = await import('../lib/supabase');
      channel = supabase
        .channel(`seen_debug_chat_members_${activeChatId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "chat_members",
            filter: `chat_id=eq.${activeChatId}`
          },
          payload => {
            if (import.meta.env.DEV) {
              console.log("[SeenDebug] realtime read receipt change detected", payload);
            }
            setLastRealtimeReadReceiptPayload(payload);
            setLastRealtimeReadReceiptReceivedAt(new Date().toISOString());
            setReadReceiptRealtimeEventCount(prev => prev + 1);
            
            if (payload.new) {
              setRawChatMembers(prev => {
                const existing = Array.isArray(prev) ? prev : [];
                const nextRow = payload.new;
                const found = existing.some(row => row.id === nextRow.id || row.user_id === nextRow.user_id);
                if (found) {
                  return existing.map(row => 
                    (row.id === nextRow.id || row.user_id === nextRow.user_id) 
                      ? { ...row, ...nextRow } 
                      : row
                  );
                }
                return [...existing, nextRow];
              });
            }

            refreshChatMembersReadState();
          }
        )
        .subscribe(status => {
          setRealtimeReadReceiptSubscriptionStatus(status);
        });
    };
    setupSubscription();
    
    return () => {
      if (channel) {
        if (import.meta.env.DEV) {
          console.log("[SeenDebug] subscription cleanup");
        }
        import('../lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channel);
        });
      }
    };
  }, [activeChatId, refreshChatMembersReadState]);

  // Scroll on typing indicator appear
  useEffect(() => {
    if (remoteTypingUser) {
      if (isNearBottom()) {
        requestAnimationFrame(() => {
          scrollToBottom("smooth");
        });
      }
    }
  }, [remoteTypingUser]);

  // Load friend details securely
  useEffect(() => {
    const fetchChatDetails = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        
        // 1. Resolve Canonical Chat ID
        const { data: resolveData, error: resolveError } = await supabase.rpc('resolve_chat_for_current_user', { p_chat_id: chatId });
        
        if (resolveError || !resolveData?.success) {
           setAccessDenied(true);
           setAccessDeniedReason(resolveError?.message || resolveData?.error || "You do not have access to this chat.");
           return;
        }

        const resolvedChatId = resolveData?.chat_id || chatId;

        if (resolvedChatId !== chatId && resolveData?.redirected) {
          navigate(`/app/chat/${resolvedChatId}`, { replace: true });
          return;
        }

        setActiveChatId(resolvedChatId);

        // Fetch chat member to verify access using RPC
        const { data: accessData, error: accessError } = await supabase.rpc('check_chat_access', { p_chat_id: resolvedChatId });
        
        if (accessError || !accessData?.has_access) {
           setAccessDenied(true);
           setAccessDeniedReason(accessData?.error || "You do not have access to this chat.");
           return;
        }
        
        setAccessDenied(false);

        // Now fetch friend profile safely
        const { data: members, error: memError } = await supabase
          .from('chat_members')
          .select(`
            user_id,
            profiles:user_id (
              id,
              username,
              full_name,
              avatar_url,
              is_online,
              last_seen
            )
          `)
          .eq('chat_id', resolvedChatId);
          
        if (memError || !members) {
           setMembersError(memError?.message || "Failed to fetch members");
           if (!initialOtherUser) {
             setFriend({ full_name: "Chat", username: "conversation", is_online: false });
           }
           return;
        }

        const friendMember = members?.find((m) => m.user_id !== user.id);
        const friendProfile = Array.isArray(friendMember?.profiles)
          ? friendMember.profiles[0]
          : friendMember?.profiles;

        if (friendProfile) {
           setFriend(friendProfile);
        } else if (!initialOtherUser) {
           setProfileError("Could not find friend profile in members");
           setFriend({ full_name: "Chat", username: "conversation", is_online: false });
        }
        
         setPageLoading(false);
      } catch (err) {
        console.error("Error verifying chat access:", err);
        setAccessDenied(true);
        setAccessDeniedReason(err.message || "You do not have access to this chat.");
        setPageLoading(false);
      }
    };
    
    if (chatId && user) {
      if (!friend && initialOtherUser) {
        setFriend(initialOtherUser);
        setPageLoading(false);
      }
      if (!initialOtherUser) {
        setPageLoading(true);
      }
      fetchChatDetails();
    }
  }, [chatId, user, navigate]); // Removed initialOtherUser to prevent loops

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    if (val.trim().length > 0) {
      sendTypingEvent(true);
    } else {
      sendTypingEvent(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    
    const content = inputText;
    setInputText(''); // Optimistic clear
    sendTypingEvent(false); // Stop typing immediately
    
    pendingAutoScrollRef.current = true;
    scrollToBottom("smooth");

    const success = await sendMessage(content);
    if (!success) {
       setInputText(content); // Restore if failed
    }
    
    // Keep focus
    if (inputRef.current) {
       inputRef.current.focus();
    }
  };

  const processMediaUpload = async (file) => {
    showToast('Media upload is temporarily disabled');
  };

  const handleFileSelected = (file) => {
    processMediaUpload(file);
  };

  const cancelUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      previewUrl: null,
      error: null,
      file: null,
      messageType: 'image'
    });
  };

  const handleInputFocus = () => {
    setTimeout(() => scrollToBottom("smooth"), 250);
  };

  // Sync useChat errors to local state
  useEffect(() => {
    if (useChatError) {
      setMessagesError(useChatError);
    }
  }, [useChatError]);



  useEffect(() => {
    if (!friend?.id) return;

    let channel;
    import('../lib/supabase').then(({ supabase }) => {
      channel = supabase
        .channel(`profile_status_${friend.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${friend.id}`
          },
          payload => {
            console.log("CHAT_HEADER_PROFILE_STATUS_UPDATE", payload);
            setFriend(prev => ({
              ...prev,
              ...payload.new
            }));
          }
        )
        .subscribe(status => {
          console.log("CHAT_HEADER_PROFILE_STATUS_SUBSCRIPTION", status);
        });
    });

    return () => {
      if (channel) {
        import('../lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channel);
        });
      }
    };
  }, [friend?.id]);

  const headerName = 
    friend?.full_name?.trim() || 
    friend?.username?.trim() || 
    stateOtherUser?.full_name?.trim() || 
    stateOtherUser?.username?.trim() || 
    stateConversation?.friend?.full_name?.trim() || 
    stateConversation?.friend?.username?.trim() || 
    stateConversation?.otherUser?.full_name?.trim() || 
    stateConversation?.otherUser?.username?.trim() || 
    initialOtherUser?.full_name?.trim() || 
    initialOtherUser?.username?.trim() || 
    "Chat";

  const onlineStatusText = friend?.is_online 
    ? "Online" 
    : friend?.last_seen 
      ? `Last seen ${formatInstagramRelativeTime(friend.last_seen)}` 
      : "Offline";

  const showOnlineDot = friend?.is_online === true;

  console.log("CHAT_HEADER_RENDER", {
    chatId,
    otherUser: friend,
    headerName,
    onlineStatusText,
    source: {
      fromNavigationState: !!stateOtherUser,
      fromConversation: !!stateConversation,
      fromFetch: !!friend && !initialOtherUser
    }
  });



  const seenState = React.useMemo(() => {
    const safeMessages = Array.isArray(messages) ? messages : [];
    const safeRawChatMembers = Array.isArray(rawChatMembers) ? rawChatMembers : [];

    const latestMessage = safeMessages.length ? safeMessages[safeMessages.length - 1] : null;
    
    const latestOutgoingMessage = [...safeMessages]
      .reverse()
      .find(msg => msg.sender_id === user?.id) || null;
      
    const rpcReadStatusRow = Array.isArray(chatMembersRead)
      ? chatMembersRead[0]
      : chatMembersRead || null;

    let otherUserLastReadAt = null;
    let otherUserLastReadMessageId = null;
    let readReceiptRowSource = "none";

    const currentUserMemberRow = safeRawChatMembers.find(m => m.user_id === user?.id) || null;
    const otherUserMemberRow = safeRawChatMembers.find(m => m.user_id !== user?.id) || null;

    if (otherUserMemberRow?.last_read_message_id || otherUserMemberRow?.last_read_at) {
      otherUserLastReadAt = otherUserMemberRow.last_read_at || null;
      otherUserLastReadMessageId = otherUserMemberRow.last_read_message_id || null;
      readReceiptRowSource = "rawChatMembers_other_user_row";
    } else if (rpcReadStatusRow?.other_user_last_read_message_id || rpcReadStatusRow?.other_user_last_read_at) {
      otherUserLastReadAt = rpcReadStatusRow.other_user_last_read_at || null;
      otherUserLastReadMessageId = rpcReadStatusRow.other_user_last_read_message_id || null;
      readReceiptRowSource = "rpc_other_user_named_fields";
    } else {
      readReceiptRowSource = "no_other_user_read_status";
    }

    let computedIsLatestOutgoingSeen = false;
    let seenCalculationMethod = "none";
    let renderedSeenText = null;
    let seenElementShouldExist = false;
    let seenRenderFailureReason = "none";

    let seenTimeSourceAt = otherUserLastReadAt || null;
    let seenTimeRenderedAt = new Date().toISOString();
    let seenTimeAgeMs = otherUserLastReadAt ? Date.now() - new Date(otherUserLastReadAt).getTime() : 0;
    let seenTimeAgeSeconds = Math.floor(seenTimeAgeMs / 1000);
    let seenTimeAgeMinutes = Math.floor(seenTimeAgeMs / 60000);
    let seenTimeFormatterInput = otherUserLastReadAt;
    let seenTimeResetSuspicion = "none";

    if (!latestOutgoingMessage) {
      computedIsLatestOutgoingSeen = false;
      seenCalculationMethod = "no_latest_outgoing";
      renderedSeenText = null;
      seenElementShouldExist = false;
      seenRenderFailureReason = "no_latest_outgoing";
    } else if (latestMessage && latestMessage.sender_id !== user?.id) {
      computedIsLatestOutgoingSeen = false;
      seenCalculationMethod = "latest_overall_message_not_mine";
      renderedSeenText = null;
      seenElementShouldExist = false;
      seenRenderFailureReason = "latest_overall_message_not_mine";
    } else if (latestMessage && latestOutgoingMessage.id !== latestMessage.id) {
      computedIsLatestOutgoingSeen = false;
      seenCalculationMethod = "latest_outgoing_not_latest_overall";
      renderedSeenText = null;
      seenElementShouldExist = false;
      seenRenderFailureReason = "latest_outgoing_not_latest_overall";
    } else if (!otherUserLastReadAt && !otherUserLastReadMessageId) {
      computedIsLatestOutgoingSeen = false;
      seenCalculationMethod = "no_other_user_read_status";
      renderedSeenText = null;
      seenElementShouldExist = false;
      seenRenderFailureReason = "no_other_user_read_status";
    } else if (otherUserLastReadMessageId) {
      computedIsLatestOutgoingSeen = (otherUserLastReadMessageId === latestOutgoingMessage.id);
      if (computedIsLatestOutgoingSeen) {
        seenCalculationMethod = "message_id_match";
        renderedSeenText = formatSeenTime(otherUserLastReadAt);
        seenElementShouldExist = true;
        seenRenderFailureReason = "none";
      } else {
        seenCalculationMethod = "message_id_mismatch_not_seen";
        renderedSeenText = null;
        seenElementShouldExist = false;
        seenRenderFailureReason = "message_id_mismatch_not_seen";
      }
    } else if (!otherUserLastReadMessageId && otherUserLastReadAt) {
      computedIsLatestOutgoingSeen = new Date(otherUserLastReadAt).getTime() >= new Date(latestOutgoingMessage.created_at).getTime();
      if (computedIsLatestOutgoingSeen) {
        seenCalculationMethod = "timestamp_fallback";
        renderedSeenText = formatSeenTime(otherUserLastReadAt);
        seenElementShouldExist = true;
        seenRenderFailureReason = "none";
      } else {
        seenCalculationMethod = "timestamp_fallback_not_seen";
        renderedSeenText = null;
        seenElementShouldExist = false;
        seenRenderFailureReason = "timestamp_fallback_not_seen";
      }
    }

    if (renderedSeenText === "Seen just now" && seenTimeAgeMinutes > 0) {
       seenTimeResetSuspicion = "formatter_using_current_time";
    }

    let humanDiagnosis = "UNKNOWN_STATE_NEEDS_INVESTIGATION";
    let recommendedNextAction = "Check raw logs.";

    if (!latestOutgoingMessage) {
      humanDiagnosis = "NO_LATEST_OUTGOING";
      recommendedNextAction = "Send a message first.";
    } else if (!messages || messages.length === 0) {
      humanDiagnosis = "NO_MESSAGES";
      recommendedNextAction = "Send a message first.";
    } else if (latestMessage && latestMessage.sender_id !== user?.id) {
      humanDiagnosis = "LATEST_OVERALL_MESSAGE_NOT_MINE";
      recommendedNextAction = "Receiver sent the last message, so your seen status is hidden by default.";
    } else if (!otherUserLastReadAt && !otherUserLastReadMessageId) {
      humanDiagnosis = "OTHER_USER_HAS_NOT_READ_ANYTHING";
      recommendedNextAction = "Ask receiver to open the chat. Watch for realtime payload.";
    } else if (otherUserLastReadMessageId && otherUserLastReadMessageId === latestOutgoingMessage.id) {
      humanDiagnosis = "MESSAGE_ID_MATCH_SEEN_SHOULD_SHOW";
      recommendedNextAction = "Everything is working perfectly. ID match wins.";
    } else if (otherUserLastReadMessageId && otherUserLastReadMessageId !== latestOutgoingMessage.id) {
      humanDiagnosis = "MESSAGE_ID_MISMATCH_SEEN_HIDDEN";
      recommendedNextAction = "Receiver has read up to an older message, or message IDs are out of sync.";
    } else if (!otherUserLastReadMessageId && otherUserLastReadAt) {
      if (new Date(otherUserLastReadAt).getTime() >= new Date(latestOutgoingMessage.created_at).getTime()) {
        humanDiagnosis = "TIMESTAMP_FALLBACK_SEEN";
        recommendedNextAction = "No message ID found, but timestamp says they read it.";
      } else {
        humanDiagnosis = "TIMESTAMP_FALLBACK_NOT_SEEN";
        recommendedNextAction = "No message ID found, and timestamp is older than message creation.";
      }
    } else if (!lastRealtimeReadReceiptPayload) {
      humanDiagnosis = "REALTIME_NOT_RECEIVED_YET";
      recommendedNextAction = "Ask receiver to read the message. Check if payload arrives.";
    }

    const fullSeenDebugState = {
      debugBuildVersion: "seen-time-reset-fix-v1",
      debugIssueFocus: "prevent-seen-just-now-reset-on-chat-revisit",
      debugSourceFile: "src/pages/Chat.jsx",
      debugSourceProof: "full-seen-debug-state-active",
      
      activeChatId,
      routeChatId: chatId,
      currentUserId: user?.id,
      currentUserEmail: user?.email,
      otherUserId: friend?.id,
      otherUsername: friend?.username,
      otherFullName: friend?.full_name,

      messagesCount: messages?.length || 0,
      latestMessageId: latestMessage?.id,
      latestMessageSenderId: latestMessage?.sender_id,
      latestMessageCreatedAt: latestMessage?.created_at,
      latestMessageContent: latestMessage?.content,
      latestMessageIsMine: latestMessage?.sender_id === user?.id,

      latestOutgoingMessageId: latestOutgoingMessage?.id,
      latestOutgoingMessageCreatedAt: latestOutgoingMessage?.created_at,
      latestOutgoingMessageContent: latestOutgoingMessage?.content,
      latestOutgoingMessageIsAlsoLatestOverall: latestOutgoingMessage?.id === latestMessage?.id,

      latestIncomingMessageId: safeMessages.filter(m => m.sender_id !== user?.id).pop()?.id,
      latestIncomingMessageCreatedAt: safeMessages.filter(m => m.sender_id !== user?.id).pop()?.created_at,

      allMessagesShortList: safeMessages.slice(-10).map(m => ({
        id: m.id,
        sender_id: m.sender_id,
        isMine: m.sender_id === user?.id,
        created_at: m.created_at,
        contentPreview: m.content?.substring(0, 20)
      })),

      rawChatMembers,
      currentUserMemberRow,
      otherUserMemberRow,

      currentUserLastReadAt: currentUserMemberRow?.last_read_at || null,
      currentUserLastReadMessageId: currentUserMemberRow?.last_read_message_id || null,
      otherUserLastReadAt,
      otherUserLastReadMessageId,
      readReceiptRowSource,
      seenTimeSourceAt,
      seenTimeRenderedAt,
      seenTimeAgeMs,
      seenTimeAgeSeconds,
      seenTimeAgeMinutes,
      seenTimeFormatterInput,
      seenTimeFormatterOutput: renderedSeenText,
      seenTimeResetSuspicion,
      otherUserLastReadAtBeforeRefetch: "unknown",
      otherUserLastReadAtAfterRefetch: "unknown",
      otherUserLastReadAtChangedDuringSenderRevisit: false,
      senderRevisitShouldNotUpdateOtherReadAt: true,

      seenPollingActive,
      seenPollingAttemptCount,
      seenPollingReason,
      lastSeenPollingRefetchAt,
      seenPollingStoppedReason,
      rpcUsedForSeen: readReceiptRowSource === "rpc_other_user_named_fields",
      rpcReadStatusRow,
      rpcReadStatusData: chatMembersRead,
      
      markReadSkipped,
      markReadSkipReason,
      markReadCalled: markReadSupabaseCalled,
      markReadLocalCalled,
      markReadSupabaseCalled,
      markReadSupabaseResult,
      markReadSupabaseError,
      markReadTriggeredByMessageId,
      markReadTriggeredAt,
      prevLastReadAt,
      prevLastReadMsgId,

      realtimeReadReceiptSubscriptionStatus,
      lastRealtimeReadReceiptPayload,
      lastRealtimeReadReceiptReceivedAt,
      lastRealtimeReadReceiptPayloadUserId: lastRealtimeReadReceiptPayload?.new?.user_id,
      lastRealtimeReadReceiptPayloadLastReadAt: lastRealtimeReadReceiptPayload?.new?.last_read_at,
      lastRealtimeReadReceiptPayloadLastReadMessageId: lastRealtimeReadReceiptPayload?.new?.last_read_message_id,
      readReceiptRealtimeEventCount,

      computedIsLatestOutgoingSeen,
      seenCalculationMethod,
      renderedSeenText,
      seenElementShouldExist,
      seenElementCssClass: "instagram-seen-status",
      seenRenderFailureReason,

      idMatchCheck: {
        latestOutgoingMessageId: latestOutgoingMessage?.id,
        otherUserLastReadMessageId,
        idsMatch: otherUserLastReadMessageId === latestOutgoingMessage?.id
      },

      timestampCheck: {
        latestOutgoingMessageCreatedAt: latestOutgoingMessage?.created_at,
        otherUserLastReadAt,
        otherUserReadAtMs: otherUserLastReadAt ? new Date(otherUserLastReadAt).getTime() : null,
        latestOutgoingCreatedAtMs: latestOutgoingMessage?.created_at ? new Date(latestOutgoingMessage.created_at).getTime() : null,
        readMinusMessageMs: (otherUserLastReadAt && latestOutgoingMessage?.created_at) ? new Date(otherUserLastReadAt).getTime() - new Date(latestOutgoingMessage.created_at).getTime() : null,
        isReadAtAfterOrEqualMessageTime: (otherUserLastReadAt && latestOutgoingMessage?.created_at) ? new Date(otherUserLastReadAt).getTime() >= new Date(latestOutgoingMessage.created_at).getTime() : false
      },

      humanDiagnosis,
      recommendedNextAction
    };
    
    if (ENABLE_SEEN_DEBUG) {
      console.log("[SeenDebug] final seen state", fullSeenDebugState);
    }
    
    return fullSeenDebugState;
  }, [seenPollingActive, seenPollingAttemptCount, seenPollingReason, lastSeenPollingRefetchAt, seenPollingStoppedReason, messages, user, rawChatMembers, seenTimeTick, minuteTick, friend?.id, activeChatId, chatId, chatMembersRead, prevLastReadAt, prevLastReadMsgId, markReadSkipped, markReadSkipReason, markReadSupabaseCalled, markReadLocalCalled, markReadSupabaseResult, markReadSupabaseError, markReadTriggeredByMessageId, markReadTriggeredAt, realtimeReadReceiptSubscriptionStatus, lastRealtimeReadReceiptPayload, lastRealtimeReadReceiptReceivedAt, readReceiptRealtimeEventCount]);

  useEffect(() => {
    if (!seenState?.computedIsLatestOutgoingSeen) return;
    if (!seenState?.otherUserLastReadAt) return;

    const interval = setInterval(() => {
      setSeenTimeTick(t => t + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [seenState?.computedIsLatestOutgoingSeen, seenState?.otherUserLastReadAt]);




  const latestMessageIsMine = seenState?.latestMessageIsMine;
  const isAlsoLatest = seenState?.latestOutgoingMessageIsAlsoLatestOverall;
  const seenVisible = seenState?.seenElementShouldExist;
  const latestOutgoingId = seenState?.latestOutgoingMessageId;

  useEffect(() => {
    if (!activeChatId || !user?.id || !latestOutgoingId) return;
    if (!latestMessageIsMine || !isAlsoLatest || seenVisible) {
      setSeenPollingActive(false);
      setSeenPollingStoppedReason(seenVisible ? "seen_visible" : "not_applicable");
      return;
    }

    setSeenPollingActive(true);
    setSeenPollingReason("waiting_for_seen");
    setSeenPollingAttemptCount(0);
    setSeenPollingStoppedReason("none");

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      setSeenPollingAttemptCount(attempts);
      setLastSeenPollingRefetchAt(new Date().toISOString());
      
      refreshChatMembersReadState();

      if (attempts >= 10) {
        clearInterval(interval);
        setSeenPollingActive(false);
        setSeenPollingStoppedReason("max_attempts_reached");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    activeChatId,
    user?.id,
    latestOutgoingId,
    latestMessageIsMine,
    isAlsoLatest,
    seenVisible,
    refreshChatMembersReadState
  ]);

  if (accessDenied) {
    return (
      <div className="min-h-full w-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold app-text mb-2 font-display">Access Denied</h2>
        <p className="app-muted mb-6">{accessDeniedReason}</p>
        
        <div className="flex space-x-3 mb-6">
          <button 
            onClick={() => navigate('/app/home')} 
            className="px-6 py-3 bg-surface border app-border rounded-xl font-medium app-text hover:bg-white/5 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleCopySeenDebug = async () => {
    try {
      const text = JSON.stringify(seenState, null, 2);
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast('Logs copied');
      } else {
        console.log("COPY_FULL_SEEN_DEBUG_JSON", seenState);
        showToast("Clipboard unavailable, logs printed");
      }
    } catch (err) {
      console.error("COPY_SEEN_DEBUG_FAILED", err);
      console.log("COPY_FULL_SEEN_DEBUG_JSON", seenState);
      showToast("Copy failed, logs printed");
    }
  };

  return (
    <>
      <motion.div 
        variants={pageFade} 
        initial="hidden" 
        animate="show" 
        exit="exit" 
        className="fixed inset-0 z-50 bg-[var(--theme-bg)] flex flex-col pt-safe"
      >
      <AnimatePresence>
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-surface border app-border px-4 py-2 rounded-full shadow-lg shadow-black/20 backdrop-blur-md flex items-center space-x-2"
          >
            <span className="text-sm font-medium text-[var(--theme-text)]">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-[var(--theme-bg)]/80 backdrop-blur-xl border-b app-border pt-safe">
        <div className="flex items-center justify-between p-3 h-16">
          <div className="flex items-center flex-1">
            <button 
              onClick={handleBack} 
              className="p-2 -ml-2 mr-1 hover:bg-white/5 rounded-full transition-colors active:scale-95 text-[var(--theme-text)]"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
             {pageLoading && !friend ? (
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
                 <div className="space-y-2">
                   <div className="h-4 w-24 bg-white/5 animate-pulse rounded" />
                   <div className="h-3 w-16 bg-white/5 animate-pulse rounded" />
                 </div>
               </div>
            ) : (
               <div 
                 className="flex items-center flex-1 cursor-pointer" 
                 onClick={() => friend?.username && navigate(`/app/profile/${friend.username}`)}
               >
                 <div className="relative">
                   <Avatar url={friend?.avatar_url || initialOtherUser?.avatar_url} className="w-10 h-10 border border-[var(--theme-border)]/50 shadow-sm" />
                   {showOnlineDot && (
                     <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--theme-bg)] rounded-full shadow-sm z-10"></div>
                   )}
                 </div>
                 <div className="ml-3 overflow-hidden">
                   <h2 className="font-display font-semibold app-text text-base truncate pr-2">
                     {headerName}
                   </h2>
                   <p className="text-xs app-muted truncate font-medium flex items-center">
                     {showOnlineDot ? (
                       <span className="text-green-500">Online</span>
                     ) : (
                       <span>{onlineStatusText}</span>
                     )}
                   </p>
                 </div>
               </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            <button onClick={() => showToast('Voice calls coming soon')} className="p-2 app-muted hover:text-[var(--theme-primary)] hover:bg-white/5 rounded-full transition-colors active:scale-95">
              <Phone className="w-5 h-5" />
            </button>
            <button onClick={() => showToast('Video calls coming soon')} className="p-2 app-muted hover:text-[var(--theme-primary)] hover:bg-white/5 rounded-full transition-colors active:scale-95">
              <Video className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          border-radius: 20px;
          border-top-left-radius: 4px;
          width: fit-content;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .typing-indicator span {
          width: 6px;
          height: 6px;
          background-color: var(--theme-text);
          opacity: 0.6;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
          40% { transform: scale(1); opacity: 0.8; }
        }
        .instagram-message-status {
          font-size: 11px;
          line-height: 1.2;
          color: var(--theme-muted);
          opacity: 0.85;
          margin-top: 4px;
          text-align: right;
          padding-right: 6px;
        }
        .instagram-message-status.failed {
          color: #ff6b6b;
        }
      `}</style>

      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 pt-24 pb-4 flex flex-col relative z-10" 
        id="chat-container"
      >
        {pageLoading || messagesLoading ? (
          <div className="flex-1 overflow-hidden space-y-4">
             <ChatSkeleton />
          </div>
        ) : messagesError ? (
          <div className="flex flex-col items-center justify-center h-full opacity-80">
             <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-red-500" />
             </div>
             <p className="text-sm font-medium text-red-500">Failed to load messages</p>
             <p className="text-xs app-muted mt-1 max-w-xs text-center">{messagesError.message || "Something went wrong"}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-60">
             <div className="w-16 h-16 rounded-full bg-surface border app-border flex items-center justify-center mb-4 shadow-[var(--theme-glow)]">
               <Smile className="w-8 h-8 text-[var(--theme-primary)] opacity-80" />
             </div>
             <p className="text-sm font-medium">Say hello to {headerName}!</p>
             <p className="text-xs app-muted mt-1">Messages are private and secure.</p>
          </div>
        ) : (
          <React.Fragment>
            {messages.map((msg, index) => {
              const isMine = msg.sender_id === user?.id;
              
              const latestOutgoingMessage = [...messages].reverse().find(m => m.sender_id === user?.id);
              const isLatestOutgoing = isMine && latestOutgoingMessage?.id === msg.id;

              const statusIcon = (
                <span className={`inline-block ml-1 ${msg.isFailed ? 'text-red-500' : ''}`}>
                  {msg.isFailed ? '⚠️' : '✓'}
                </span>
              );

              const formattedTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  {msg.message_type === 'image' ? (
                    <ImageMessage 
                      message={msg}
                      isMine={isMine}
                      onImageClick={(m) => setViewerState({ isOpen: true, message: m })}
                      showTime={true}
                      formattedTime={formattedTime}
                      statusIcon={statusIcon}
                      seenText={isLatestOutgoing && seenState.seenElementShouldExist ? seenState.renderedSeenText : null}
                    />
                  ) : (
                    <>
                      <div 
                        className={`max-w-[75%] px-4 py-2.5 shadow-sm relative ${
                          isMine 
                            ? `rounded-2xl rounded-tr-sm text-white` 
                            : `rounded-2xl rounded-tl-sm text-[var(--theme-text)] border app-border`
                        }`}
                        style={{
                          background: isMine ? 'var(--theme-bubble-outgoing, var(--theme-primary))' : 'var(--theme-bubble-incoming, var(--theme-surface))',
                          opacity: msg.isOptimistic ? 0.7 : 1,
                          transition: 'opacity 0.2s ease-in-out'
                        }}
                      >
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`text-[10px] mt-1 text-right flex justify-end items-center space-x-1 ${isMine ? 'text-white/70' : 'app-muted'}`}>
                          <span>{formattedTime}</span>
                        </div>
                      </div>
                      {isLatestOutgoing && seenState.seenElementShouldExist && (
                        <div className="instagram-seen-status">
                          {seenState.renderedSeenText}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        )}
        
        {/* Upload Progress */}
        {uploadState.isUploading && (
          <UploadProgressBubble 
            previewUrl={uploadState.previewUrl}
            progress={uploadState.progress}
            error={uploadState.error}
            onRetry={() => processMediaUpload(uploadState.file)}
            onCancel={cancelUpload}
          />
        )}
        
        {/* Typing Indicator */}
        {remoteTypingUser && (
          <div className="flex flex-col items-start mt-2 mb-1">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="text-[10px] app-muted ml-2 mt-1">{remoteTypingUser.username} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[var(--theme-bg)]/80 backdrop-blur-xl border-t app-border flex-shrink-0 z-20 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]">
        <form onSubmit={handleSend} className="flex items-end space-x-2 relative">
          
          <div className="flex-1 bg-surface border app-border rounded-[1.5rem] flex items-end overflow-hidden focus-within:border-[var(--theme-primary)] focus-within:ring-1 focus-within:ring-[var(--theme-primary)] transition-all">
            <button type="button" onClick={() => showToast('Emoji support coming soon')} className="p-3 app-muted hover:text-[var(--theme-primary)] transition-colors">
               <Smile className="w-6 h-6" />
            </button>
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Message..."
              className="flex-1 bg-transparent border-none py-3.5 px-2 app-text focus:outline-none resize-none max-h-32 text-[15px]"
              rows={1}
              style={{ minHeight: '52px' }}
            />
            {inputText.trim().length === 0 && (
              <button type="button" onClick={() => showToast('Voice messages coming soon')} className="p-3 app-muted hover:text-[var(--theme-primary)] transition-colors">
                 <Mic className="w-6 h-6" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {inputText.trim().length > 0 && (
              <motion.button 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                type="submit" 
                disabled={isSending}
                className="w-12 h-12 rounded-full theme-gradient-btn text-white flex items-center justify-center flex-shrink-0 shadow-[var(--theme-glow)] mb-0.5 disabled:opacity-50 transition-transform active:scale-95"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5 ml-1" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </form>
      </div>



    </motion.div>
      
      <MediaViewer 
        isOpen={viewerState.isOpen}
        onClose={() => setViewerState({ isOpen: false, message: null })}
        message={viewerState.message}
        senderName={headerName}
        chatId={activeChatId}
      />
    </>
  );
};

export default Chat;
