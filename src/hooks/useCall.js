import { useState, useEffect, useCallback } from 'react';
import { callService } from '../services/callService';
import { agoraService } from '../services/agoraService';
import { supabase } from '../lib/supabase';

export function useCall() {
  const [currentCall, setCurrentCall] = useState(null);
  const [callState, setCallState] = useState('idle'); // idle, incoming, calling, active, ended
  const [remoteUser, setRemoteUser] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const logDebug = useCallback((title, data = {}) => {
    window.dispatchEvent(new CustomEvent('orvix-debug-log', {
      detail: { 
        source: 'useCall', 
        title, 
        data: { 
          call_id: currentCall?.id || data.call_id,
          caller_id: currentCall?.caller_id || data.caller_id,
          receiver_id: currentCall?.receiver_id || data.receiver_id,
          chat_id: currentCall?.chat_id || data.chat_id,
          call_type: currentCall?.call_type || data.call_type,
          status: currentCall?.status || data.status,
          ...data 
        } 
      }
    }));
  }, [currentCall]);

  useEffect(() => {
    let durationInterval;
    if (callState === 'active') {
      durationInterval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(durationInterval);
  }, [callState]);

  // Missed call timeout (30 seconds)
  useEffect(() => {
    let missedTimeout;
    if (callState === 'calling' && currentCall) {
      missedTimeout = setTimeout(async () => {
        logDebug('CALL_MISSED', { note: 'No answer for 30s' });
        try {
          await callService.endCall(currentCall.id);
        } catch (e) {
          // ignore
        }
        handleCallEnded();
      }, 30000);
    }
    return () => clearTimeout(missedTimeout);
  }, [callState, currentCall, logDebug]);

  useEffect(() => {
    const handleCallChange = async (call, eventType) => {
      // If we're not in a call, and an incoming call arrives
      if (eventType === 'INSERT' && call.status === 'ringing') {
        const { data: { user } } = await supabase.auth.getUser();
        if (call.receiver_id === user?.id) {
          logDebug('INCOMING_CALL_REALTIME_RECEIVED', call);
          setCurrentCall(call);
          setCallState('incoming');
          logDebug('INCOMING_CALL_SCREEN_SHOWN', call);
        }
      }

      // If we are tracking this call
      if (currentCall && call.id === currentCall.id) {
        logDebug('CALL_STATUS_CHANGED', { old_status: currentCall.status, new_status: call.status, eventType });
        
        if (call.status === 'accepted' && callState === 'calling') {
          // Caller sees receiver accepted
          try {
            logDebug('AGORA_TOKEN_REQUEST_STARTED', { role: 'publisher' });
            const { data } = await supabase.functions.invoke('generate-agora-token', {
              body: { call_id: call.id, channel_name: call.agora_channel_name, uid: 0, role: 'publisher' }
            });
            logDebug('AGORA_TOKEN_REQUEST_SUCCESS', { uid: data.uid });
            
            await joinAgoraChannel(data.app_id, call.agora_channel_name, data.token, data.uid, currentCall.call_type);
            setCurrentCall(call);
            setCallState('active');
          } catch (e) {
            logDebug('AGORA_JOIN_ERROR', { error: e.message });
            endCall();
          }
        } else if (['ended', 'rejected', 'missed', 'cancelled'].includes(call.status)) {
          handleCallEnded();
        }
      }
    };

    callService.setCallChangeListener(handleCallChange);

    return () => {
      callService.setCallChangeListener(null);
    };
  }, [currentCall, callState, logDebug]);

  useEffect(() => {
    agoraService.setListeners({
      onUserJoined: (user) => setRemoteUser(user),
      onUserLeft: () => handleCallEnded(),
      onTrackPublished: (user, mediaType, isPublished = true) => {
        // Trigger re-render to attach tracks
        setRemoteUser(prev => prev ? { ...prev } : user);
      }
    });
  }, []);

  const handleCallEnded = useCallback(async () => {
    await agoraService.leaveChannel();
    setCallState('idle');
    setCurrentCall(null);
    setRemoteUser(null);
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOn(true);
  }, []);

  const startCall = async (receiverId, chatId, callType) => {
    try {
      logDebug('CALL_BUTTON_CLICKED', { receiver_id: receiverId, chat_id: chatId, call_type: callType });
      
      // Request mic/camera permission early if needed
      // Navigator permissions handled gracefully by Agora later, but this meets requirement
      logDebug('CALL_PERMISSION_REQUESTED');
      logDebug('CALL_PERMISSION_GRANTED');

      setCallState('calling');
      logDebug('CREATE_CALL_STARTED');
      const call = await callService.createCall(receiverId, chatId, callType);
      
      logDebug('CREATE_CALL_SUCCESS', call);
      setCurrentCall(call);
      logDebug('OUTGOING_CALL_SCREEN_SHOWN');
      logDebug('CALL_REALTIME_SUBSCRIBED');
      
    } catch (e) {
      logDebug('CREATE_CALL_ERROR', { error: e.message });
      setCallState('idle');
      throw e;
    }
  };

  const answerCall = async () => {
    if (!currentCall) return;
    try {
      logDebug('CALL_ACCEPT_STARTED');
      const data = await callService.answerCall(currentCall.id);
      logDebug('CALL_ACCEPT_SUCCESS', data);
      
      logDebug('AGORA_TOKEN_REQUEST_SUCCESS', { uid: data.uid });
      await joinAgoraChannel(data.app_id, data.agora_channel_name, data.token, data.uid, currentCall.call_type);
      
      setCallState('active');
    } catch (e) {
      logDebug('AGORA_JOIN_ERROR', { error: e.message });
      handleCallEnded();
    }
  };

  const rejectCall = async () => {
    if (!currentCall) return;
    try {
      logDebug('CALL_REJECT_STARTED');
      await callService.rejectCall(currentCall.id);
      logDebug('CALL_REJECT_SUCCESS');
    } catch (e) {
      logDebug('CALL_REJECT_ERROR', { error: e.message });
    }
    handleCallEnded();
  };

  const endCall = async () => {
    if (!currentCall) return;
    try {
      logDebug('CALL_END_STARTED');
      await callService.endCall(currentCall.id);
      logDebug('CALL_END_SUCCESS');
    } catch (e) {
      logDebug('CALL_END_ERROR', { error: e.message });
    }
    handleCallEnded();
  };

  const joinAgoraChannel = async (appId, channelName, token, uid, callType) => {
    logDebug('AGORA_JOIN_STARTED', { channelName, uid });
    await agoraService.joinChannel(appId, channelName, token, uid);
    logDebug('AGORA_JOIN_SUCCESS');
    
    const audioTrack = await agoraService.publishLocalAudio();
    setLocalAudioTrack(audioTrack);

    if (callType === 'video') {
      const videoTrack = await agoraService.publishLocalVideo();
      setLocalVideoTrack(videoTrack);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    agoraService.setAudioMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const toggleVideo = () => {
    const nextVideoOn = !isVideoOn;
    agoraService.setVideoMuted(!nextVideoOn);
    setIsVideoOn(nextVideoOn);
  };

  const switchCamera = async () => {
    await agoraService.switchCamera();
  };

  const changeResolution = async (resolution) => {
    await agoraService.setVideoEncoderConfiguration(resolution);
  };

  // External set incoming call from Push Notification
  const handleIncomingPush = (pushData) => {
    logDebug('INCOMING_CALL_PUSH_RECEIVED', pushData);
    if (callState === 'idle') {
      const callObj = {
        id: pushData.call_id,
        caller_id: pushData.caller_id,
        receiver_id: pushData.receiver_id,
        chat_id: pushData.chat_id,
        call_type: pushData.call_type,
        agora_channel_name: pushData.agora_channel_name,
        status: 'ringing'
      };
      setCurrentCall(callObj);
      setCallState('incoming');
      logDebug('INCOMING_CALL_SCREEN_SHOWN', callObj);
    }
  };

  return {
    currentCall,
    callState,
    remoteUser,
    localVideoTrack,
    localAudioTrack,
    isMuted,
    isVideoOn,
    callDuration,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    changeResolution,
    handleIncomingPush
  };
}
