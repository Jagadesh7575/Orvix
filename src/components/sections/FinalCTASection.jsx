import React from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import MagneticButton from '../ui/MagneticButton';
import { scaleIn, premiumReveal, fadeUp } from '../../utils/motionVariants';

export default function FinalCTASection() {
  return (
    <section className="py-24 md:py-32 px-4 lg:px-8 relative z-10 bg-black/40 overflow-hidden border-t border-white/5">
      {/* Premium Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[500px] bg-primary/20 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[300px] bg-secondary/15 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      
      <div className="max-w-4xl mx-auto w-full relative z-10 text-center">
        <motion.div
          variants={premiumReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div variants={scaleIn} className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 mb-8 backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_#7c3aed] animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-white uppercase">Available Now</span>
          </motion.div>
          
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tight drop-shadow-2xl">
            Ready to build your <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary relative inline-block">
              private space?
            </span>
          </motion.h2>
          
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Choose your Orvix vibe, create your secure identity, and start real-time private conversations in a premium personal chat space.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <MagneticButton 
              href="#themes"
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-theme-surface/50 backdrop-blur-md border border-white/10 text-white font-semibold text-lg shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:border-white/20 hover:bg-white/5"
            >
              <span>Choose My Vibe</span>
            </MagneticButton>
            
            <a 
              href="/downloads/orvix-v8.apk"
              download="orvix-v4.apk"
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] border border-white/10"
            >
              <Download className="w-5 h-5 mr-3 drop-shadow-md" />
              <span>Download APK</span>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
