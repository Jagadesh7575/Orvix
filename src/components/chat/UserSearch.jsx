import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, MessageSquarePlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { isUserActuallyOnline } from '../../utils/presence';

export default function UserSearch({ isOpen, onClose, onSelectUser }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, is_online, last_seen')
          .neq('id', user.id) // exclude self
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(10);
        
        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error("Error searching users", err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, user.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background border app-border rounded-2xl shadow-glow overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b app-border flex items-center justify-between bg-surface">
          <h3 className="text-lg font-semibold text-white">New Chat</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b app-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or name..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface border app-border rounded-xl app-text text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((u) => (
                <button 
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center relative flex-shrink-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold">{u.username.charAt(0).toUpperCase()}</span>
                    )}
                    {isUserActuallyOnline(u) && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-sm font-semibold text-white truncate">{u.full_name || u.username}</div>
                    <div className="text-xs text-muted truncate">@{u.username}</div>
                  </div>
                  <MessageSquarePlus className="w-4 h-4 text-primary" />
                </button>
              ))}
            </div>
          ) : query.trim().length > 1 ? (
            <div className="text-center py-8 text-sm text-muted">No users found</div>
          ) : (
            <div className="text-center py-8 text-sm text-muted">Type to search users</div>
          )}
        </div>
      </div>
    </div>
  );
}
