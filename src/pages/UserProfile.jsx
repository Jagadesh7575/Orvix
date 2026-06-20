import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MoreVertical, X, Info, UserX, ShieldAlert, BellOff, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { friendService } from '../services/friendService';
import { useLongPress } from '../hooks/useLongPress';
import { isUserActuallyOnline } from '../utils/presence';
import ProfilePhotoPreviewModal from '../components/ProfilePhotoPreviewModal';
import FriendActionButton from '../components/FriendActionButton';
import { safeBack } from '../utils/navigation';
import { pageFade, bottomSheet } from '../lib/motionVariants';
import Avatar from '../components/Avatar';
import { ProfileSkeleton } from '../components/Skeletons';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile: myProfile } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [relationshipStatus, setRelationshipStatus] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);  
  const [followingSheetOpen, setFollowingSheetOpen] = useState(false);
  const [optionsSheetOpen, setOptionsSheetOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null }); // type: 'unfollow' | 'block' | 'remove_follower'
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => {
    // If the userId is the current user, redirect to their own profile
    if (user && userId === user.id) {
      navigate('/app/profile', { replace: true });
      return;
    }

    const fetchUser = async () => {
      setLoading(true);
      setErrorState(null);
      try {
        if (!userId) throw new Error("Missing user id");
        const data = await friendService.getUserProfile(userId);
        if (!data) throw new Error("Profile not found");
        const status = await friendService.getRelationshipStatus(userId);
        setProfile(data);
        setRelationshipStatus(status || 'none');
      } catch (err) {
        console.error(err);
        setErrorState(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    } else {
      setErrorState("Missing user id");
      setLoading(false);
    }
  }, [userId, user, navigate]);

  useEffect(() => {
    // If the relationship changes to 'friends' while looking at the profile (e.g. they accepted us or we accepted them), refetch to get fresh counts
    const fetchFreshProfile = async () => {
      const data = await friendService.getUserProfile(userId);
      setProfile(data);
    };
    if (relationshipStatus === 'friends' && profile) {
      fetchFreshProfile();
    }
  }, [relationshipStatus, userId]);

  const onLongPress = () => setPreviewOpen(true);
  const onClick = () => {};
  const longPressProps = useLongPress({ onLongPress, onClick });

  if (loading) {
    return (
      <div className="min-h-full w-full pt-4">
        <ProfileSkeleton />
      </div>
    );
  }

  if (errorState || !profile) {
    return (
      <div className="min-h-full w-full flex flex-col items-center justify-center p-4 text-center bg-[var(--theme-bg)]">
        <h2 className="text-xl font-bold app-text mb-4">Could not load profile</h2>
        <div className="flex space-x-3">
          <button 
            onClick={() => {
              setLoading(true);
              setErrorState(null);
              friendService.getUserProfile(userId).then(data => {
                if (!data) throw new Error("Not found");
                setProfile(data);
                return friendService.getRelationshipStatus(userId);
              }).then(status => {
                setRelationshipStatus(status || 'none');
                setLoading(false);
              }).catch(err => {
                setErrorState(err.message);
                setLoading(false);
              });
            }} 
            className="px-6 py-2 bg-[var(--theme-primary)] text-white rounded-xl font-bold shadow-glow"
          >
            Retry
          </button>
          <button 
            onClick={() => safeBack(navigate, location, '/app/home')} 
            className="px-6 py-2 bg-surface border border-white/10 app-text rounded-xl font-bold"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const isFriends = relationshipStatus === 'friends';
  const isBlocked = relationshipStatus === 'blocked';
  const isBlockedBy = relationshipStatus === 'blocked_by';

  const handleActionConfirm = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      if (confirmModal.type === 'unfollow') {
        const res = await friendService.unfollowUser(profile.id);
        if (res?.error) throw new Error(res.error);
        showToast(`Unfollowed @${profile.username}`);
      } else if (confirmModal.type === 'block') {
        const res = await friendService.blockUser(profile.id);
        if (res?.error) throw new Error(res.error);
        showToast(`Blocked @${profile.username}`);
      } else if (confirmModal.type === 'remove_follower') {
        const res = await friendService.removeFollower(profile.id);
        if (res?.error) throw new Error(res.error);
        showToast(`Removed @${profile.username} from followers`);
      }
      
      // Refresh fresh profile counts and state from DB to avoid any desyncs
      const freshProfile = await friendService.getUserProfile(profile.id);
      if (freshProfile) setProfile(freshProfile);
      
      const newStatus = await friendService.getRelationshipStatus(profile.id);
      setRelationshipStatus(newStatus || 'none');
      
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Action failed. Try again.', 'error');
    } finally {
      setActionLoading(false);
      setConfirmModal({ isOpen: false, type: null });
      setFollowingSheetOpen(false);
      setOptionsSheetOpen(false);
    }
  };

  return (
    <motion.div 
      variants={pageFade}
      initial="hidden"
      animate="show"
      className="app-page w-full bg-[var(--theme-bg)] text-[var(--theme-text)] relative pb-[calc(env(safe-area-inset-bottom,20px)+80px)]"
    >
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-[var(--theme-bg)]/80 backdrop-blur-md border-b app-border px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] flex items-center justify-between">
        <button onClick={() => safeBack(navigate, location, '/app/home')} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-bold font-display tracking-tight flex-1 text-center">{profile?.username}</h1>
        <button onClick={() => setOptionsSheetOpen(true)} className="p-2 -mr-2 rounded-full hover:bg-white/5 transition-colors">
          <MoreVertical className="w-5 h-5 app-muted" />
        </button>
      </div>

      {/* Profile Header */}
      <div className="px-4 pt-4 pb-2 md:max-w-xl mx-auto">
        <div className="flex items-center space-x-6 mb-5">
          {/* Avatar Area */}
          <div className="relative flex-shrink-0">
            <div 
              {...longPressProps}
              className="w-[86px] h-[86px] rounded-full overflow-hidden shadow-[var(--theme-glow)] cursor-pointer select-none relative bg-surface flex items-center justify-center"
            >
              <Avatar 
                url={profile?.avatar_url}
                name={profile?.full_name}
                username={profile?.username}
                className="w-full h-full"
              />
            </div>
            {isUserActuallyOnline(profile) && (
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-[var(--theme-success)] border-[3px] border-[var(--theme-bg)] rounded-full shadow-sm"></div>
            )}
          </div>

          {/* Info and Stats Area */}
          <div className="flex flex-col flex-1 justify-center">
            <div className="mb-2.5">
              <h2 className="text-[15px] font-bold app-text leading-tight">{profile?.full_name || profile?.username}</h2>
            </div>
            
            <div className="flex items-center space-x-8">
              <div 
                className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform hover:opacity-80"
                onClick={() => navigate(`/app/user/${profile.id}/connections/followers`, { state: { from: location.pathname } })}
              >
                <span className="text-[16px] font-bold font-display app-text leading-tight">{profile?.followers_count || 0}</span>
                <span className="text-[13px] app-text leading-tight">followers</span>
              </div>
              <div 
                className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform hover:opacity-80"
                onClick={() => navigate(`/app/user/${profile?.id}/connections/following`, { state: { from: location.pathname } })}
              >
                <span className="text-[16px] font-bold font-display app-text leading-tight">{profile?.following_count || 0}</span>
                <span className="text-[13px] app-text leading-tight">following</span>
              </div>
            </div>
          </div>
        </div>

        {profile?.bio && (
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap app-text mb-4 px-1">{profile.bio}</p>
        )}

        <FriendActionButton 
          targetUserId={profile?.id} 
          initialStatus={relationshipStatus || 'none'} 
          onStatusChange={(newStatus) => setRelationshipStatus(newStatus || 'none')}
          onFollowingClick={() => setFollowingSheetOpen(true)}
          variant="fullProfile"
        />
      </div>

      {/* No Posts Area */}
      <div className="mt-4 md:max-w-xl mx-auto border-t app-border">
        {isFriends ? (
          <div className="p-8 text-center mt-4">
            <h3 className="text-lg font-bold app-text mb-1">No shared moments yet</h3>
            <p className="text-sm app-muted">When {profile?.full_name || profile?.username} shares chat moments, they will appear here.</p>
          </div>
        ) : isBlocked || isBlockedBy ? (
          <div className="p-8 text-center mt-4">
            <h3 className="text-lg font-bold app-text mb-1">User Not Found</h3>
          </div>
        ) : (
          <div className="p-8 text-center mt-4">
            <Lock className="w-12 h-12 app-muted opacity-30 mx-auto mb-3" />
            <h3 className="text-lg font-bold app-text mb-1">Private connection active</h3>
            <p className="text-sm app-muted">Follow {profile?.username} to connect.</p>
          </div>
        )}
      </div>

      <ProfilePhotoPreviewModal 
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        photoUrl={profile?.avatar_url}
        fallbackInitial={profile?.full_name?.charAt(0)?.toUpperCase() || profile?.username?.charAt(0)?.toUpperCase() || '?'}
      />

      {/* Following Bottom Sheet */}
      <AnimatePresence>
        {followingSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFollowingSheetOpen(false)}
              className="fixed inset-0 bg-black/60 z-[999] backdrop-blur-sm"
            />
            <motion.div
              variants={bottomSheet}
              initial="hidden"
              animate="show"
              exit="exit"
              className="fixed bottom-0 left-0 right-0 bg-[var(--theme-bg)] rounded-t-3xl z-[1000] p-6 pb-[calc(env(safe-area-inset-bottom,20px)+80px)] md:max-w-xl md:mx-auto border-t app-border shadow-2xl overflow-y-auto max-h-[75vh]"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 flex-shrink-0" />
              <h3 className="text-center font-bold text-lg mb-6 app-text">@{profile?.username}</h3>
              
              <div className="space-y-2">
                <button 
                  onClick={() => { setFollowingSheetOpen(false); showToast("Mute settings coming soon"); }}
                  className="w-full flex items-center p-4 rounded-2xl hover:bg-white/5 active:scale-95 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mr-4 flex-shrink-0">
                    <BellOff className="w-5 h-5 app-muted" />
                  </div>
                  <span className="font-bold text-[15px] app-text">Mute</span>
                </button>
                <button 
                  onClick={() => { setFollowingSheetOpen(false); setConfirmModal({ isOpen: true, type: 'unfollow' }); }}
                  className="w-full flex items-center p-4 rounded-2xl hover:bg-white/5 active:scale-95 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mr-4 flex-shrink-0">
                    <UserX className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="font-bold text-[15px] text-red-500">Unfollow</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Options Bottom Sheet */}
      <AnimatePresence>
        {optionsSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOptionsSheetOpen(false)}
              className="fixed inset-0 bg-black/60 z-[999] backdrop-blur-sm"
            />
            <motion.div
              variants={bottomSheet}
              initial="hidden"
              animate="show"
              exit="exit"
              className="fixed bottom-0 left-0 right-0 bg-[var(--theme-bg)] rounded-t-3xl z-[1000] p-6 pb-[calc(env(safe-area-inset-bottom,20px)+80px)] md:max-w-xl md:mx-auto border-t app-border shadow-2xl overflow-y-auto max-h-[75vh]"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 flex-shrink-0" />
              
              <div className="space-y-2">
                <button 
                  onClick={() => { setOptionsSheetOpen(false); setConfirmModal({ isOpen: true, type: 'block' }); }}
                  className="w-full flex items-center p-4 rounded-2xl hover:bg-white/5 active:scale-95 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mr-4 flex-shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="font-bold text-[15px] text-red-500">Block</span>
                </button>
                <button 
                  onClick={() => { setOptionsSheetOpen(false); setAboutModalOpen(true); }}
                  className="w-full flex items-center p-4 rounded-2xl hover:bg-white/5 active:scale-95 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mr-4 flex-shrink-0">
                    <Info className="w-5 h-5 app-text" />
                  </div>
                  <span className="font-bold text-[15px] app-text">About this account</span>
                </button>
                {isFriends && (
                  <button 
                    onClick={() => { setOptionsSheetOpen(false); setConfirmModal({ isOpen: true, type: 'remove_follower' }); }}
                    className="w-full flex items-center p-4 rounded-2xl hover:bg-white/5 active:scale-95 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mr-4 flex-shrink-0">
                      <UserX className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="font-bold text-[15px] text-orange-500">Remove follower</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirm Modals */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal({ isOpen: false, type: null })}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border app-border rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl text-center"
            >
              <h3 className="text-lg font-bold app-text mb-2 font-display">
                {confirmModal.type === 'unfollow' && `Unfollow @${profile?.username}?`}
                {confirmModal.type === 'block' && `Block @${profile?.username}?`}
                {confirmModal.type === 'remove_follower' && `Remove @${profile?.username} as follower?`}
              </h3>
              <p className="text-sm app-muted mb-6">
                {confirmModal.type === 'block' && "They won't be able to message you or view your profile."}
                {confirmModal.type === 'remove_follower' && "They won't be notified that they were removed."}
                {confirmModal.type === 'unfollow' && "Their moments won't show up in your feed."}
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={handleActionConfirm}
                  disabled={actionLoading}
                  className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : (confirmModal.type === 'unfollow' ? 'Unfollow' : confirmModal.type === 'block' ? 'Block' : 'Remove')}
                </button>
                <button 
                  onClick={() => setConfirmModal({ isOpen: false, type: null })}
                  disabled={actionLoading}
                  className="w-full py-3.5 bg-transparent border border-white/10 hover:bg-white/5 text-white rounded-2xl font-bold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* About This Account Modal */}
      <AnimatePresence>
        {aboutModalOpen && (
          <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAboutModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-surface border app-border rounded-3xl w-full max-w-sm relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b app-border flex justify-between items-center bg-black/20">
                <h3 className="font-bold text-lg font-display flex-1 text-center ml-8">About this account</h3>
                <button onClick={() => setAboutModalOpen(false)} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                  <X className="w-5 h-5 app-muted" />
                </button>
              </div>
              <div className="p-6">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-[var(--theme-bg)] border app-border flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold">{profile?.full_name?.charAt(0)?.toUpperCase() || profile?.username?.charAt(0)?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <h4 className="text-center font-bold text-[15px] app-text mb-6">@{profile?.username}</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <span className="text-sm font-medium app-muted">Date joined</span>
                    <span className="text-sm font-bold app-text">
                      {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <span className="text-sm font-medium app-muted">Username changes</span>
                    <span className="text-sm font-bold app-text">{profile?.username_change_count || 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom,20px)+90px)] left-4 right-4 md:max-w-md md:mx-auto z-[2000] flex justify-center"
          >
            <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-sm font-bold ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-surface border border-white/10 app-text'}`}>
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserProfile;
