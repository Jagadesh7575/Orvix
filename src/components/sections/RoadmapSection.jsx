import React from 'react';
import { motion } from 'framer-motion';
import { Milestone } from 'lucide-react';

export default function RoadmapSection() {
  const versions = [
    {
      version: 'Version 1',
      status: 'Current',
      features: ['Authentication', 'Profiles', 'Theme system', 'Private chat', 'Realtime messages']
    },
    {
      version: 'Version 2',
      status: 'Coming Soon',
      features: ['Image sharing', 'Voice notes', 'Typing indicators', 'Push notifications', 'Message reactions']
    },
    {
      version: 'Version 3',
      status: 'Planned',
      features: ['Group chats', 'Advanced privacy controls', 'End-to-end encryption', 'Custom theme builder', 'Play Store release']
    }
  ];

  return (
    <section id="roadmap" className="py-24 px-8 relative z-10 bg-surface/30 border-y border-white/5">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4">The Journey Ahead</h2>
          <p className="text-muted text-lg">Orvix is constantly evolving. Here is our roadmap.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-10 right-10 h-0.5 bg-white/5" />

          {versions.map((ver, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="relative z-10"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-background ${ver.status === 'Current' ? 'bg-primary shadow-glow' : 'bg-surface border-white/10 text-muted'}`}>
                  <Milestone className={`w-5 h-5 ${ver.status === 'Current' ? 'text-white' : ''}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{ver.version}</h3>
                  <div className={`text-xs font-semibold ${ver.status === 'Current' ? 'text-primary' : 'text-muted'}`}>{ver.status}</div>
                </div>
              </div>
              
              <div className="glass-panel p-6 rounded-2xl">
                <ul className="space-y-3">
                  {ver.features.map((feat, i) => (
                    <li key={i} className="flex items-start space-x-3 text-sm text-gray-300">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${ver.status === 'Current' ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary-color),0.8)]' : 'bg-white/20'}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
