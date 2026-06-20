import React from 'react';
import { motion } from 'framer-motion';

export default function StepFlow() {
  const steps = [
    { num: 1, title: 'Select Theme', desc: 'Pick your Orvix vibe' },
    { num: 2, title: 'Download & Enter', desc: 'Download APK and register inside the app' },
    { num: 3, title: 'Download APK', desc: 'Start private chatting' }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-2xl bg-surface/50 p-6 rounded-3xl border border-white/5 relative mt-8">
      {/* Connecting Line */}
      <div className="hidden sm:block absolute top-1/2 left-10 right-10 h-[1px] bg-white/10 -translate-y-1/2 z-0">
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
          className="h-full bg-gradient-to-r from-primary to-secondary"
        />
      </div>

      {steps.map((step, index) => (
        <motion.div 
          key={step.num}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + (index * 0.3) }}
          className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 relative z-10 w-full sm:w-auto mb-6 sm:mb-0"
        >
          <div className="w-10 h-10 rounded-full bg-surface border-2 border-primary text-white flex items-center justify-center font-bold text-sm shadow-glow relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/40 transition-colors" />
            <span className="relative z-10">{step.num}</span>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="text-sm font-semibold text-white">{step.title}</h4>
            <p className="text-xs text-muted mt-0.5">{step.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
