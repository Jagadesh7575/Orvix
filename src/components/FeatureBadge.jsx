import React from 'react';
import { motion } from 'framer-motion';

export default function FeatureBadge({ icon: Icon, title, desc, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="flex flex-col items-center sm:items-start space-y-2 group cursor-default"
    >
      <div className="w-10 h-10 rounded-xl bg-surface border border-white/5 flex items-center justify-center text-primary group-hover:border-primary/30 group-hover:shadow-glow transition-all duration-300">
        <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
      </div>
      <div className="text-center sm:text-left">
        <h4 className="text-sm font-semibold text-white group-hover:text-glow transition-all">{title}</h4>
        <p className="text-xs text-muted mt-1">{desc}</p>
      </div>
    </motion.div>
  );
}
