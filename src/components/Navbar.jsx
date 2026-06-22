import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import LogoLockup from './brand/LogoLockup';
import { downloadApk } from '../utils/downloadApk';

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 glass-panel mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl"
    >
      <LogoLockup />

      <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-muted">
        <a href="#features" className="hover:text-white transition-colors">Features</a>
        <a href="#security" className="hover:text-white transition-colors">Security</a>
        <a href="#themes" className="text-primary text-glow">Themes</a>
        <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>

        <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <button 
          onClick={downloadApk}
          className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-surface border border-primary/30 text-white text-xs sm:text-sm font-medium hover:bg-primary/20 hover:border-primary transition-all duration-300 shadow-[0_0_15px_rgba(var(--primary-color),0.2)] hover:shadow-glow"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="hidden sm:block">Download APK</span>
          <span className="sm:hidden">APK</span>
        </button>
      </div>
    </motion.nav>
  );
}
