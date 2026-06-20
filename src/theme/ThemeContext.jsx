import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes } from '../data/themes';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orvix_preview_theme');
      if (saved) return saved;
    }
    return 'cyber_violet';
  };

  const fallbackTheme = themes.find(t => t.id === 'cyber_violet') || themes[0];
  const [selectedThemeId, setSelectedThemeId] = useState(getInitialTheme);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    setThemeReady(true);
  }, []);

  const applyTheme = (themeId) => {
    const newTheme = themes.find(t => t.id === themeId) || fallbackTheme;
    setSelectedThemeId(newTheme.id);
    localStorage.setItem('orvix_preview_theme', newTheme.id);
    // DO NOT MUTATE document.documentElement
    // DO NOT UPDATE SUPABASE
  };

  const activeTheme = themes.find(t => t.id === selectedThemeId) || fallbackTheme;

  return (
    <ThemeContext.Provider value={{
      selectedThemeId,
      theme: activeTheme,
      themes,
      applyTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
