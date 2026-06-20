import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { User, Settings as SettingsIcon, Edit3, Camera, Check, X, Shield, Calendar, Activity, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNativeTheme } from '../theme/NativeThemeContext';
import { uploadAvatar } from '../utils/uploadAvatar';
import ProfilePhotoPreviewModal from '../components/ProfilePhotoPreviewModal';
import { useLongPress } from '../hooks/useLongPress';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Profile() {
  const { user, profile, setProfile } = useAuth();
  const { theme, themes } = useNativeTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorToast, setErrorToast] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [previewData, setPreviewData] = useState({ isOpen: false, imageUrl: '', fullName: '', username: '', isOnline: false });
  
  const avatarLongPress = useLongPress({
    onLongPress: () => {
      setPreviewData({
        isOpen: true,
        imageUrl: profile?.avatar_url,
        fullName: profile?.full_name,
        username: profile?.username || 'orvix_user',
        isOnline: true
      });
    },
    onLongPressEnd: () => setPreviewData(prev => ({ ...prev, isOpen: false })),
    disabled: isEditing
  });
  
  const [editForm, setEditForm] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    avatar_file: null,
    avatar_preview: profile?.avatar_url || ''
  });
  
  const currentThemeObj = theme || themes[0];
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Orvix User';
  const displayUsername = profile?.username || 'orvix_user';
  const displayBio = profile?.bio || 'Hey there! I am using Orvix.';

  const handleSave = async () => {
    setLoading(true);
    setErrorToast('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorToast('Please login again to update your profile photo.');
        setLoading(false);
        setTimeout(() => setErrorToast(''), 3000);
        return;
      }

      // Check username if changed
      if (editForm.username !== profile?.username) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', editForm.username)
          .maybeSingle();
          
        if (existing) {
          setErrorToast('Username already taken. Choose another.');
          setLoading(false);
          setTimeout(() => setErrorToast(''), 3000);
          return;
        }
      }

      // Upload Avatar if changed
      let finalAvatarUrl = editForm.avatar_url;
      if (editForm.avatar_file) {
        setLoading(true);
        try {
          finalAvatarUrl = await uploadAvatar(editForm.avatar_file, user.id);
        } catch (uploadErr) {
          console.error("Avatar upload failed:", uploadErr);
          setErrorToast('Could not upload photo. Please try again.');
          setLoading(false);
          setTimeout(() => setErrorToast(''), 3000);
          return;
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          username: editForm.username,
          bio: editForm.bio,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        if (updateError.code === '23505') {
           throw new Error('Username already taken. Choose another.');
        }
        console.error("Avatar profile update failed:", updateError);
        throw updateError;
      }
      
      if (setProfile) {
        setProfile(prev => ({
          ...prev,
          full_name: editForm.full_name,
          username: editForm.username,
          bio: editForm.bio,
          avatar_url: finalAvatarUrl
        }));
      }

      setSuccessToast('Profile photo updated.');
      setTimeout(() => {
        setSuccessToast('');
        setIsEditing(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorToast(err.message || 'Failed to update profile');
      setTimeout(() => setErrorToast(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (editForm.avatar_preview && editForm.avatar_preview !== profile?.avatar_url) {
      URL.revokeObjectURL(editForm.avatar_preview);
    }
    setEditForm({
      full_name: profile?.full_name || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
      avatar_url: profile?.avatar_url || '',
      avatar_file: null,
      avatar_preview: profile?.avatar_url || ''
    });
    setIsEditing(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setEditForm({ ...editForm, avatar_file: file, avatar_preview: previewUrl });
    }
  };

  return (
    <div className="app-page w-full p-4 md:max-w-xl mx-auto flex flex-col space-y-6">
      {/* Toasts */}
      <AnimatePresence>
        {errorToast && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-4 left-4 right-4 z-50 glass-panel border border-red-500/50 text-red-100 p-4 rounded-2xl shadow-2xl text-sm font-medium text-center" style={{ background: 'var(--theme-danger)' }}>
            {errorToast}
          </motion.div>
        )}
        {successToast && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-4 left-4 right-4 z-50 glass-panel border border-green-500/50 text-green-100 p-4 rounded-2xl shadow-2xl text-sm font-medium text-center flex justify-center items-center space-x-2" style={{ background: 'var(--theme-success)' }}>
            <Check className="w-4 h-4" /> <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-4"
      >
        <h1 className="text-2xl font-bold font-display text-white">Profile</h1>
        {!isEditing && (
          <button 
            onClick={() => navigate('/app/settings')}
            className="w-10 h-10 rounded-full bg-surface border app-border text-[var(--theme-text)] flex items-center justify-center hover:bg-white/10 transition-colors shadow-sm"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full flex flex-col space-y-6"
          >
            {/* Main Profile Card */}
            <div className="glass-panel p-6 rounded-[2rem] border app-border relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary-gradient opacity-10 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative">
                  <div {...avatarLongPress} className="w-24 h-24 rounded-full app-surface border-4 border-[var(--theme-bg)] flex items-center justify-center overflow-hidden shadow-[var(--theme-glow)] mb-4 cursor-pointer select-none">
                    {profile?.avatar_url ? (
                       <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center theme-gradient-btn text-3xl font-bold text-white shadow-[var(--theme-glow)] pointer-events-none">
                         {displayName.charAt(0).toUpperCase()}
                       </div>
                    )}
                  </div>
                  <div className="absolute bottom-4 right-0 w-5 h-5 rounded-full border-4 shadow-sm pointer-events-none" style={{ background: 'var(--theme-success)', borderColor: 'var(--theme-bg)' }} />
                </div>
                
                <h2 className="text-2xl font-bold text-white font-display mb-1">{displayName}</h2>
                <p className="text-sm font-medium mb-4" style={{ color: 'var(--theme-primary)' }}>@{displayUsername}</p>
                <p className="text-sm leading-relaxed mb-6 max-w-xs app-text">{displayBio}</p>
                
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3 rounded-xl bg-white/5 border app-border text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
               <div 
                 className="glass-panel p-4 rounded-2xl flex items-center space-x-4 border app-border cursor-pointer active:scale-95 transition-transform hover:opacity-80"
                 onClick={() => navigate(`/app/user/${profile?.id}/connections/followers`, { state: { from: location.pathname } })}
               >
                 <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--theme-bg-soft)' }}>
                   <Users className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                 </div>
                 <div>
                   <div className="text-xl font-bold app-text">{profile?.followers_count || 0}</div>
                   <div className="text-xs app-muted uppercase tracking-wider">Followers</div>
                 </div>
               </div>
               <div 
                 className="glass-panel p-4 rounded-2xl flex items-center space-x-4 border app-border cursor-pointer active:scale-95 transition-transform hover:opacity-80"
                 onClick={() => navigate(`/app/user/${profile?.id}/connections/following`, { state: { from: location.pathname } })}
               >
                 <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--theme-bg-soft)' }}>
                   <Activity className="w-5 h-5" style={{ color: 'var(--theme-secondary)' }} />
                 </div>
                 <div>
                   <div className="text-xl font-bold app-text">{profile?.following_count || 0}</div>
                   <div className="text-xs app-muted uppercase tracking-wider">Following</div>
                 </div>
               </div>
            </div>

            {/* Info Cards */}
            <div className="glass-panel rounded-2xl border app-border overflow-hidden">
               <div className="p-4 border-b app-border flex items-center justify-between">
                 <div className="flex items-center space-x-3 app-muted">
                   <Shield className="w-5 h-5" />
                   <span className="text-sm font-medium">Account Status</span>
                 </div>
                 <span className="text-sm font-medium" style={{ color: 'var(--theme-success)' }}>Verified</span>
               </div>
               <div className="p-4 border-b app-border flex items-center justify-between">
                 <div className="flex items-center space-x-3 app-muted">
                   <Calendar className="w-5 h-5" />
                   <span className="text-sm font-medium">Joined Orvix</span>
                 </div>
                 <span className="text-sm app-text">
                   {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Recently'}
                 </span>
               </div>
               <div className="p-4 flex items-center justify-between">
                 <div className="flex items-center space-x-3 app-muted">
                   <div className="w-5 h-5 rounded-full theme-gradient-btn shadow-[var(--theme-glow)]" />
                   <span className="text-sm font-medium">Active Theme</span>
                 </div>
                 <span className="text-sm font-medium" style={{ color: 'var(--theme-primary)' }}>{currentThemeObj.name}</span>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full glass-panel p-6 rounded-[2rem] border app-border"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white font-display">Edit Profile</h3>
              <button onClick={handleCancel} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                 <div className="relative w-24 h-24">
                   <label htmlFor="avatar-upload" className="cursor-pointer group">
                     <div className="w-full h-full rounded-full app-surface border-2 border-[var(--theme-primary)] overflow-hidden flex items-center justify-center relative">
                       {editForm.avatar_preview ? (
                          <img src={editForm.avatar_preview} alt="Avatar" className="w-full h-full object-cover" />
                       ) : (
                          <Camera className="w-8 h-8 app-muted" />
                       )}
                       <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera className="w-6 h-6 text-white" />
                       </div>
                     </div>
                   </label>
                   <input
                     id="avatar-upload"
                     type="file"
                     accept="image/png,image/jpeg,image/webp"
                     className="hidden"
                     onChange={handleFileChange}
                   />
                 </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editForm.full_name} 
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  className="w-full bg-surface border app-border rounded-xl px-4 py-3 app-text focus:outline-none focus:border-primary transition-colors"
                  placeholder="Orvix User"
                />
              </div>

              <div>
                <label className="block text-xs font-medium app-muted uppercase tracking-wider mb-1">Username</label>
                <input 
                  type="text" 
                  value={editForm.username} 
                  onChange={(e) => setEditForm({...editForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                  className="w-full theme-input rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--theme-primary)] transition-colors"
                  placeholder="orvix_user"
                />
              </div>

              <div>
                <label className="block text-xs font-medium app-muted uppercase tracking-wider mb-1">Bio</label>
                <textarea 
                  value={editForm.bio} 
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="w-full theme-input rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--theme-primary)] transition-colors h-24 resize-none"
                  placeholder="Private conversations. Premium vibes."
                />
              </div>

              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 py-3.5 app-surface border app-border text-white rounded-xl font-medium flex items-center justify-center disabled:opacity-50 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-3.5 theme-gradient-btn text-white rounded-xl font-medium shadow-[var(--theme-glow)] flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {loading ? 'Uploading...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProfilePhotoPreviewModal
        isOpen={previewData.isOpen}
        onClose={() => setPreviewData(prev => ({ ...prev, isOpen: false }))}
        imageUrl={previewData.imageUrl}
        fullName={previewData.fullName}
        username={previewData.username}
        isOnline={previewData.isOnline}
      />
    </div>
  );
}
