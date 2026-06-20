import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, UserX } from 'lucide-react';
import { friendService } from '../services/friendService';
import { safeBack } from '../utils/navigation';
import { pageFade, listContainer, listItem } from '../lib/motionVariants';
import Avatar from '../components/Avatar';
import { ListSkeleton } from '../components/Skeletons';

export default function BlockedUsers() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unblockingId, setUnblockingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(null);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const users = await friendService.getBlockedUsers();
      setBlockedUsers(users);
    } catch (err) {
      console.error('Failed to load blocked users:', err);
      setError('Could not load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!showConfirmModal || unblockingId) return;
    const userToUnblock = showConfirmModal;
    setUnblockingId(userToUnblock.id);
    
    try {
      const res = await friendService.unblockUser(userToUnblock.id);
      if (res?.success) {
        setBlockedUsers(prev => prev.filter(u => u.id !== userToUnblock.id));
        // Add toast here if a global toast system exists
        console.log("User unblocked");
      }
    } catch (err) {
      console.error('Failed to unblock user:', err);
    } finally {
      setUnblockingId(null);
      setShowConfirmModal(null);
    }
  };

  if (loading) {
    return (
      <div className="app-page w-full flex flex-col h-screen overflow-hidden bg-background" style={{ backgroundColor: 'var(--theme-bg)' }}>
        <header className="p-4 flex items-center justify-between border-b app-border bg-surface z-10 sticky top-0">
          <div className="flex items-center space-x-3">
            <button onClick={() => safeBack(navigate, location, '/app/settings')} className="p-2 -ml-2 rounded-xl app-text hover:bg-white/5 active:bg-white/10 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold font-display app-text">Blocked users</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col p-6 w-full max-w-xl mx-auto">
          <ListSkeleton rows={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-page w-full flex flex-col h-screen overflow-hidden bg-background" style={{ backgroundColor: 'var(--theme-bg)' }}>
        <header className="p-4 flex items-center justify-between border-b app-border bg-surface z-10 sticky top-0">
          <div className="flex items-center space-x-3">
            <button onClick={() => safeBack(navigate, location, '/app/settings')} className="p-2 -ml-2 rounded-xl app-text hover:bg-white/5 active:bg-white/10 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold font-display app-text">Blocked users</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <UserX className="w-12 h-12 app-muted mb-4 opacity-50" />
          <h3 className="text-lg font-bold app-text mb-2">{error}</h3>
          <button onClick={fetchBlockedUsers} className="px-6 py-2 bg-surface border app-border app-text rounded-xl font-medium mt-4">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={pageFade}
      initial="hidden"
      animate="show"
      className="app-page w-full flex flex-col h-screen overflow-hidden bg-background relative" 
      style={{ backgroundColor: 'var(--theme-bg)' }}
    >
      <header className="p-4 flex items-center justify-between border-b app-border bg-surface z-10 sticky top-0">
        <div className="flex items-center space-x-3">
          <button onClick={() => safeBack(navigate, location, '/app/settings')} className="p-2 -ml-2 rounded-xl app-text hover:bg-white/5 active:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold font-display app-text">Blocked users</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full">
        {blockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
             <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-6">
               <UserX className="w-10 h-10 app-muted opacity-50" />
             </div>
             <h2 className="text-xl font-bold font-display app-text mb-2">No blocked accounts</h2>
             <p className="app-muted text-[15px]">People you block will appear here.</p>
          </div>
        ) : (
          <motion.div variants={listContainer} initial="hidden" animate="show" className="p-4 space-y-4 max-w-xl mx-auto">
            {blockedUsers.map((user) => (
              <motion.div variants={listItem} key={user.id} className="flex items-center justify-between">
                <div 
                  className="flex items-center flex-1 overflow-hidden cursor-pointer active:opacity-70 transition-opacity"
                  onClick={() => navigate(`/app/user/${user.id}`, { state: { from: location.pathname } })}
                >
                  <Avatar 
                    url={user.avatar_url}
                    name={user.full_name}
                    username={user.username}
                    className="w-14 h-14"
                  />
                  <div className="ml-4 flex-1 overflow-hidden pr-4">
                    <h3 className="app-text font-semibold text-[15px] truncate">{user.full_name || user.username}</h3>
                    {user.full_name && user.username && (
                      <p className="app-muted text-[13px] truncate">{user.username}</p>
                    )}
                  </div>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowConfirmModal(user)}
                  disabled={unblockingId === user.id}
                  className="px-5 py-2 rounded-xl text-sm font-medium transition-all bg-surface border border-white/10 app-text hover:bg-white/5 flex-shrink-0"
                >
                  {unblockingId === user.id ? 'Loading...' : 'Unblock'}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(null)}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="glass-panel p-6 rounded-3xl w-full max-w-sm relative z-10 border app-border shadow-2xl flex flex-col items-center"
            >
              <h3 className="text-xl font-bold app-text text-center mb-6 font-display">Unblock @{showConfirmModal.username}?</h3>
              
              <div className="flex w-full space-x-3">
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowConfirmModal(null)}
                  className="flex-1 py-3 app-surface border app-border rounded-xl app-text font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={handleUnblock}
                  className="flex-1 py-3 rounded-xl text-white font-medium transition-colors shadow-glow"
                  style={{ background: 'var(--theme-primary)' }}
                >
                  Unblock
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
