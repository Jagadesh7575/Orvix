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

  useEffect(() => {
    let durationInterval;
    if (callState === 'active') {
      durationInterval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(durationInterval);
  }, [callState]);

  useEffect(() => {
    const handleCallChange = async (call, eventType) => {
      // If we're not in a call, and an incoming call arrives
      if (eventType === 'INSERT' && call.status === 'ringing') {
        const { data: { user } } = await supabase.auth.getUser();
        if (call.receiver_id === user?.id) {
          setCurrentCall(call);
          setCallState('incoming');
        }
      }

      // If we are tracking this call
      if (currentCall && call.id === currentCall.id) {
        if (call.status === 'accepted' && callState === 'calling') {
          // Caller sees receiver accepted
          try {
            const { data } = await supabase.functions.invoke('generate-agora-token', {
              body: { call_id: call.id, channel_name: call.agora_channel_name, uid: 0, role: 'publisher' }
            });
            await joinAgoraChannel(data.app_id, call.agora_channel_name, data.token, data.uid, currentCall.call_type);
            setCurrentCall(call);
            setCallState('active');
          } catch (e) {
            console.error('Failed to get token or join after accept', e);
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
  }, [currentCall, callState]);

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
      setCallState('calling');
      const call = await callService.createCall(receiverId, chatId, callType);
      setCurrentCall(call);
    } catch (e) {
      setCallState('idle');
      throw e;
    }
  };

  const answerCall = async () => {
    if (!currentCall) return;
    try {
      const data = await callService.answerCall(currentCall.id);
      await joinAgoraChannel(data.app_id, data.agora_channel_name, data.token, data.uid, currentCall.call_type);
      setCallState('active');
    } catch (e) {
      handleCallEnded();
    }
  };

  const rejectCall = async () => {
    if (!currentCall) return;
    try {
      await callService.rejectCall(currentCall.id);
    } catch (e) {
      // Ignored
    }
    handleCallEnded();
  };

  const endCall = async () => {
    if (!currentCall) return;
    try {
      await callService.endCall(currentCall.id);
    } catch (e) {
      // Ignored
    }
    handleCallEnded();
  };

  const joinAgoraChannel = async (appId, channelName, token, uid, callType) => {
    await agoraService.joinChannel(appId, channelName, token, uid);
    
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
    if (callState === 'idle') {
      setCurrentCall({
        id: pushData.call_id,
        caller_id: pushData.caller_id,
        receiver_id: pushData.receiver_id,
        call_type: pushData.call_type,
        agora_channel_name: pushData.agora_channel_name,
        status: 'ringing'
      });
      setCallState('incoming');
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
