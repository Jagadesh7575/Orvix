import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Palette, Eye, UserPlus, Save, LayoutGrid, Search, MessageSquare, Zap, Settings } from 'lucide-react';
import GlowCard from '../GlowCard';

export default function HowItWorksSection() {
  const steps = [
    { icon: Globe, title: 'Open Website', desc: 'Explore Orvix and see all available private chat vibes.' },
    { icon: Palette, title: 'Choose a Theme', desc: 'Pick Cyber Violet, Royal Gold, Lavender Glow, Ocean Blue, or Midnight Black.' },
    { icon: Eye, title: 'Show Preview', desc: 'Preview how the selected theme looks across Dashboard, Chat, Login/Register, and Settings screens.' },
    { icon: Save, title: 'Download APK', desc: 'Download the Orvix APK from the website.' },
    { icon: LayoutGrid, title: 'Open App', desc: 'Install and open the APK on Android.' },
    { icon: UserPlus, title: 'Login or Register', desc: 'Existing users login. New users create an account inside the app.' },
    { icon: Search, title: 'Enter Dashboard', desc: 'After login/register, Orvix opens the private chat dashboard.' },
    { icon: MessageSquare, title: 'Start Private Chatting', desc: 'Search users, open private chats, and send realtime messages.' },
  ];

  return (
    <section id="how-it-works" className="py-32 px-8 relative z-10 bg-surface/30 border-y border-white/5 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
      
      <div className="max-w-5xl mx-auto w-full relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">How Orvix Works</h2>
          <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            From choosing your vibe to starting a private realtime chat, Orvix keeps the journey simple, personal, and secure.
          </p>
        </motion.div>

        {/* Customer-Friendly Simple Flow Row */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="hidden md:flex flex-wrap justify-center items-center gap-2 mb-24 max-w-4xl mx-auto"
        >
          {['Open Website', 'Choose Theme', 'Show Preview', 'Download APK', 'Open App', 'Login/Register', 'Enter Dashboard', 'Start Chatting'].map((item, i, arr) => (
            <React.Fragment key={i}>
              <div className="bg-surface border border-white/10 px-4 py-2 rounded-full text-xs font-semibold text-white shadow-glass">
                {item}
              </div>
              {i < arr.length - 1 && (
                <div className="text-primary text-xs font-bold">→</div>
              )}
            </React.Fragment>
          ))}
        </motion.div>

        {/* Detailed Vertical Timeline */}
        <div className="relative">
          {/* Glowing Connecting Line */}
          <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-0.5 bg-white/10 md:-translate-x-1/2">
            <motion.div 
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary via-secondary to-primary shadow-glow h-32 rounded-full"
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 5, repeat: window.innerWidth < 768 ? 0 : Infinity, ease: 'linear' }}
            />
          </div>

          <div className="space-y-12 md:space-y-0">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, type: 'spring', damping: 20 }}
                  className={`relative flex items-center md:justify-between w-full ${isEven ? 'md:flex-row-reverse' : ''}`}
                >
                  
                  {/* Empty space for alternating layout on desktop */}
                  <div className="hidden md:block w-5/12" />

                  {/* Icon Node */}
                  <div className="absolute left-0 md:left-1/2 -translate-x-0 md:-translate-x-1/2 flex items-center justify-center z-20">
                    <div className="w-14 h-14 rounded-full bg-background border-2 border-white/10 flex items-center justify-center relative group-hover:border-primary transition-colors shadow-xl">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                      <step.icon className="w-6 h-6 text-primary relative z-10" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface border border-white/10 text-[10px] font-bold flex items-center justify-center text-white">
                        {index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="w-full pl-20 md:pl-0 md:w-5/12">
                    <GlowCard customSize glowColor="purple" className="glass-panel p-6 hover:border-primary/50 transition-all duration-300 group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <h3 className="text-xl font-bold text-white mb-2 relative z-10 group-hover:text-primary transition-colors">{step.title}</h3>
                      <p className="text-sm text-muted leading-relaxed relative z-10">{step.desc}</p>
                    </GlowCard>
                  </div>

                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
