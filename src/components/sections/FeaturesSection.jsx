import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Search, MessageSquare, Zap, Eye, Clock, Palette, Settings, Smartphone, Layers } from 'lucide-react';
import GlowCard from '../GlowCard';
import { fadeUp, staggerContainer, premiumReveal } from '../../utils/motionVariants';

export default function FeaturesSection() {
  const features = [
    { icon: UserPlus, title: 'Secure Profiles', desc: 'Register and create a profile protected by secure authentication.' },
    { icon: Search, title: 'Username Search', desc: 'Find friends easily using just their username, without sharing phone numbers.' },
    { icon: MessageSquare, title: 'Private 1-to-1 Chat', desc: 'Start dedicated private conversations.' },
    { icon: Zap, title: 'Realtime Messages', desc: 'Send and receive messages instantly powered by Supabase Realtime.' },
    { icon: Eye, title: 'Online Presence', desc: 'See when your friends are online or offline in real time.' },
    { icon: Clock, title: 'Last Seen Status', desc: 'Know when someone was last active on Orvix.' },
    { icon: Palette, title: 'Personal Themes', desc: 'Use premium themes that style your entire app experience.' },
    { icon: Settings, title: 'Live Updates', desc: 'Update your profile and theme anytime from settings.' },
    { icon: Smartphone, title: 'Mobile First', desc: 'PWA-ready responsive design that feels like a native app.' },
    { icon: Layers, title: 'Future Ready', desc: 'Built to support upcoming features like voice, media, and groups.' },
  ];

  return (
    <section id="features" className="py-20 md:py-28 px-8 relative z-10 bg-black/40">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <motion.div
          variants={premiumReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">Built for the Modern User</h2>
          <p className="text-muted text-lg max-w-2xl mx-auto font-light">Everything you need for a premium, private messaging experience without the bloat.</p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        >
          {features.map((feat, index) => (
            <motion.div key={index} variants={fadeUp} className="h-full">
              <GlowCard customSize glowColor="purple" className="p-6 h-full group bg-surface/30">
                <div className="flex flex-col h-full">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors border border-white/5 group-hover:border-primary/30">
                    <feat.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-3 tracking-wide">{feat.title}</h3>
                  <p className="text-sm text-muted leading-relaxed font-light flex-grow">{feat.desc}</p>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
