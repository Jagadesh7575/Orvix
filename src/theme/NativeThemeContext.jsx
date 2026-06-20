import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { themes } from '../data/themes';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useAuth } from '../hooks/useAuth';

const NativeThemeContext = createContext();

export function NativeThemeProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  
  const fallbackTheme = themes.find(t => t.id === 'cyber_violet') || themes[0];
  const [selectedThemeId, setSelectedThemeId] = useState(fallbackTheme.id);
  const [themeReady, setThemeReady] = useState(false);
  const [toast, setToast] = useState(null);

  const activeTheme = themes.find(t => t.id === selectedThemeId) || fallbackTheme;

  const applyThemeVariables = (theme) => {
    const isNative = Capacitor.isNativePlatform();
    if (!isNative) {
      return;
    }

    const root = document.documentElement;
    root.style.setProperty('--theme-bg', theme.background);
    root.style.setProperty('--theme-bg-soft', theme.backgroundSoft);
    root.style.setProperty('--theme-surface', theme.surface);
    root.style.setProperty('--theme-surface-elevated', theme.surfaceElevated);
    root.style.setProperty('--theme-card', theme.card);
    root.style.setProperty('--theme-card-border', theme.cardBorder);
    root.style.setProperty('--theme-text', theme.text);
    root.style.setProperty('--theme-muted', theme.textMuted);
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-border', theme.cardBorder); // Map border to cardBorder
    root.style.setProperty('--theme-button-gradient', theme.buttonGradient);
    root.style.setProperty('--theme-bubble-outgoing', theme.bubbleOutgoing);
    root.style.setProperty('--theme-bubble-incoming', theme.bubbleIncoming);
    root.style.setProperty('--theme-nav-bg', theme.navBackground);
    root.style.setProperty('--theme-input-bg', theme.inputBackground);
    root.style.setProperty('--theme-danger', theme.danger);
    root.style.setProperty('--theme-success', theme.success);
    root.style.setProperty('--theme-shadow', theme.shadow);
    root.style.setProperty('--theme-glow', theme.glow);

    try {
      // StatusBar requires a hex color, but theme.background is a linear-gradient.
      // Extract the first hex code from the background string.
      const match = theme.background.match(/#[0-9a-fA-F]{6}/);
      const hexColor = match ? match[0] : '#050711';
      
      StatusBar.setBackgroundColor({ color: hexColor }).catch(console.warn);
      StatusBar.setStyle({ style: Style.Dark }).catch(console.warn);
    } catch (err) {
      console.warn("StatusBar update failed", err);
    }
  };

  React.useLayoutEffect(() => {
    // Apply default cyber_violet variables immediately so CSS vars exist for Splash
    applyThemeVariables(fallbackTheme);
  }, []);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to resolve

    let mounted = true;

    const initializeTheme = async () => {
      if (!user) {
        // Logged out / Guest -> Force cyber_violet
        if (mounted) {
           setSelectedThemeId('cyber_violet');
           applyThemeVariables(fallbackTheme);
           setThemeReady(true);
        }
        return;
      }

      // Logged in
      const accountLocalTheme = localStorage.getItem(`orvix_theme_${user.id}`);
      if (accountLocalTheme && mounted) {
        const localThemeObj = themes.find(t => t.id === accountLocalTheme) || fallbackTheme;
        setSelectedThemeId(localThemeObj.id);
        applyThemeVariables(localThemeObj);
      } else if (mounted) {
        setSelectedThemeId('cyber_violet');
        applyThemeVariables(fallbackTheme);
      }
      
      if (mounted) setThemeReady(true);

      // Sync with Supabase
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('theme_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile && mounted) {
          const dbTheme = profile.theme_id;
          if (dbTheme) {
            const validDbTheme = themes.find(t => t.id === dbTheme);
            if (validDbTheme && validDbTheme.id !== (accountLocalTheme || 'cyber_violet')) {
              setSelectedThemeId(validDbTheme.id);
              applyThemeVariables(validDbTheme);
              localStorage.setItem(`orvix_theme_${user.id}`, validDbTheme.id);
            } else if (validDbTheme && !accountLocalTheme) {
              localStorage.setItem(`orvix_theme_${user.id}`, validDbTheme.id);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch theme from DB', err);
      }
    };

    initializeTheme();

    return () => { mounted = false; };
  }, [user, authLoading]);

  const applyTheme = async (themeId) => {
    const newTheme = themes.find(t => t.id === themeId) || fallbackTheme;
    
    setSelectedThemeId(newTheme.id);
    applyThemeVariables(newTheme);

    if (user) {
      localStorage.setItem(`orvix_theme_${user.id}`, newTheme.id);
      try {
        await supabase
          .from('profiles')
          .update({ 
            theme_id: newTheme.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      } catch (err) {
        console.error('Error saving theme to DB', err);
      }
    }

    setToast(`${newTheme.name} applied globally`);
    setTimeout(() => setToast(null), 2500);
  };

  const loadNativeTheme = async () => {};

  return (
    <NativeThemeContext.Provider value={{ 
      selectedThemeId, 
      theme: activeTheme, 
      themes, 
      applyTheme,
      loadNativeTheme,
      loadingTheme: !themeReady,
      themeReady
    }}>
      {children}
      
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-20 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl border flex items-center space-x-3 shadow-[var(--theme-shadow)]"
            style={{
              background: 'var(--theme-surface-elevated)',
              borderColor: 'var(--theme-primary)'
            }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--theme-primary)', boxShadow: 'var(--theme-glow)' }} />
            <span style={{ color: 'var(--theme-text)' }} className="font-semibold text-sm whitespace-nowrap">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </NativeThemeContext.Provider>
  );
}

export const useNativeTheme = () => useContext(NativeThemeContext);
