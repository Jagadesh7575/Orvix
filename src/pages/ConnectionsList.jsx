import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { friendService } from '../services/friendService';
import { useAuth } from '../hooks/useAuth';
import { safeBack } from '../utils/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { pageFade, listContainer, listItem } from '../lib/motionVariants';
import { isUserActuallyOnline } from '../utils/presence';
import FriendActionButton from '../components/FriendActionButton';
import Avatar from '../components/Avatar';
import { ListSkeleton } from '../components/Skeletons';

const ConnectionsList = () => {
  const { userId, type } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !['followers', 'following'].includes(type)) {
      setError(true);
      setLoading(false);
      return;
    }

    const fetchConnections = async () => {
      setLoading(true);
      setError(null);
      try {
        let data = [];
        console.log("ConnectionsList target userId:", userId);
        console.log("ConnectionsList type:", type);
        
        if (type === 'followers') {
          data = await friendService.getFollowers(userId);
        } else if (type === 'following') {
          data = await friendService.getFollowing(userId);
        }
        
        console.log("fetched profiles:", data);
        
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching connections:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [userId, type]);

  const title = type === 'followers' ? 'Followers' : 'Following';
  const emptyText = type === 'followers' ? 'No followers yet' : 'Not following anyone yet';

  return (
    <motion.div 
      variants={pageFade}
      initial="hidden"
      animate="show"
      className="app-page w-full bg-[var(--theme-bg)] text-[var(--theme-text)] pb-[calc(env(safe-area-inset-bottom,20px)+80px)]"
    >
      {/* Top Navigation */}
      <div className="sticky top-0 z-20 bg-[var(--theme-bg)]/80 backdrop-blur-md border-b app-border px-4 py-3 flex items-center pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button onClick={() => safeBack(navigate, location, `/app/user/${userId}`)} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold font-display ml-2">{title}</h1>
      </div>

      <div className="px-4 py-6 md:max-w-xl mx-auto">
        {loading ? (
          <ListSkeleton rows={5} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 opacity-80 text-center text-red-400">
            <h2 className="text-lg font-bold mb-1">Failed to load {title.toLowerCase()}</h2>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-white/5 rounded-xl text-sm">Retry</button>
          </div>
        ) : Array.isArray(users) && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 opacity-50 text-center">
            <div className="w-16 h-16 rounded-full bg-surface border app-border flex items-center justify-center mb-4">
              <svg className="w-8 h-8 app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h2 className="text-sm font-bold">{emptyText}</h2>
          </div>
        ) : (
          <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-4">
            {Array.isArray(users) && users.map((profile) => (
              <motion.div 
                variants={listItem}
                key={profile.id}
                onClick={() => navigate(profile.id === user?.id ? '/app/profile' : `/app/user/${profile.id}`)}
                className="flex items-center p-4 bg-surface rounded-2xl border app-border shadow-sm cursor-pointer transition-transform"
                style={{ backgroundColor: 'var(--theme-surface)' }}
              >
                <div className="relative flex-shrink-0">
                  <Avatar 
                    url={profile.avatar_url}
                    name={profile.full_name}
                    username={profile.username}
                    className="w-12 h-12"
                  />
                  {isUserActuallyOnline(profile) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--theme-bg)]" style={{ background: 'var(--theme-success)' }} />
                  )}
                </div>
                <div className="ml-4 flex-1 overflow-hidden">
                  <h3 className="app-text font-medium truncate text-[15px]">{profile.full_name || profile.username}</h3>
                  <p className="app-muted text-sm truncate">@{profile.username}</p>
                </div>
                <div className="ml-2" onClick={(e) => e.stopPropagation()}>
                  {profile.id !== user?.id && (
                    <FriendActionButton targetUserId={profile.id} />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ConnectionsList;
