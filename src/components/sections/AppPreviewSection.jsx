import React from 'react';
import { motion } from 'framer-motion';
import GlowCard from '../GlowCard';
import { fadeUp, staggerContainer, premiumReveal } from '../../utils/motionVariants';

export default function AppPreviewSection() {
  const previews = [
    {
      title: 'Chat Dashboard',
      desc: 'Your recent private conversations in one clean dashboard.',
      visual: (
        <div className="w-full h-48 bg-theme-bg border-b border-white/5 p-5 flex flex-col space-y-4 relative overflow-hidden rounded-t-[1.5rem]">
          <div className="flex items-center space-x-4">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/30 to-secondary/30 p-[1px]">
               <div className="w-full h-full rounded-full bg-theme-surface"></div>
             </div>
             <div className="space-y-2 flex-1"><div className="w-24 h-2 bg-white/30 rounded-full" /><div className="w-3/4 h-2 bg-white/10 rounded-full" /></div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="w-10 h-10 rounded-full bg-white/5" />
             <div className="space-y-2 flex-1"><div className="w-28 h-2 bg-white/20 rounded-full" /><div className="w-1/2 h-2 bg-white/5 rounded-full" /></div>
          </div>
        </div>
      )
    },
    {
      title: 'Private Chat Room',
      desc: 'Fast realtime messages with themed chat bubbles and timestamps.',
      visual: (
        <div className="w-full h-48 bg-theme-bg border-b border-white/5 p-5 flex flex-col space-y-3 relative overflow-hidden rounded-t-[1.5rem]">
          <div className="self-start bg-theme-surface-elevated border border-white/10 rounded-2xl rounded-tl-sm w-3/4 h-10 shadow-sm" />
          <div className="self-end bg-primary-gradient rounded-2xl rounded-tr-sm w-2/3 h-12 shadow-glow flex items-center justify-end px-4">
            <div className="w-16 h-2 bg-white/40 rounded-full" />
          </div>
          <div className="self-start bg-theme-surface-elevated border border-white/10 rounded-2xl rounded-tl-sm w-1/2 h-10 shadow-sm" />
        </div>
      )
    },
    {
      title: 'Theme Settings',
      desc: 'Change your Orvix vibe anytime from settings.',
      visual: (
        <div className="w-full h-48 bg-theme-bg border-b border-white/5 p-5 flex flex-col space-y-4 relative overflow-hidden items-center justify-center rounded-t-[1.5rem]">
          <div className="w-full h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center px-4 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
            <div className="w-5 h-5 rounded-full bg-primary mr-4 shadow-glow"/>
            <div className="w-24 h-2 bg-white/50 rounded-full"/>
          </div>
          <div className="w-full h-12 rounded-2xl bg-theme-surface-elevated border border-white/10 flex items-center px-4">
            <div className="w-5 h-5 rounded-full bg-white/10 mr-4"/>
            <div className="w-32 h-2 bg-white/20 rounded-full"/>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="py-20 md:py-28 px-8 relative z-10 bg-black/40">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          variants={premiumReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">Experience the app</h2>
          <p className="text-muted text-lg max-w-2xl mx-auto font-light">A glimpse into the native interface you'll see after downloading.</p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {previews.map((preview, index) => (
            <motion.div
              key={index}
              variants={fadeUp}
            >
              <GlowCard customSize glowColor="purple" className="p-0 border-0 flex flex-col group h-full bg-surface/30 overflow-hidden">
                <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
                  <div className="w-full relative">
                    {preview.visual}
                    <div className="absolute inset-0 bg-gradient-to-t from-theme-surface to-transparent z-10" />
                  </div>
                  <div className="p-8 relative z-20 bg-theme-surface flex-grow flex flex-col justify-start">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{preview.title}</h3>
                    <p className="text-sm text-muted font-light leading-relaxed">{preview.desc}</p>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
