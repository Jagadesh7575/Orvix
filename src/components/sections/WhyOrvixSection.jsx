import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Sparkles, Type, Shield } from 'lucide-react';
import GlowCard from '../GlowCard';

export default function WhyOrvixSection() {
  const cards = [
    {
      icon: Palette,
      title: "Your Chat, Your Identity",
      desc: "Most chat apps look the same for everyone. Orvix lets you choose a visual theme and make the private chat experience feel personal to you."
    },
    {
      icon: Sparkles,
      title: "Themes That Feel Personal",
      desc: "Choose from premium Orvix themes and preview how Login, Home, Chat, Settings, and Logout screens look before downloading the APK."
    },
    {
      icon: Type,
      title: "Typography That Matches Your Vibe",
      desc: "Inside the APK, users can select a font style and apply it across the native app interface, making Orvix feel more personal and consistent."
    },
    {
      icon: Shield,
      title: "Private, Realtime, and Clean",
      desc: "Orvix focuses on private one-to-one conversations, protected profiles, realtime messages, and a clean distraction-free chat experience."
    }
  ];

  return (
    <section className="py-20 md:py-28 px-4 lg:px-8 relative z-10 bg-black/40">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-6">Why Orvix is different</h2>
          <p className="text-muted text-lg max-w-2xl mx-auto font-light">A messaging experience that adapts to your style, not the other way around.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -5 }}
              className="h-full"
            >
              <GlowCard 
                customSize 
                glowColor="purple" 
                className="h-full bg-[#0a0a0f]/50 backdrop-blur-2xl border border-white/10 hover:border-primary/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_0_30px_rgba(124,58,237,0.15)] rounded-[2rem] p-8 md:p-10 group transition-all duration-500 overflow-hidden flex flex-col"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-14 h-14 rounded-2xl bg-surface/80 border border-white/10 shadow-inner flex items-center justify-center text-primary mb-8 group-hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] group-hover:bg-primary/10 transition-all duration-500 group-hover:scale-110">
                    <card.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white/90 group-hover:text-white mb-4 transition-colors tracking-wide">{card.title}</h3>
                  <p className="text-muted text-base leading-relaxed font-light flex-grow">{card.desc}</p>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
