import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { App as CapacitorApp } from '@capacitor/app';
import { pushNotificationService } from '../services/pushNotificationService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const heartbeatIntervalRef = useRef(null);

  // Helper to strictly update presence
  const updatePresence = async (isOnline, userId) => {
    if (!userId) return;
    try {
      await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (e) {
      console.error('Failed to update presence', e);
    }
  };

  const startHeartbeat = (userId) => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    updatePresence(true, userId);
    heartbeatIntervalRef.current = setInterval(() => {
      updatePresence(true, userId);
    }, 30000); // 30 seconds
  };

  const stopHeartbeat = (userId) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    updatePresence(false, userId);
  };

  useEffect(() => {
    // Listen for auth changes (this will also fire immediately with INITIAL_SESSION in Supabase v2)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Effect to manage presence lifecycle
  useEffect(() => {
    if (!user?.id) {
      // Clean up if user logs out
      stopHeartbeat(user?.id);
      return;
    }

    // Start heartbeat when user is active
    startHeartbeat(user.id);

    // Setup Capacitor Background/Foreground Listener
    let appStateListener = null;
    let isCancelled = false;

    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        startHeartbeat(user.id);
      } else {
        stopHeartbeat(user.id);
      }
    }).then(listener => {
      if (isCancelled) {
        listener.remove();
      } else {
        appStateListener = listener;
      }
    });

    // Setup Web Visibility Fallback
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startHeartbeat(user.id);
      } else {
        stopHeartbeat(user.id);
      }
    };
    
    const handleBeforeUnload = () => {
      stopHeartbeat(user.id);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isCancelled = true;
      stopHeartbeat(user.id);
      if (appStateListener) appStateListener.remove();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id]);

  const fetchProfile = async (userId) => {
    try {
      // Refresh follower/following counts directly via RPC before fetching
      await supabase.rpc('refresh_profile_counts', { p_user_id: userId });
      
      // Mark user as online immediately
      updatePresence(true, userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      setProfile(data);
      
      // PHASE 1: Initialize push notifications securely (runs only on Android native)
      pushNotificationService.initializePushNotifications(userId);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email, password, userData) => {
    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', userData.username)
      .maybeSingle();

    if (existingUser) {
      throw new Error('Username already taken. Choose another.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('Email already registered. Please login.');
      }
      throw error;
    }
    
    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          email,
          full_name: userData.full_name,
          username: userData.username,
          theme_id: 'cyber_violet'
        }]);
        
        if (profileError) {
          if (profileError.code === '23505') {
            if (profileError.message.includes('username')) {
               throw new Error('Username already taken. Choose another.');
            }
            if (profileError.message.includes('email')) {
               throw new Error('Email already registered. Please login.');
            }
            console.warn('Profile already exists, ignoring duplicate insert.');
          } else {
             throw new Error('Failed to create user profile. Please try again.');
          }
        }
    }
    
    // Prevent auto-login after register by signing out immediately
    await supabase.auth.signOut();
    return data;
  };

  const signOut = async () => {
    if (user) {
      stopHeartbeat(user.id);
      await pushNotificationService.removeDeviceTokenOnLogout();
    }
    return supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
