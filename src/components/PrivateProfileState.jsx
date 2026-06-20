import React from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const PrivateProfileState = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 mt-4 glass-panel rounded-3xl border app-border text-center"
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--theme-bg-soft)' }}>
        <Lock className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
      </div>
      <h3 className="text-lg font-bold app-text mb-2">This profile is private</h3>
      <p className="text-sm app-muted max-w-xs leading-relaxed">
        Follow each other to be friends. Friends on Orvix can message privately.
      </p>
    </motion.div>
  );
};

export default PrivateProfileState;
