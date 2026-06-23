import React from 'react';
import { motion } from 'framer-motion';
import { EyeOff, Download } from 'lucide-react';
import MockupPhone from '../ui/MockupPhone';
import MagneticButton from '../ui/MagneticButton';
import { premiumReveal, staggerContainer, fadeUp } from '../../utils/motionVariants';

export default function HeroSection() {
  return (
    <section className="flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto w-full px-4 lg:px-8 pt-24 pb-12 lg:pt-28 lg:pb-16 relative z-10 gap-6 lg:gap-10 lg:gap-8 lg:gap-16 min-h-[85vh]">
      {/* Left Content */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col items-start w-full"
      >
        <motion.div variants={premiumReveal}>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-heading font-bold text-white leading-snug mb-4 tracking-tight pb-2">
            Private Chatting, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary relative inline-block pb-2">
              Styled Your Way.
              <motion.span 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent blur-md pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: window.innerWidth < 768 ? 0 : Infinity, ease: "linear" }}
              />
            </span>
          </h1>
          <p className="text-lg sm:text-xl font-bold mb-3 max-w-2xl leading-relaxed text-primary drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]">
            Choose Your Orvix Vibe Before You Download.
          </p>
          <p className="text-sm sm:text-base text-muted font-light mb-8 max-w-xl leading-relaxed">
            Orvix is a premium private messaging app where your conversations feel personal from the first moment. Pick a theme, create your secure identity, enter the app, and start real-time private chats in a space that looks like you.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-8"
        >
          <MagneticButton 
            href="#themes"
            className="w-full sm:w-auto px-4 lg:px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-semibold text-base shadow-[0_0_20px_rgba(124,58,237,0.4)] border border-white/10"
          >
            <span>Choose My Vibe</span>
          </MagneticButton>
          
          <MagneticButton 
            href="/downloads/orvix.apk?v=foreground-banner-fix-v2"
            download="orvix-v4.apk"
            className="w-full sm:w-auto px-4 lg:px-8 py-3.5 rounded-full bg-theme-surface/60 backdrop-blur-md border border-white/20 text-white font-medium text-base shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          >
            <Download className="w-5 h-5 mr-2 text-primary" />
            <span>Download APK</span>
          </MagneticButton>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-muted font-medium"
        >
          <span>No phone number required</span>
          <span className="text-primary">•</span>
          <span>Private one-to-one chats</span>
          <span className="text-primary">•</span>
          <span>Realtime messaging</span>
          <span className="text-primary">•</span>
          <span>Theme-based experience</span>
        </motion.div>
      </motion.div>

      {/* Right Phone Mockup */}
      <motion.div 
        initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
        className="flex flex-col items-center justify-center w-full lg:w-auto relative perspective-[1200px] mt-12 lg:mt-0"
      >
         <MockupPhone />
         {/* Deep Reflection */}
         <div className="absolute -bottom-16 w-full h-24 bg-gradient-to-t from-background to-transparent blur-2xl opacity-60 pointer-events-none"></div>
      </motion.div>
    </section>
  );
}

