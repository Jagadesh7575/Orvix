import React from 'react';
import { motion } from 'framer-motion';
import ThemeCard from '../ThemeCard';
import GlowCard from '../GlowCard';
import { useTheme } from '../../theme/ThemeContext';

import { fadeUp, staggerContainer } from '../../utils/motionVariants';

const getGlowColor = (id) => {
  if (id.includes('blue') || id.includes('cyan') || id.includes('ocean')) return 'blue';
  if (id.includes('heart') || id.includes('red')) return 'red';
  if (id.includes('green') || id.includes('forest')) return 'green';
  if (id.includes('sunset') || id.includes('orange')) return 'orange';
  return 'purple';
};

export default function ThemeSelectionSection() {
  const { themes } = useTheme();

  return (
    <section id="themes" className="relative py-16 md:py-20 px-8 z-10 bg-background/50 border-t border-white/5">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent blur-3xl opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Choose Your Orvix Vibe
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto font-light leading-relaxed">
            Preview how each theme transforms the full app experience, then download the APK to use Orvix on your device.
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
          className="flex flex-wrap justify-center gap-6"
        >
          {themes.map((themeObj) => (
            <motion.div
              key={themeObj.id}
              variants={{
                hidden: { opacity: 0, y: 50, scale: 0.9 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
              }}
            >
              <ThemeCard themeItem={themeObj} glowColor={getGlowColor(themeObj.id)} />
            </motion.div>
          ))}
        </motion.div>

        {/* Live Theme Preview Panel removed in favor of dedicated /preview route */}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-12 text-sm text-muted bg-surface/50 px-6 py-3 rounded-full border border-white/5 backdrop-blur-md inline-block shadow-glass"
        >
          <span className="text-primary font-medium">Tip:</span> Selected vibe will be saved after account creation.
        </motion.div>
      </div>
    </section>
  );
}
