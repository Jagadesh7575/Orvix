import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { pageFade, listContainer, listItem } from '../lib/motionVariants';
import { friendService } from '../services/friendService';
import { useAuth } from '../hooks/useAuth';
import FriendActionButton from '../components/FriendActionButton';
import Avatar from '../components/Avatar';
import { ListSkeleton } from '../components/Skeletons';

const UserCard = React.memo(({ user, navigate, location, onSaveSearch }) => (
  <motion.div 
    variants={listItem}
    onClick={(e) => {
      e.stopPropagation();
      if (!user?.id) {
        console.error("Cannot open profile: missing user id", user);
        return;
      }
      if (onSaveSearch) onSaveSearch(user);
      navigate(`/app/user/${user.id}`, { state: { from: location.pathname } });
    }}
    className="flex items-center p-4 bg-surface rounded-2xl border border-white/5 shadow-sm cursor-pointer transition-transform"
    style={{ backgroundColor: 'var(--theme-surface)' }}
  >
    <Avatar 
      url={user.avatar_url}
      name={user.full_name}
      username={user.username}
      className="w-12 h-12"
    />
    <div className="ml-4 flex-1 overflow-hidden">
      <h3 className="app-text font-medium truncate">{user.full_name || user.username}</h3>
      <p className="app-muted text-sm truncate">@{user.username}</p>
    </div>
    <div className="ml-2" onClick={(e) => e.stopPropagation()}>
      <FriendActionButton targetUserId={user.id} />
    </div>
  </motion.div>
));

const Discover = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    if (!user) return;
    
    // Clear old global keys
    localStorage.removeItem('orvix_search_history');
    localStorage.removeItem('recent_searches');
    localStorage.removeItem('search_history');
    localStorage.removeItem('orvix_recent_searches');

    const storageKey = `orvix_recent_searches_${user.id}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed);
      } catch (e) {}
    } else {
      setRecentSearches([]);
    }
  }, [user]);

  const saveSearch = useCallback((searchedUser) => {
    if (!user) return;
    const storageKey = `orvix_recent_searches_${user.id}`;
    
    setRecentSearches((prev) => {
      const filtered = prev.filter(u => u.id !== searchedUser.id);
      const newSearches = [searchedUser, ...filtered].slice(0, 10);
      localStorage.setItem(storageKey, JSON.stringify(newSearches));
      return newSearches;
    });
  }, [user]);

  const clearHistory = () => {
    if (!user) return;
    const storageKey = `orvix_recent_searches_${user.id}`;
    setRecentSearches([]);
    localStorage.removeItem(storageKey);
  };

  const removeSearch = (userId, e) => {
    e.stopPropagation();
    if (!user) return;
    const storageKey = `orvix_recent_searches_${user.id}`;
    
    setRecentSearches((prev) => {
      const newSearches = prev.filter(u => u.id !== userId);
      localStorage.setItem(storageKey, JSON.stringify(newSearches));
      return newSearches;
    });
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        const users = await friendService.searchUsers(query.trim());
        setResults(users);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <motion.div 
      variants={pageFade}
      initial="hidden"
      animate="show"
      className="app-page w-full bg-[var(--theme-bg)] pb-[calc(env(safe-area-inset-bottom,20px)+80px)]"
    >
      {/* Premium Header */}
      <div className="px-6 pb-6 bg-[var(--theme-bg)]/80 backdrop-blur-xl border-b app-border sticky top-0 z-20 pt-[calc(env(safe-area-inset-top,0px)+3rem)]">
        <h1 className="text-3xl font-bold font-display tracking-tight text-white">Discover</h1>
        <p className="app-muted text-sm mt-1">Search for people to connect with</p>
        
        {/* Search Input */}
        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Search by username or name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface border app-border rounded-2xl py-3 pl-12 pr-4 app-text focus:outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] transition-all shadow-inner"
          />
          <svg className="w-5 h-5 absolute left-4 top-3.5 app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>

      <div className="px-6 py-6">
        {query.length < 2 && results.length === 0 && recentSearches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 opacity-50">
            <div className="w-16 h-16 rounded-full bg-surface border app-border flex items-center justify-center mb-4">
              <svg className="w-8 h-8 app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <p className="app-muted">Type at least 2 characters to search</p>
          </div>
        )}

        {query.length < 2 && recentSearches.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold app-muted uppercase tracking-widest">Recent Searches</h2>
              <button onClick={clearHistory} className="text-xs font-semibold text-[var(--theme-primary)]">Clear All</button>
            </div>
            <div className="space-y-4">
              {recentSearches.map(user => (
                <motion.div 
                  variants={listItem}
                  initial="hidden"
                  animate="show"
                  key={user.id} 
                  onClick={() => {
                    if (user?.id) {
                      navigate(`/app/user/${user.id}`, { state: { from: location.pathname } });
                    }
                  }}
                  className="flex items-center justify-between p-3 bg-surface rounded-2xl border app-border cursor-pointer transition-transform"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Avatar 
                      url={user.avatar_url}
                      name={user.full_name}
                      username={user.username}
                      className="w-10 h-10 mr-3"
                    />
                    <div className="truncate">
                      <p className="app-text text-sm font-bold truncate">{user.full_name || user.username}</p>
                      <p className="app-muted text-xs truncate">@{user.username}</p>
                    </div>
                  </div>
                  <button onClick={(e) => removeSearch(user.id, e)} className="p-2 -mr-2 app-muted hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <ListSkeleton rows={4} />
        ) : query.length >= 2 && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 opacity-50">
            <p className="app-muted">No users found</p>
          </div>
        ) : (
          <motion.div variants={listContainer} initial="hidden" animate="show" className="space-y-4">
            {results.map((user) => (
              <UserCard key={user.id} user={user} navigate={navigate} location={location} onSaveSearch={saveSearch} />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Discover;
