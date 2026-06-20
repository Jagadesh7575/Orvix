import React from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useNativeTheme } from '../theme/NativeThemeContext';
import { useAuth } from '../hooks/useAuth';

export default function SettingsModal({ isOpen, onClose }) {
  const { themes, selectedThemeId, applyTheme } = useNativeTheme();
  const { user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-background border app-border rounded-3xl shadow-glow overflow-hidden flex flex-col"
      >
        <div className="p-5 border-b app-border flex items-center justify-between bg-surface">
          <h3 className="text-xl font-bold text-white font-display">Settings</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <h4 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wider">Appearance</h4>
          <div className="space-y-3">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => { if (applyTheme) applyTheme(t.id); }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all border ${
                  selectedThemeId === t.id 
                    ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-color),0.2)]' 
                    : 'border-white/5 bg-surface hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedThemeId === t.id ? 'bg-primary text-white' : 'bg-white/10'}`}>
                     {selectedThemeId === t.id && <Check className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-muted">{t.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
