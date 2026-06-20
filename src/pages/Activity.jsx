import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Bell, UserPlus, X, Check, MessageSquare } from 'lucide-react';
import { useFriends } from '../hooks/useFriends';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
import { pageFade, listContainer, listItem } from '../lib/motionVariants';
import Avatar from '../components/Avatar';
import { ListSkeleton } from '../components/Skeletons';
import { getVisibleActivityItems } from '../utils/activityFilters';

const Activity = React.memo(function Activity() {
  const { incomingRequests, sentRequests, acceptRequest, declineRequest, loading: friendsLoading } = useFriends();
  const { notifications, unreadCount, markAsRead, loading: notifsLoading } = useNotifications();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { visibleNotifications, debugMetrics } = getVisibleActivityItems(notifications, incomingRequests, sentRequests);

  useEffect(() => {
    // Mark as read when activity page is opened
    if (unreadCount > 0) {
      markAsRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadCount]);

  const isLoading = friendsLoading || notifsLoading;

  return (
    <motion.div 
      variants={pageFade}
      initial="hidden"
      animate="show"
      className="app-page w-full p-4 md:max-w-xl mx-auto relative z-10 pb-[calc(env(safe-area-inset-bottom,20px)+80px)]"
    >
      <motion.div 
        variants={listItem}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold font-display app-text tracking-tight flex items-center space-x-2">
          <Heart className="w-6 h-6 text-[var(--theme-primary)]" />
          <span>Activity</span>
        </h1>
        <p className="text-sm app-muted mt-1">Notifications and friend requests.</p>
      </motion.div>

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : (
        <div className="space-y-8">
          
          {/* Incoming Requests Section */}
          {incomingRequests.length > 0 && (
            <section>
              <h2 className="text-sm font-bold app-muted uppercase tracking-widest mb-4 px-2">Friend Requests</h2>
                <div className="space-y-3 animate-fade-in-up">
                  {incomingRequests.map((req) => (
                    <div 
                      key={req.id}
                      className="glass-panel p-4 rounded-2xl border app-border flex items-center justify-between transition-all"
                    >
                      <div 
                        className="flex items-center space-x-3 overflow-hidden flex-1 cursor-pointer"
                        onClick={() => navigate(`/app/user/${req.sender_id || req.profiles?.id}`)}
                      >
                        <Avatar 
                          url={req.profiles?.avatar_url}
                          name={req.profiles?.full_name}
                          username={req.profiles?.username}
                          className="w-12 h-12"
                        />
                        <div className="truncate">
                          <h3 className="text-sm font-bold app-text truncate">{req.profiles?.full_name || req.profiles?.username}</h3>
                          <p className="text-xs app-muted truncate">@{req.profiles?.username}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0 ml-2 mt-2 sm:mt-0">
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                               await acceptRequest(req.id);
                            } catch(err) {
                               console.error('Confirm error:', err);
                            }
                          }}
                          className="px-4 py-1.5 rounded-xl bg-[var(--theme-primary)] text-white text-sm font-bold shadow-[var(--theme-glow)] transition-colors"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                               await declineRequest(req.id);
                            } catch(err) {
                               console.error('Delete error:', err);
                            }
                          }}
                          className="px-4 py-1.5 rounded-xl bg-surface border border-white/10 text-white text-sm font-semibold hover:bg-white/5 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            </section>
          )}

          {/* Notifications Section */}
          <section>
            <h2 className="text-sm font-bold app-muted uppercase tracking-widest mb-4 px-2">Recent Notifications</h2>
            {visibleNotifications.length === 0 ? (
              <div className="glass-panel p-8 rounded-3xl text-center border app-border mt-2">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--theme-bg-soft)', color: 'var(--theme-primary)' }}>
                  <Bell className="w-8 h-8 opacity-50" />
                </div>
                <h2 className="text-lg font-bold app-text mb-2">No activity yet</h2>
                <p className="text-sm app-muted">When you get friend requests or new notifications, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in-up">
                  {visibleNotifications.map((notif) => {
                    let Icon = Bell;
                    let iconColor = 'var(--theme-text)';
                    
                    if (notif.type === 'friend_request_accepted' || notif.type === 'follow_request_accepted') {
                      Icon = UserPlus;
                      iconColor = 'var(--theme-success)';
                    } else if (notif.type === 'chat_unlocked') {
                      Icon = MessageSquare;
                      iconColor = 'var(--theme-secondary)';
                    } else {
                      Icon = Bell;
                      iconColor = 'var(--theme-text)';
                    }

                    return (
                      <div 
                        key={notif.id}
                        className={`glass-panel p-4 rounded-2xl border app-border flex items-start space-x-4 transition-all ${!notif.is_read ? 'bg-white/5' : ''} ${notif.actor_id ? 'cursor-pointer hover:bg-white/5 active:scale-[0.98]' : ''}`}
                        onClick={(e) => {
                          if (notif.type === 'new_message' && notif.related_chat_id) {
                            navigate(`/app/chat/${notif.related_chat_id}`);
                            return;
                          }

                          const targetUserId =
                            notif.related_user_id ||
                            notif.sender_id ||
                            notif.actor_id ||
                            notif.from_user_id;

                          let finalTargetId = targetUserId;
                          
                          if (finalTargetId === currentUser?.id) {
                            console.warn("ACTIVITY_NOTIFICATION_TARGET_IS_SELF", notif);
                            if (notif.receiver_id && notif.receiver_id !== currentUser?.id) {
                               finalTargetId = notif.receiver_id;
                            } else {
                               return;
                            }
                          }

                          if (!finalTargetId) {
                            console.warn("ACTIVITY_NOTIFICATION_NO_TARGET_USER", notif);
                            return;
                          }

                          console.log("ACTIVITY_NOTIFICATION_TAP", {
                            notificationId: notif.id,
                            type: notif.type,
                            currentUserId: currentUser?.id,
                            senderId: notif.sender_id,
                            receiverId: notif.receiver_id,
                            relatedUserId: notif.related_user_id,
                            resolvedTargetUserId: finalTargetId,
                            routeUsed: `/app/user/${finalTargetId}`
                          });

                          navigate(`/app/user/${finalTargetId}`);
                        }}
                      >
                        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-1" style={{ background: 'var(--theme-bg-soft)', color: iconColor }}>
                          {notif.profiles?.avatar_url ? (
                            <img src={notif.profiles.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold app-text">{notif.title}</h4>
                          <p className="text-xs app-muted mt-0.5 leading-relaxed">{notif.body}</p>
                          <span className="text-[10px] app-muted mt-2 block opacity-70">
                            {new Date(notif.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>

          {/* Sent Requests (Optional but good to have) */}
          {sentRequests.length > 0 && (
            <section>
              <h2 className="text-sm font-bold app-muted uppercase tracking-widest mb-4 px-2 mt-8">Sent Requests</h2>
              <div className="space-y-3 animate-fade-in-up">
                {sentRequests.map((req) => (
                  <div key={req.id} className="glass-panel p-3 rounded-2xl border app-border flex items-center justify-between opacity-70 transition-all">
                    <div 
                      className="flex items-center space-x-3 overflow-hidden flex-1 cursor-pointer transition-transform active:scale-[0.98]"
                      onClick={() => navigate(`/app/user/${req.receiver_id || req.profiles?.id}`)}
                    >
                      <Avatar 
                        url={req.profiles?.avatar_url}
                        name={req.profiles?.full_name}
                        username={req.profiles?.username}
                        className="w-8 h-8"
                      />
                      <div className="truncate">
                        <p className="text-sm app-text truncate">@{req.profiles?.username}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold app-text bg-surface border border-white/10 px-3 py-1.5 rounded-xl flex-shrink-0 ml-2">Requested</span>
                  </div>
                ))}
              </div>
            </section>
          )}
          
        </div>
      )}
    </motion.div>
  );
});

export default Activity;
