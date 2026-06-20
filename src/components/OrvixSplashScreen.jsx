import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OrvixSplashScreen = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none"
          style={{ backgroundColor: '#0a0a0f' }}
        >
          <div className="relative flex flex-col items-center justify-center flex-1 w-full">
            {/* Subtle radial glow behind the logo */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.15, scale: 1 }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              className="absolute w-48 h-48 rounded-full mix-blend-screen"
              style={{ background: 'radial-gradient(circle, var(--theme-primary, #b347ff) 0%, transparent 70%)' }}
            />
            
            {/* Main Logo */}
            <motion.img
              src="/icon-512.png"
              alt="Orvix Logo"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-28 h-28 object-contain relative z-10 drop-shadow-2xl"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = '/favicon.png'; // Fallback
              }}
            />
            
            {/* App Name Optional (can keep clean without) */}
            {/* <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 text-white text-3xl font-display font-bold tracking-tight relative z-10"
            >
              Orvix
            </motion.h1> */}
          </div>

          <div className="absolute bottom-0 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] flex flex-col items-center w-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center"
            >
              <p className="text-[11px] uppercase tracking-[0.2em] font-medium opacity-50 mb-1.5" style={{ color: '#ffffff' }}>
                Private chats. Premium vibes.
              </p>
              <p className="text-sm font-semibold tracking-wide" style={{ color: '#ffffff', opacity: 0.9 }}>
                Founder Jagadesh
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrvixSplashScreen;
