import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, UserCheck, Database, Server, Key } from 'lucide-react';
import GlowCard from '../GlowCard';

export default function SecuritySection() {
  const cards = [
    { icon: Key, title: 'Secure Authentication', desc: 'Powered by Supabase Auth for safe identity verification.' },
    { icon: Database, title: 'Row Level Security', desc: 'Database-level rules block unauthorized data access.' },
    { icon: Lock, title: 'Private Chat Access', desc: 'You can only view and message in chats you belong to.' },
    { icon: UserCheck, title: 'Protected Profiles', desc: 'Your personal data is protected by strict access rules.' },
    { icon: Server, title: 'Realtime Security', desc: 'Live message streams respect Row Level Security.' },
    { icon: ShieldCheck, title: 'End-to-End Encryption', desc: 'Planned / Coming Soon as an advanced security layer.', planned: true },
  ];

  return (
    <section id="security" className="py-12 md:py-16 px-4 lg:px-8 relative z-10 bg-surface/30 border-y border-white/5">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-4">Built for private conversations</h2>
            <p className="text-lg text-muted mb-6 leading-relaxed">
              Orvix is currently built with privacy-focused access rules and secure authentication. Users only see chats they are members of, and profiles and messages use protected access policies.
            </p>
            <p className="text-base text-gray-400 leading-relaxed border-l-2 border-primary pl-4">
              Full end-to-end encryption can be added as a future advanced security layer.
            </p>
          </motion.div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {cards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="h-full"
              >
                <GlowCard customSize glowColor="purple" className={`p-5 border ${card.planned ? 'bg-black/40 border-white/5 opacity-70' : 'bg-surface/50 border-white/10 hover:border-primary/30'} transition-all flex items-start space-x-4 h-full`}>
                  <div className={`mt-1 flex-shrink-0 ${card.planned ? 'text-gray-500' : 'text-primary'}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{card.title}</h4>
                    <p className="text-xs text-muted">{card.desc}</p>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
}
