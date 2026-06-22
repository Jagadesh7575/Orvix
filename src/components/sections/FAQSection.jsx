import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle } from 'lucide-react';
import GlowCard from '../GlowCard';

export default function FAQSection() {
  const faqs = [
    { q: "What is Orvix?", a: "Orvix is a private chat app experience designed for smooth personal conversations, theme customization, and a clean Android APK interface." },
    { q: "Is Orvix available as an APK?", a: "Yes. The Orvix website is built to preview the app experience and download the Android APK when it is available." },
    { q: "Can I preview themes before downloading?", a: "Yes. You can choose a theme and preview how Orvix looks across Login, Home, Chat, Settings, and Logout screens before downloading." },
    { q: "Are themes saved to my account?", a: "Yes. Inside the APK, your selected theme is saved per account so it can load again after logout, login, or app restart." },
    { q: "Does Orvix support typography customization?", a: "Yes. The APK includes typography customization so users can select fonts and apply them across the native app interface." },
    { q: "Is the website used for chatting?", a: "No. The website is only for marketing, theme preview, and APK download. Chatting happens inside the Orvix APK." },
    { q: "Is Orvix privacy focused?", a: "Yes. Orvix is designed around private chat access rules, protected profiles, and secure account-based app experiences." },
    { q: "Can I use Orvix on iPhone?", a: "Currently, Orvix is focused on the Android APK experience. iOS support can be planned later." }
  ];

  return (
    <section id="faq" className="py-20 md:py-28 px-4 lg:px-8 relative z-10 bg-black/40">
      <div className="max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-6">Frequently Asked Questions</h2>
          <p className="text-muted text-lg max-w-2xl mx-auto font-light">Everything you need to know about the Orvix private chat experience.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ faq, index }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="h-full"
    >
      <GlowCard customSize glowColor="blue" className="h-full bg-surface/30 backdrop-blur-xl border border-primary/20 hover:border-secondary/40 transition-colors shadow-[0_0_20px_rgba(124,58,237,0.05)] rounded-2xl overflow-hidden group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-5 flex items-start justify-between text-left focus:outline-none"
        >
          <div className="flex items-start space-x-4">
            <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center transition-colors ${isOpen ? 'bg-primary/20' : ''}`}>
              <MessageCircle className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-semibold text-white/90 group-hover:text-white transition-colors leading-relaxed tracking-wide">{faq.q}</span>
          </div>
          <div className="flex-shrink-0 ml-4 mt-1">
            <ChevronDown className={`w-5 h-5 text-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-secondary' : 'group-hover:text-white/70'}`} />
          </div>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="px-6 pb-6 pt-2 pl-[4.5rem] text-muted text-sm leading-relaxed font-light">
                {faq.a}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlowCard>
    </motion.div>
  );
}
