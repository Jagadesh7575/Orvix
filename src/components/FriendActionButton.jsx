import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { friendService } from '../services/friendService';

const FriendActionButton = ({ targetUserId, initialStatus = 'none', onStatusChange, onFollowingClick, variant = 'compact' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState(initialStatus === 'none' ? null : initialStatus);
  const [loading, setLoading] = useState(initialStatus === 'none');

  useEffect(() => {
    // If not provided from parent, fetch on mount
    const checkStatus = async () => {
      if (initialStatus === 'none' && targetUserId) {
        setLoading(true);
        const currentStatus = await friendService.getRelationshipStatus(targetUserId);
        setStatus(currentStatus);
        setLoading(false);
      } else {
        setStatus(initialStatus);
      }
    };
    checkStatus();
  }, [targetUserId, initialStatus]);

  const handleAction = async () => {
    if (loading || status === 'self') return;
    setLoading(true);

    try {
      if (status === 'none') {
        const res = await friendService.sendFriendRequest(targetUserId);
        if (res?.success) {
          setStatus('pending_sent');
          if (onStatusChange) onStatusChange('pending_sent');
        } else {
          console.error(res?.error);
        }
      } else if (status === 'friends') {
        // Message button logic
        console.log("Opening chat for target user:", targetUserId);
        const res = await friendService.getOrCreatePrivateChat(targetUserId);
        console.log("getOrCreatePrivateChat result:", res);
        console.log("navigating to chatId:", res?.chat_id);
        
        if (res?.success && res.chat_id) {
          navigate(`/app/chat/${res.chat_id}`, { state: { scrollToBottom: true, from: 'user_profile', returnTo: location.pathname } });
        } else {
          console.error("Failed to unlock chat", res);
          alert("Could not open chat. Please try again.");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await friendService.acceptRequestFromUser(targetUserId);
      if (res?.success) {
        setStatus('friends');
        if (onStatusChange) onStatusChange('friends');
      } else {
        alert(res?.error || "Failed to accept request.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await friendService.declineRequestFromUser(targetUserId);
      if (res?.success) {
        setStatus('none');
        if (onStatusChange) onStatusChange('none');
      } else {
        alert(res?.error || "Failed to decline request.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleContainerClick = (e) => {
    e.stopPropagation();
  };

  if (status === 'self') return null;

  const isFull = variant === 'fullProfile';

  const renderButton = () => {
    if (status === null) {
      return (
        <button 
          disabled
          className={`bg-surface border border-white/10 text-muted font-medium opacity-50 ${isFull ? 'w-full py-3 rounded-2xl text-base' : 'px-4 py-2 rounded-xl text-sm'}`}
        >
          Checking...
        </button>
      );
    }

    switch (status) {
      case 'none':
        return (
          <motion.button 
            whileTap={{ scale: 0.96 }}
            onClick={handleAction} 
            disabled={loading}
            className={`bg-primary text-white font-medium shadow-glow transition-colors disabled:opacity-50 disabled:scale-100 ${isFull ? 'w-full py-3 rounded-2xl text-base' : 'px-4 py-2 rounded-xl text-sm'}`}
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            {loading ? 'Sending...' : 'Follow'}
          </motion.button>
        );
      case 'pending_sent':
        return (
          <button 
            disabled
            className={`bg-surface border border-white/10 text-muted font-medium ${isFull ? 'w-full py-3 rounded-2xl text-base' : 'px-4 py-2 rounded-xl text-sm'}`}
          >
            Requested
          </button>
        );
      case 'pending_received':
        if (isFull) {
          return (
            <div className="flex space-x-3 w-full">
               <motion.button 
                 whileTap={{ scale: 0.96 }}
                 onClick={handleAccept}
                 disabled={loading}
                 className="flex-1 py-3 bg-primary text-white rounded-2xl font-medium text-base shadow-glow transition-colors disabled:opacity-50"
                 style={{ backgroundColor: 'var(--theme-primary)' }}
               >
                 Confirm
               </motion.button>
               <motion.button 
                 whileTap={{ scale: 0.96 }}
                 onClick={handleDecline}
                 disabled={loading}
                 className="flex-1 py-3 bg-surface border border-white/10 text-white rounded-2xl font-medium text-base hover:bg-white/5 transition-colors disabled:opacity-50"
               >
                 Delete
               </motion.button>
            </div>
          );
        } else {
          return (
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/app/activity')}
              disabled={loading}
              className="bg-surface border border-white/10 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Respond in Activity
            </motion.button>
          );
        }
      case 'friends':
        return isFull ? (
          <div className="flex space-x-3 w-full">
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={onFollowingClick}
              className="flex-1 py-3 bg-surface border border-white/10 text-white rounded-2xl font-medium text-base hover:bg-white/5 transition-all flex items-center justify-center space-x-1"
            >
              <span>Following</span>
              <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={handleAction}
              className="flex-1 py-3 bg-primary text-white rounded-2xl font-medium text-base shadow-glow transition-colors"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              Message
            </motion.button>
          </div>
        ) : (
          <motion.button 
            whileTap={{ scale: 0.96 }}
            onClick={handleAction}
            className="px-4 py-2 bg-surface border border-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/5 transition-colors"
          >
            Message
          </motion.button>
        );
      case 'blocked':
        return (
          <motion.button 
            whileTap={{ scale: 0.96 }}
            onClick={async () => {
              if (loading) return;
              setLoading(true);
              try {
                const res = await friendService.unblockUser(targetUserId);
                if (res?.success) {
                  setStatus('none');
                  if (onStatusChange) onStatusChange('none');
                } else {
                  console.error(res?.error);
                }
              } catch (err) {
                console.error(err);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className={`bg-surface border border-white/10 app-text font-medium hover:bg-white/5 transition-all ${isFull ? 'w-full py-3 rounded-2xl text-base' : 'px-4 py-2 rounded-xl text-sm'}`}
          >
            {loading ? 'Processing...' : 'Unblock'}
          </motion.button>
        );
      case 'blocked_by':
        return (
          <button 
            disabled
            className={`bg-surface border border-white/10 text-muted font-medium ${isFull ? 'w-full py-3 rounded-2xl text-base' : 'px-4 py-2 rounded-xl text-sm'}`}
          >
            Unavailable
          </button>
        );
      default:
        console.warn("Unknown relationship status:", status);
        return (
          <motion.button 
            whileTap={{ scale: 0.96 }}
            onClick={handleAction} 
            disabled={loading}
            className={`bg-primary text-white font-medium shadow-glow transition-colors disabled:opacity-50 disabled:scale-100 ${isFull ? 'w-full py-3 rounded-2xl text-base' : 'px-4 py-2 rounded-xl text-sm'}`}
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            {loading ? 'Processing...' : 'Follow'}
          </motion.button>
        );
    }
  };

  return (
    <div onClick={handleContainerClick} className={isFull ? 'w-full mt-6' : ''}>
      {renderButton()}
    </div>
  );
};

export default FriendActionButton;
