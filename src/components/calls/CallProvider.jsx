import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCall } from '../../hooks/useCall';
import { IncomingCallScreen } from './IncomingCallScreen';
import { OutgoingCallScreen } from './OutgoingCallScreen';
import { ActiveVoiceCallScreen } from './ActiveVoiceCallScreen';
import { ActiveVideoCallScreen } from './ActiveVideoCallScreen';

const CallContext = createContext();

export const useCallContext = () => useContext(CallContext);

export function CallProvider({ children }) {
  const callParams = useCall();
  const { callState, currentCall } = callParams;
  const { user } = useAuth();

  // Start listening to realtime calls globally when authenticated
  useEffect(() => {
    if (user?.id) {
      callService.startListening(user.id);
    }
    return () => {
      callService.stopListening();
    };
  }, [user?.id]);

  // Listen for custom incoming call event from Push Notifications
  useEffect(() => {
    const handlePushEvent = (e) => {
      callParams.handleIncomingPush(e.detail);
    };
    window.addEventListener('incoming-call-push', handlePushEvent);
    return () => window.removeEventListener('incoming-call-push', handlePushEvent);
  }, [callParams]);

  const renderCallScreen = () => {
    if (callState === 'idle') return null;

    if (callState === 'incoming') {
      return <IncomingCallScreen {...callParams} />;
    }

    if (callState === 'calling') {
      return <OutgoingCallScreen {...callParams} />;
    }

    if (callState === 'active') {
      if (currentCall?.call_type === 'video') {
        return <ActiveVideoCallScreen {...callParams} />;
      } else {
        return <ActiveVoiceCallScreen {...callParams} />;
      }
    }

    return null;
  };

  return (
    <CallContext.Provider value={callParams}>
      {children}
      {renderCallScreen()}
    </CallContext.Provider>
  );
}
