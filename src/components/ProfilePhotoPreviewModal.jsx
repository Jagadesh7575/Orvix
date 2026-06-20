import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePhotoPreviewModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  fullName, 
  username, 
  isOnline 
}) {
  const displayUsername = username || 'user';
  const displayLetter = displayUsername.charAt(0).toUpperCase();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
            onClick={onClose}
            onContextMenu={(e) => e.preventDefault()}
          />
          <motion.div 
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 flex flex-col items-center pointer-events-none"
          >
            {/* Avatar Container */}
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-4 shadow-2xl flex items-center justify-center overflow-hidden mb-6"
                 style={{ 
                   borderColor: 'var(--theme-surface)', 
                   background: 'var(--theme-bg)',
                   boxShadow: '0 0 40px var(--theme-glow)' 
                 }}>
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={displayUsername} 
                  className="w-full h-full object-cover" 
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center theme-gradient-btn text-8xl font-bold text-white">
                  {displayLetter}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="glass-panel px-6 py-4 rounded-3xl flex flex-col items-center border app-border text-center shadow-xl">
              <h2 className="text-xl font-bold font-display text-white">{fullName || username}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium" style={{ color: 'var(--theme-primary)' }}>@{displayUsername}</span>
                {isOnline && (
                  <span className="flex h-2.5 w-2.5 relative ml-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--theme-success)' }}></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 shadow-sm" style={{ background: 'var(--theme-success)' }}></span>
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
