import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../hooks/useAuth';
import { headingFonts, bodyFonts, getHeadingFontById, getBodyFontById, getLegacyFontById } from '../config/typographyFonts';
import { motion, AnimatePresence } from 'framer-motion';

const TypographyContext = createContext();

export function TypographyProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [selectedHeadingFontId, setSelectedHeadingFontId] = useState(null);
  const [selectedBodyFontId, setSelectedBodyFontId] = useState(null);
  const [toast, setToast] = useState(null);

  const applyHeadingFontVariable = (font) => {
    const isNative = Capacitor.isNativePlatform();
    if (!isNative) return;

    const root = document.documentElement;
    if (font) {
      root.style.setProperty('--orvix-heading-font-family', font.fontFamily);
    } else {
      root.style.removeProperty('--orvix-heading-font-family');
    }
  };

  const applyBodyFontVariable = (font) => {
    const isNative = Capacitor.isNativePlatform();
    if (!isNative) return;

    const root = document.documentElement;
    if (font) {
      root.style.setProperty('--orvix-body-font-family', font.fontFamily);
    } else {
      root.style.removeProperty('--orvix-body-font-family');
    }
  };

  React.useLayoutEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      const storedHeading = localStorage.getItem('orvix_heading_font_temp');
      if (storedHeading) {
        const font = getHeadingFontById(storedHeading);
        if (font) applyHeadingFontVariable(font);
      }
      
      const storedBody = localStorage.getItem('orvix_body_font_temp');
      if (storedBody) {
        const font = getBodyFontById(storedBody);
        if (font) applyBodyFontVariable(font);
      }
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let mounted = true;

    const initializeTypography = async () => {
      if (!user) {
        if (mounted) {
          setSelectedHeadingFontId(null);
          setSelectedBodyFontId(null);
          applyHeadingFontVariable(null);
          applyBodyFontVariable(null);
          localStorage.removeItem('orvix_heading_font_temp');
          localStorage.removeItem('orvix_body_font_temp');
        }
        return;
      }

      // 1. Load from localStorage
      const localHeading = localStorage.getItem(`orvix_heading_font_${user.id}`);
      const localBody = localStorage.getItem(`orvix_body_font_${user.id}`);
      
      if (mounted) {
        if (localHeading) {
          const fontObj = getHeadingFontById(localHeading);
          if (fontObj) {
            setSelectedHeadingFontId(fontObj.id);
            applyHeadingFontVariable(fontObj);
            localStorage.setItem('orvix_heading_font_temp', fontObj.id);
          }
        }
        
        if (localBody) {
          const fontObj = getBodyFontById(localBody);
          if (fontObj) {
            setSelectedBodyFontId(fontObj.id);
            applyBodyFontVariable(fontObj);
            localStorage.setItem('orvix_body_font_temp', fontObj.id);
          }
        }
      }

      // 2. Load from Supabase
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('selected_heading_font, selected_body_font, selected_font')
          .eq('id', user.id)
          .maybeSingle();

        if (profile && mounted) {
          // Resolve Heading
          let dbHeading = profile.selected_heading_font;
          if (!dbHeading && profile.selected_font) {
            const legacyFont = getLegacyFontById(profile.selected_font);
            if (legacyFont && legacyFont.type === 'heading') {
              dbHeading = legacyFont.id;
            }
          }
          
          if (dbHeading) {
            const validHeading = getHeadingFontById(dbHeading);
            if (validHeading) {
              if (validHeading.id !== localHeading) {
                setSelectedHeadingFontId(validHeading.id);
                applyHeadingFontVariable(validHeading);
                localStorage.setItem(`orvix_heading_font_${user.id}`, validHeading.id);
                localStorage.setItem('orvix_heading_font_temp', validHeading.id);
              }
            }
          } else {
            setSelectedHeadingFontId(null);
            applyHeadingFontVariable(null);
            localStorage.removeItem(`orvix_heading_font_${user.id}`);
            localStorage.removeItem('orvix_heading_font_temp');
          }

          // Resolve Body
          let dbBody = profile.selected_body_font;
          if (!dbBody && profile.selected_font) {
            const legacyFont = getLegacyFontById(profile.selected_font);
            if (legacyFont && legacyFont.type === 'body') {
              dbBody = legacyFont.id;
            }
          }

          if (dbBody) {
            const validBody = getBodyFontById(dbBody);
            if (validBody) {
              if (validBody.id !== localBody) {
                setSelectedBodyFontId(validBody.id);
                applyBodyFontVariable(validBody);
                localStorage.setItem(`orvix_body_font_${user.id}`, validBody.id);
                localStorage.setItem('orvix_body_font_temp', validBody.id);
              }
            }
          } else {
            setSelectedBodyFontId(null);
            applyBodyFontVariable(null);
            localStorage.removeItem(`orvix_body_font_${user.id}`);
            localStorage.removeItem('orvix_body_font_temp');
          }
        }
      } catch (err) {
        console.warn('Could not fetch typography from DB', err);
      }
    };

    initializeTypography();
    return () => { mounted = false; };
  }, [user, authLoading]);

  const applyHeadingTypography = async (fontId) => {
    if (!fontId) {
      setSelectedHeadingFontId(null);
      applyHeadingFontVariable(null);
      if (user) {
        localStorage.removeItem(`orvix_heading_font_${user.id}`);
        localStorage.removeItem('orvix_heading_font_temp');
        try {
          await supabase.from('profiles').update({ selected_heading_font: null, updated_at: new Date().toISOString() }).eq('id', user.id);
        } catch (err) {}
      }
      return;
    }

    const newFont = getHeadingFontById(fontId);
    if (!newFont) return;
    
    setSelectedHeadingFontId(newFont.id);
    applyHeadingFontVariable(newFont);

    if (user) {
      localStorage.setItem(`orvix_heading_font_${user.id}`, newFont.id);
      localStorage.setItem('orvix_heading_font_temp', newFont.id);
      try {
        await supabase.from('profiles').update({ selected_heading_font: newFont.id, updated_at: new Date().toISOString() }).eq('id', user.id);
      } catch (err) {}
    }

    setToast(`${newFont.name} applied to headings`);
    setTimeout(() => setToast(null), 2500);
  };

  const applyBodyTypography = async (fontId) => {
    if (!fontId) {
      setSelectedBodyFontId(null);
      applyBodyFontVariable(null);
      if (user) {
        localStorage.removeItem(`orvix_body_font_${user.id}`);
        localStorage.removeItem('orvix_body_font_temp');
        try {
          await supabase.from('profiles').update({ selected_body_font: null, updated_at: new Date().toISOString() }).eq('id', user.id);
        } catch (err) {}
      }
      return;
    }

    const newFont = getBodyFontById(fontId);
    if (!newFont) return;
    
    setSelectedBodyFontId(newFont.id);
    applyBodyFontVariable(newFont);

    if (user) {
      localStorage.setItem(`orvix_body_font_${user.id}`, newFont.id);
      localStorage.setItem('orvix_body_font_temp', newFont.id);
      try {
        await supabase.from('profiles').update({ selected_body_font: newFont.id, updated_at: new Date().toISOString() }).eq('id', user.id);
      } catch (err) {}
    }

    setToast(`${newFont.name} applied to body text`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <TypographyContext.Provider value={{ 
      selectedHeadingFontId, 
      selectedBodyFontId,
      applyHeadingTypography,
      applyBodyTypography,
      headingFonts,
      bodyFonts
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
    </TypographyContext.Provider>
  );
}

export const useTypography = () => useContext(TypographyContext);
