import React from 'react';
import { motion } from 'framer-motion';
import { useNativeTheme } from '../theme/NativeThemeContext';
import { Check, Palette } from 'lucide-react';

export default function ThemeSettings() {
  const { themes, selectedThemeId, applyTheme } = useNativeTheme();

  return (
    <div className="app-page w-full p-4 md:max-w-xl mx-auto">


      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6 flex items-center space-x-3"
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--theme-bg-soft)' }}>
          <Palette className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display app-text">Themes</h1>
          <p className="text-sm app-muted">Customize your app vibe</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {themes.map((t, i) => {
          const isActive = selectedThemeId === t.id;
          
          return (
            <motion.div
              key={t.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05 * i }}
              className={`relative flex flex-col p-5 rounded-3xl transition-all overflow-hidden ${
                isActive 
                  ? 'border-2 shadow-[var(--theme-glow)]' 
                  : 'border hover:scale-[1.02]'
              }`}
              style={{
                borderColor: isActive ? t.primary : t.cardBorder,
                background: t.card
              }}
            >
              {/* Pseudo-background gradient hint */}
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none" style={{ backgroundColor: t.primary }} />
              
              <div className="flex w-full justify-between items-start mb-4 relative z-10">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'text-white' : 'text-transparent'}`}
                  style={{ background: isActive ? t.primary : 'rgba(255,255,255,0.05)', boxShadow: isActive ? `0 0 15px ${t.primary}80` : 'none' }}
                >
                  <Check className="w-4 h-4" />
                </div>
                
                {/* Miniature UI Preview */}
                <div className="flex flex-col space-y-1 p-2 rounded-lg" style={{ background: t.background }}>
                  <div className="w-10 h-2 rounded" style={{ background: t.bubbleIncoming }} />
                  <div className="w-10 h-2 rounded self-end" style={{ background: t.bubbleOutgoing }} />
                  <div className="w-16 h-3 rounded-md mt-1" style={{ background: t.buttonGradient }} />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-1 font-display" style={{ color: t.text }}>{t.name}</h3>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: t.textMuted }}>{t.description}</p>
                
                <button
                  onClick={() => applyTheme(t.id)}
                  className="mt-4 w-full py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 flex items-center justify-center text-white"
                  style={{ background: t.buttonGradient, boxShadow: isActive ? `0 0 15px ${t.primary}50` : 'none' }}
                >
                  {isActive ? 'Active Theme' : 'Apply Theme'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
