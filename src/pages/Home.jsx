import React, { useState, useEffect } from 'react';
import { Search, Heart, UserPlus, Users, MessageSquare, Palette, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { isUserActuallyOnline } from '../utils/presence';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfilePhotoPreviewModal from '../components/ProfilePhotoPreviewModal';
import { useLongPress } from '../hooks/useLongPress';
import { useNotifications } from '../hooks/useNotifications';
import { useFriends } from '../hooks/useFriends';
import { getVisibleActivityItems } from '../utils/activityFilters';
import { chatService } from '../services/chatService';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Temporary feature flag, forcibly true for debugging Push Notifications on device
const SHOW_NOTIFICATION_DEBUG_PANEL = true;

// TEMP DEBUG PANEL - REMOVE BEFORE FINAL PRODUCTION APK
function NotificationDebugPanel() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [receiverId, setReceiverId] = useState('');
  const [status, setStatus] = useState({
    permission: 'unknown',
    token: 'missing',
    tokenFull: '',
    savedToDb: 'unknown'
  });

  const addDebugLog = (title, data) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${title}: ${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}`]);
  };

  const checkPermission = async () => {
    if (!Capacitor.isNativePlatform()) return addDebugLog("Check Permission", "Not a native platform");
    const permStatus = await PushNotifications.checkPermissions();
    setStatus(s => ({ ...s, permission: permStatus.receive }));
    addDebugLog("Permission Status", permStatus.receive);
  };

  const requestPermission = async () => {
    if (!Capacitor.isNativePlatform()) return addDebugLog("Request Permission", "Not native");
    const permStatus = await PushNotifications.requestPermissions();
    setStatus(s => ({ ...s, permission: permStatus.receive }));
    addDebugLog("Permission Requested", permStatus.receive);
  };

  const registerToken = async () => {
    if (!Capacitor.isNativePlatform()) return addDebugLog("Register FCM", "Not native");
    PushNotifications.removeAllListeners();
    PushNotifications.addListener('registration', (token) => {
      setStatus(s => ({ ...s, token: 'available', tokenFull: token.value }));
      addDebugLog("FCM Registration Success", `${token.value.substring(0,8)}...${token.value.substring(token.value.length-6)}`);
    });
    PushNotifications.addListener('registrationError', (error) => {
      addDebugLog("FCM Registration Error", error);
    });
    addDebugLog("Registering FCM...", "");
    await PushNotifications.register();
  };

  const saveTokenToDb = async () => {
    if (!status.tokenFull) return addDebugLog("Save Token", "No token available to save");
    const { error } = await supabase.from('device_tokens').upsert({
      user_id: user.id,
      token: status.tokenFull,
      platform: 'android',
      device_id: 'default',
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,platform,device_id' });

    if (error) {
      addDebugLog("Save Token Error", error);
      setStatus(s => ({ ...s, savedToDb: 'no' }));
    } else {
      addDebugLog("Save Token Success", "Upserted to device_tokens");
      setStatus(s => ({ ...s, savedToDb: 'yes' }));
    }
  };

  const checkMyTokenDb = async () => {
    const { data, error } = await supabase.from('device_tokens').select('*').eq('user_id', user.id);
    if (error) {
      addDebugLog("Check DB Token Error", error);
    } else {
      addDebugLog("Check DB Token Success", {
        token_found: data.length > 0,
        token_count: data.length,
        records: data.map(d => ({
          platform: d.platform,
          device_id: d.device_id,
          updated_at: d.updated_at,
          token_preview: `${d.token.substring(0,8)}...${d.token.substring(d.token.length-6)}`
        }))
      });
    }
  };

  const createChannel = async () => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return addDebugLog("Channel Check", "Not native Android");
    try {
      await PushNotifications.createChannel({
        id: "orvix_messages",
        name: "Orvix Messages",
        description: "Message notifications",
        importance: 5,
        visibility: 1,
        sound: "default",
        vibration: true
      });
      addDebugLog("Create Channel", "orvix_messages channel created (importance: HIGH)");
    } catch (e) {
      addDebugLog("Create Channel Error", e.message);
    }
  };

  const testForegroundBanner = () => {
    window.dispatchEvent(new CustomEvent('in-app-notification', {
      detail: {
        title: "Foreground Banner Test",
        body: "This is a custom React in-app notification banner.",
        data: { chat_id: "test", type: "message" }
      }
    }));
    addDebugLog("Foreground Banner Test", "Dispatched in-app-notification event");
  };

  const testSelfNotification = async () => {
    addDebugLog("Test Self Notification", "Calling Edge Function...");
    const { data, error } = await supabase.functions.invoke('send-message-notification', {
      body: { debug: true, mode: 'self-test', title: 'Orvix Self Test', body: 'This is a test notification.', sender_id: user.id, receiver_id: user.id, chat_id: 'test-chat', message_id: 'test-msg' }
    });

    if (error) {
      try {
        if (error.context) {
          const text = await error.context.text();
          let parsed;
          try { parsed = JSON.parse(text); } catch { parsed = text; }
          addDebugLog("Edge Function Error Body", parsed);
        } else {
          addDebugLog("Edge Function Error", error.message);
        }
      } catch (e) {
        addDebugLog("Edge Function Error Parse Failed", e.message);
      }
    } else {
      addDebugLog("Edge Function Success", data);
    }
  };

  const testReceiverNotification = async () => {
    if (!receiverId) return addDebugLog("Receiver Test", "Please input receiver ID");
    addDebugLog("Test Receiver Notification", `Calling Edge Function for ${receiverId}...`);
    const { data, error } = await supabase.functions.invoke('send-message-notification', {
      body: { debug: true, mode: 'receiver-test', title: 'Orvix Receiver Test', body: 'Test from another user.', sender_id: user.id, receiver_id: receiverId, chat_id: 'test-chat-receiver', message_id: 'test-msg-receiver' }
    });

    if (error) {
      try {
        if (error.context) {
          const text = await error.context.text();
          let parsed;
          try { parsed = JSON.parse(text); } catch { parsed = text; }
          addDebugLog("Edge Function Error Body", parsed);
        } else {
          addDebugLog("Edge Function Error", error.message);
        }
      } catch (e) {
        addDebugLog("Edge Function Error Parse Failed", e.message);
      }
    } else {
      addDebugLog("Edge Function Success", data);
    }
  };

  return (
    <div className="p-4 mb-6 rounded-2xl border-2 border-orange-500 bg-orange-500/10 text-xs w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-orange-500 uppercase tracking-widest">Notification Debug Panel</h3>
        <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">TEMP FIX</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button onClick={checkPermission} className="p-2 bg-white/10 rounded font-semibold hover:bg-white/20 active:scale-95 transition-all text-white">1. Check Perm</button>
        <button onClick={requestPermission} className="p-2 bg-white/10 rounded font-semibold hover:bg-white/20 active:scale-95 transition-all text-white">2. Request Perm</button>
        <button onClick={registerToken} className="p-2 bg-white/10 rounded font-semibold hover:bg-white/20 active:scale-95 transition-all text-white">3. Register FCM</button>
        <button onClick={saveTokenToDb} className="p-2 bg-white/10 rounded font-semibold hover:bg-white/20 active:scale-95 transition-all text-white">4. Save to DB</button>
        <button onClick={checkMyTokenDb} className="col-span-2 p-2 bg-white/10 rounded font-semibold hover:bg-white/20 active:scale-95 transition-all text-white">5. Check My Token in DB</button>
        <button onClick={createChannel} className="p-2 bg-purple-500/80 rounded font-semibold hover:bg-purple-500 active:scale-95 transition-all text-white">Create Channel</button>
        <button onClick={testForegroundBanner} className="p-2 bg-purple-500/80 rounded font-semibold hover:bg-purple-500 active:scale-95 transition-all text-white">Test FG Banner</button>
        <button onClick={testSelfNotification} className="col-span-2 p-3 bg-primary text-white rounded font-bold hover:bg-primary/80 active:scale-95 transition-all shadow-glow">6. Test Self Notification</button>
      </div>

      <div className="flex space-x-2 mb-4">
        <input type="text" value={receiverId} onChange={e => setReceiverId(e.target.value)} placeholder="Receiver ID" className="flex-1 bg-black/40 rounded px-3 py-2 text-white border border-white/10" />
        <button onClick={testReceiverNotification} className="p-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 active:scale-95 transition-all whitespace-nowrap">7. Test Receiver</button>
      </div>

      <div className="flex justify-between items-center mb-2">
        <span className="text-white/50 font-bold uppercase tracking-widest text-[10px]">Logs</span>
        <button onClick={() => setLogs([])} className="text-[10px] px-2 py-1 bg-white/10 rounded hover:bg-white/20 text-white">Clear</button>
      </div>
      <div className="bg-black/80 p-3 rounded font-mono h-64 overflow-y-auto space-y-2 text-[10px] break-words text-green-400">
        {logs.map((l, i) => <div key={i} className="border-b border-white/10 pb-2 last:border-0">{l}</div>)}
        {logs.length === 0 && <div className="opacity-50 text-white/50">Waiting for action...</div>}
      </div>
    </div>
  );
}
function getUnreadPreviewText(unreadCount) {
  if (!unreadCount || unreadCount <= 0) return null;
  if (unreadCount >= 4) return "4+ new messages";
  if (unreadCount === 1) return "1 new message";
  return `${unreadCount} new messages`;
}

const Home = React.memo(function Home() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications } = useNotifications();
  const { incomingRequests, sentRequests } = useFriends();
  
  const { unreadVisibleCount } = getVisibleActivityItems(notifications || [], incomingRequests || [], sentRequests || []);
  
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState({ isOpen: false, imageUrl: '', fullName: '', username: '', isOnline: false });

  const currentUserLongPress = useLongPress({
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
    onClick: () => navigate('/app/profile')
  });

  useEffect(() => {
    if (!user) return;
    fetchChats();
  }, [user]);

  const fetchChats = async () => {
    try {
      const data = await chatService.getHomeRecentChats(user.id);
      const uniqueHomeRecentChats = Array.from(
        new Map(data.map(chat => [chat.id, chat])).values()
      );
      // Keep only top 2 for Home
      const top2 = uniqueHomeRecentChats.slice(0, 2);
      
      const formattedChats = top2.map(chat => ({
        id: chat.id,
        type: 'private',
        otherMember: chat.friend,
        lastMessageText: chat.last_message ? chat.last_message.content : 'Tap to chat...',
        isMine: chat.last_message?.sender_id === user?.id,
        lastMessageId: chat.last_message?.id,
        timestamp: chat.last_message ? new Date(chat.last_message.created_at) : new Date(chat.updated_at),
        unreadCount: chat.unreadCount || 0
      }));

      setChats(formattedChats);
    } catch (err) {
      console.error('Error fetching chats', err);
    } finally {
      setLoading(false);
    }
  };

  const username = profile?.username || "orvix_user";
  const bio = profile?.bio || "Private conversations. Premium vibes.";



  return (
    <div className="app-page w-full p-4 md:max-w-xl mx-auto relative z-10">
      
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center mb-6"
      >
        <div className="flex items-center space-x-3">
          <button {...currentUserLongPress} className="w-10 h-10 rounded-full app-surface border app-border flex items-center justify-center overflow-hidden hover:scale-105 transition-transform shadow-[var(--theme-glow)] select-none">
            {profile?.avatar_url ? (
               <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover pointer-events-none" />
            ) : (
               <span className="app-text font-bold pointer-events-none">{username.charAt(0).toUpperCase()}</span>
            )}
          </button>
          <div>
            <h1 className="text-xl font-bold font-display app-text tracking-tight">Orvix</h1>
            <p className="text-xs flex items-center space-x-1" style={{ color: 'var(--theme-primary)' }}>
              <span className="w-1.5 h-1.5 rounded-full shadow-[var(--theme-glow)] animate-pulse" style={{ background: 'var(--theme-primary)' }} />
              <span>Online</span>
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/app/activity')} className="relative p-2 rounded-full app-surface border app-border text-[var(--theme-text)] hover:text-[var(--theme-primary)] transition-colors shadow-sm">
          <Heart className="w-5 h-5" />
          {unreadVisibleCount > 0 && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--theme-primary)' }}></span>
              <span className="relative inline-flex rounded-full h-4 w-4 flex items-center justify-center text-[9px] font-bold text-white shadow-sm" style={{ backgroundColor: 'var(--theme-primary)' }}>
                {unreadVisibleCount > 9 ? '9+' : unreadVisibleCount}
              </span>
            </span>
          )}
        </button>
      </motion.div>

      {/* Profile Summary Card (Username ONLY) */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-5 rounded-3xl mb-6 relative overflow-hidden group border app-border shadow-md"
      >
        <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: 'linear-gradient(to bottom right, var(--theme-primary), transparent)' }} />
        <div className="relative z-10 flex items-center space-x-4">
          <div {...currentUserLongPress} className="w-16 h-16 rounded-full border flex items-center justify-center overflow-hidden flex-shrink-0 shadow-[var(--theme-glow)] cursor-pointer select-none" style={{ background: 'var(--theme-bg-soft)', borderColor: 'var(--theme-primary)' }}>
            {profile?.avatar_url ? (
               <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover pointer-events-none" />
            ) : (
               <span className="text-xl font-bold app-text pointer-events-none">{username.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-lg font-bold app-text truncate font-display">@{username}</h2>
            <p className="text-xs app-text opacity-80 mt-1 truncate">{bio}</p>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="relative z-10 flex items-center justify-between mt-5 pt-4 border-t app-border">
           <div 
             className="text-center cursor-pointer active:scale-95 transition-transform hover:opacity-80"
             onClick={() => navigate(`/app/user/${profile?.id}/connections/followers`, { state: { from: location.pathname } })}
           >
             <div className="text-sm font-bold app-text">{profile?.followers_count || 0}</div>
             <div className="text-[10px] app-muted uppercase tracking-wider font-semibold">Followers</div>
           </div>
           <div 
             className="text-center cursor-pointer active:scale-95 transition-transform hover:opacity-80"
             onClick={() => navigate(`/app/user/${profile?.id}/connections/following`, { state: { from: location.pathname } })}
           >
             <div className="text-sm font-bold app-text">{profile?.following_count || 0}</div>
             <div className="text-[10px] app-muted uppercase tracking-wider font-semibold">Following</div>
           </div>
           <div className="text-center cursor-pointer active:scale-95 transition-transform hover:opacity-80" onClick={() => navigate('/app/chats')}>
             <div className="text-sm font-bold app-text">{chats.length}</div>
             <div className="text-[10px] app-muted uppercase tracking-wider font-semibold">Chats</div>
           </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-4 gap-3 mb-6"
      >
        <ActionBtn icon={Search} label="Discover" onClick={() => navigate('/app/discover')} />
        <ActionBtn icon={UserPlus} label="Requests" onClick={() => navigate('/app/activity')} />
        <ActionBtn icon={MessageSquare} label="New Chat" onClick={() => navigate('/app/chats')} />
        <ActionBtn icon={Palette} label="Themes" onClick={() => navigate('/app/themes')} />
      </motion.div>

      {/* Activity Preview */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-4 rounded-2xl mb-6 border app-border flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate('/app/activity')}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary" style={{ color: 'var(--theme-primary)', backgroundColor: 'var(--theme-bg-soft)' }}>
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold app-text">Recent Activity</h4>
            <p className="text-xs app-muted">{unreadVisibleCount > 0 ? `You have ${unreadVisibleCount} unread activities` : 'No new activity'}</p>
          </div>
        </div>
        <div className="text-xs font-semibold px-2 py-1 rounded-full bg-surface app-border border app-text" style={unreadVisibleCount > 0 ? { color: 'white', backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } : {}}>
          {unreadVisibleCount} New
        </div>
      </motion.div>

      {/* Notification Debug Panel */}
      {SHOW_NOTIFICATION_DEBUG_PANEL && <NotificationDebugPanel />}

      {/* Recent Chats Section */}
      <div className="animate-fade-in-up">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-sm font-bold app-muted uppercase tracking-widest flex items-center">
            <Heart className="w-4 h-4 mr-2" /> Recent Chats
          </h3>
          <button onClick={() => navigate('/app/chats')} className="text-xs text-primary font-medium hover:underline">View All</button>
        </div>
        
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 rounded-2xl text-center app-muted text-sm border border-dashed app-border">
              No recent conversations yet
            </div>
          ) : (
            <div className="space-y-2">
              {chats.map((chat, i) => {
                const unreadPreview = getUnreadPreviewText(chat.unreadCount);
                const timeText = chat.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                let latestMessageText;
                if (chat.isMine) {
                  latestMessageText = 'Sent';
                } else {
                  latestMessageText = chat.lastMessageText;
                }

                return (
                <button 
                  key={chat.id}
                  onClick={() => {
                    if (chat.lastMessageId) {
                      chatService.markChatReadLocally(user.id, chat.id, chat.lastMessageId);
                    }
                    setChats(prev => prev.filter(c => c.id !== chat.id));
                    navigate(`/app/chat/${chat.id}`, { state: { scrollToBottom: true, from: 'home_recent_chats', returnTo: '/app/home', otherUser: chat.otherMember || chat.friend || chat.user } });
                  }}
                  className="w-full glass-panel p-3 rounded-2xl flex items-center space-x-3 hover:bg-white/5 active:scale-[0.98] transition-all border border-transparent hover:border-[var(--theme-card-border)] group"
                >
                  <div className="w-12 h-12 rounded-full app-surface border app-border flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                    {chat.otherMember?.avatar_url ? (
                      <img src={chat.otherMember.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="app-text font-bold">{chat.otherMember?.full_name?.charAt(0) || chat.otherMember?.username?.charAt(0) || '?'}</span>
                    )}
                    {isUserActuallyOnline(chat.otherMember) && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[var(--theme-surface)] shadow-sm" style={{ background: 'var(--theme-success)' }} />
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold text-[15px] truncate font-display ${chat.unreadCount > 0 ? 'app-text' : 'app-text opacity-90'}`}>{chat.otherMember?.full_name || chat.otherMember?.username || 'Unknown User'}</h4>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className={`text-[13px] truncate transition-colors flex-1 pr-2 ${chat.unreadCount > 0 ? 'text-[var(--theme-text)] font-semibold' : 'app-muted group-hover:text-[var(--theme-text)]'}`}>
                        {chat.unreadCount > 0 
                          ? `${unreadPreview} · ${timeText}`
                          : `${latestMessageText} · ${timeText}`}
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="w-[9px] h-[9px] rounded-full flex-shrink-0 ml-2" style={{ background: 'var(--theme-primary)', boxShadow: '0 0 10px var(--theme-glow)' }} />
                      )}
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
});

const ActionBtn = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center space-y-2 p-3 glass-panel rounded-2xl border app-border hover:border-primary active:scale-95 transition-all group">
    <Icon className="w-5 h-5 app-muted group-hover:text-primary transition-colors" />
    <span className="text-[10px] font-semibold app-text">{label}</span>
  </button>
);

export default Home;
