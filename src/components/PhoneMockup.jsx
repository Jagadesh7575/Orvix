import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Phone, MoreVertical, Plus, Mic, CheckCircle2, Shield, User, Settings as SettingsIcon, LogOut, Download, Eye, Layout, MessageSquare, Palette, Lock, Key, ArrowLeft } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';
import { useNavigate } from 'react-router-dom';

const previewTokens = {
  cyber_violet: {
    id: 'cyber_violet', name: 'Cyber Violet',
    mockupBackground: '#130F23', screenBackground: '#0D0A18',
    cardSurface: 'rgba(124, 58, 237, 0.08)', softSurface: 'rgba(124, 58, 237, 0.04)',
    strongSurface: 'rgba(124, 58, 237, 0.15)', primary: '#7C3AED', secondary: '#06B6D4',
    accent: '#A78BFA', text: '#FFFFFF', mutedText: '#9CA3AF',
    border: 'rgba(124, 58, 237, 0.3)', glow: '0 0 20px rgba(124, 58, 237, 0.4)',
    primaryGradient: 'linear-gradient(135deg, #7C3AED, #06B6D4)', secondaryGradient: 'linear-gradient(135deg, #4C1D95, #0891B2)',
    bubbleOutgoing: 'linear-gradient(135deg, #7C3AED, #06B6D4)', bubbleIncoming: 'rgba(124, 58, 237, 0.1)',
    inputSurface: 'rgba(0, 0, 0, 0.4)', badgeSurface: 'rgba(124, 58, 237, 0.2)',
  },
  royal_gold: {
    id: 'royal_gold', name: 'Royal Gold',
    mockupBackground: '#1A1610', screenBackground: '#14110C',
    cardSurface: 'rgba(212, 175, 55, 0.06)', softSurface: 'rgba(212, 175, 55, 0.03)',
    strongSurface: 'rgba(212, 175, 55, 0.12)', primary: '#D4AF37', secondary: '#FACC15',
    accent: '#FDE047', text: '#FFFBEB', mutedText: '#A19D94',
    border: 'rgba(212, 175, 55, 0.3)', glow: '0 0 20px rgba(212, 175, 55, 0.3)',
    primaryGradient: 'linear-gradient(135deg, #D4AF37, #B48E2D)', secondaryGradient: 'linear-gradient(135deg, #7A5E1A, #574212)',
    bubbleOutgoing: 'linear-gradient(135deg, #D4AF37, #B48E2D)', bubbleIncoming: 'rgba(212, 175, 55, 0.08)',
    inputSurface: 'rgba(0, 0, 0, 0.5)', badgeSurface: 'rgba(212, 175, 55, 0.15)',
  },
  heart_glow: {
    id: 'heart_glow', name: 'Heart Glow',
    mockupBackground: '#1F0B11', screenBackground: '#17080D',
    cardSurface: 'rgba(244, 63, 94, 0.08)', softSurface: 'rgba(244, 63, 94, 0.04)',
    strongSurface: 'rgba(244, 63, 94, 0.15)', primary: '#F43F5E', secondary: '#FB7185',
    accent: '#FDA4AF', text: '#FFF1F2', mutedText: '#F43F5E',
    border: 'rgba(244, 63, 94, 0.3)', glow: '0 0 20px rgba(244, 63, 94, 0.4)',
    primaryGradient: 'linear-gradient(135deg, #F43F5E, #E11D48)', secondaryGradient: 'linear-gradient(135deg, #9F1239, #881337)',
    bubbleOutgoing: 'linear-gradient(135deg, #F43F5E, #E11D48)', bubbleIncoming: 'rgba(244, 63, 94, 0.1)',
    inputSurface: 'rgba(0, 0, 0, 0.4)', badgeSurface: 'rgba(244, 63, 94, 0.2)',
  },
  lavender_glow: {
    id: 'lavender_glow', name: 'Lavender Dream',
    mockupBackground: '#1A1429', screenBackground: '#130E1F',
    cardSurface: 'rgba(167, 139, 250, 0.08)', softSurface: 'rgba(167, 139, 250, 0.04)',
    strongSurface: 'rgba(167, 139, 250, 0.15)', primary: '#A78BFA', secondary: '#D8B4FE',
    accent: '#E9D5FF', text: '#FAF5FF', mutedText: '#A78BFA',
    border: 'rgba(167, 139, 250, 0.3)', glow: '0 0 20px rgba(167, 139, 250, 0.4)',
    primaryGradient: 'linear-gradient(135deg, #A78BFA, #D8B4FE)', secondaryGradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
    bubbleOutgoing: 'linear-gradient(135deg, #A78BFA, #D8B4FE)', bubbleIncoming: 'rgba(167, 139, 250, 0.1)',
    inputSurface: 'rgba(0, 0, 0, 0.4)', badgeSurface: 'rgba(167, 139, 250, 0.2)',
  },
  ocean_blue: {
    id: 'ocean_blue', name: 'Ocean Pulse',
    mockupBackground: '#0A1A26', screenBackground: '#08141D',
    cardSurface: 'rgba(14, 165, 233, 0.08)', softSurface: 'rgba(14, 165, 233, 0.04)',
    strongSurface: 'rgba(14, 165, 233, 0.15)', primary: '#0EA5E9', secondary: '#38BDF8',
    accent: '#7DD3FC', text: '#F0F9FF', mutedText: '#0EA5E9',
    border: 'rgba(14, 165, 233, 0.3)', glow: '0 0 20px rgba(14, 165, 233, 0.4)',
    primaryGradient: 'linear-gradient(135deg, #0EA5E9, #0284C7)', secondaryGradient: 'linear-gradient(135deg, #0369A1, #075985)',
    bubbleOutgoing: 'linear-gradient(135deg, #0EA5E9, #0284C7)', bubbleIncoming: 'rgba(14, 165, 233, 0.1)',
    inputSurface: 'rgba(0, 0, 0, 0.4)', badgeSurface: 'rgba(14, 165, 233, 0.2)',
  },
  emerald_matrix: {
    id: 'emerald_matrix', name: 'Emerald Matrix',
    mockupBackground: '#092116', screenBackground: '#071A11',
    cardSurface: 'rgba(16, 185, 129, 0.08)', softSurface: 'rgba(16, 185, 129, 0.04)',
    strongSurface: 'rgba(16, 185, 129, 0.15)', primary: '#10B981', secondary: '#34D399',
    accent: '#6EE7B7', text: '#ECFDF5', mutedText: '#10B981',
    border: 'rgba(16, 185, 129, 0.3)', glow: '0 0 20px rgba(16, 185, 129, 0.4)',
    primaryGradient: 'linear-gradient(135deg, #10B981, #059669)', secondaryGradient: 'linear-gradient(135deg, #047857, #065F46)',
    bubbleOutgoing: 'linear-gradient(135deg, #10B981, #059669)', bubbleIncoming: 'rgba(16, 185, 129, 0.1)',
    inputSurface: 'rgba(0, 0, 0, 0.4)', badgeSurface: 'rgba(16, 185, 129, 0.2)',
  },
  crimson_phantom: {
    id: 'crimson_phantom', name: 'Crimson Phantom',
    mockupBackground: '#260B0B', screenBackground: '#1C0808',
    cardSurface: 'rgba(220, 38, 38, 0.08)', softSurface: 'rgba(220, 38, 38, 0.04)',
    strongSurface: 'rgba(220, 38, 38, 0.15)', primary: '#DC2626', secondary: '#EF4444',
    accent: '#F87171', text: '#FEF2F2', mutedText: '#DC2626',
    border: 'rgba(220, 38, 38, 0.3)', glow: '0 0 20px rgba(220, 38, 38, 0.4)',
    primaryGradient: 'linear-gradient(135deg, #DC2626, #B91C1C)', secondaryGradient: 'linear-gradient(135deg, #991B1B, #7F1D1D)',
    bubbleOutgoing: 'linear-gradient(135deg, #DC2626, #B91C1C)', bubbleIncoming: 'rgba(220, 38, 38, 0.1)',
    inputSurface: 'rgba(0, 0, 0, 0.4)', badgeSurface: 'rgba(220, 38, 38, 0.2)',
  },
  midnight_black: {
    id: 'midnight_black', name: 'Midnight AMOLED',
    mockupBackground: '#0A0A0A', screenBackground: '#050505',
    cardSurface: 'rgba(255, 255, 255, 0.03)', softSurface: 'rgba(255, 255, 255, 0.01)',
    strongSurface: 'rgba(255, 255, 255, 0.08)', primary: '#94A3B8', secondary: '#CBD5E1',
    accent: '#F1F5F9', text: '#FFFFFF', mutedText: '#64748B',
    border: 'rgba(255, 255, 255, 0.1)', glow: '0 0 20px rgba(255, 255, 255, 0.1)',
    primaryGradient: 'linear-gradient(135deg, #475569, #334155)', secondaryGradient: 'linear-gradient(135deg, #1E293B, #0F172A)',
    bubbleOutgoing: 'linear-gradient(135deg, #334155, #1E293B)', bubbleIncoming: 'rgba(255, 255, 255, 0.05)',
    inputSurface: 'rgba(255, 255, 255, 0.02)', badgeSurface: 'rgba(255, 255, 255, 0.05)',
  }
};

const screens = [
  { id: 'login', label: 'Login', icon: Key },
  { id: 'register', label: 'Register', icon: Shield },
  { id: 'dashboard', label: 'Dashboard', icon: Layout },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'themes', label: 'Themes', icon: Palette },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function PhoneMockup() {
  const [activeScreen, setActiveScreen] = useState('login');
  const [toastMessage, setToastMessage] = useState('');
  const { selectedThemeId } = useTheme();
  
  // Normalize theme for tokens
  const normalizedThemeId = selectedThemeId ? selectedThemeId.replaceAll("-", "_").toLowerCase() : 'cyber_violet';
  const token = previewTokens[normalizedThemeId] || previewTokens['cyber_violet'];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreen(curr => {
        const idx = screens.findIndex(s => s.id === curr);
        return screens[(idx + 1) % screens.length].id;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (token) {
      setToastMessage(`${token.name} applied`);
      const timer = setTimeout(() => setToastMessage(''), 2500);
      return () => clearTimeout(timer);
    }
  }, [token]);

  // Framer motion variants
  const pageVariants = {
    initial: { opacity: 0, scale: 0.96, filter: 'blur(4px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, scale: 1.04, filter: 'blur(4px)', transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };
  
  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.1 } }
  };
  
  const itemFade = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'login':
        return (
          <motion.div key="login" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col p-6 justify-center relative overflow-hidden" style={{ background: token.screenBackground }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px]" style={{ background: token.badgeSurface }} />
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="z-10 flex flex-col w-full h-full justify-center">
              <motion.div variants={itemFade} className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-2xl mx-auto" style={{ background: token.primaryGradient, boxShadow: token.glow }}>
                <Shield className="w-7 h-7 text-white" />
              </motion.div>
              <motion.h2 variants={itemFade} className="text-2xl font-bold font-heading text-center mb-1" style={{ color: token.text }}>Sign in to Orvix</motion.h2>
              <motion.p variants={itemFade} className="text-center text-xs mb-8 font-medium" style={{ color: token.mutedText }}>Enter your secure private space</motion.p>
              
              <motion.div variants={staggerContainer} className="space-y-3 w-full">
                <motion.div variants={itemFade} className="h-12 w-full rounded-xl border px-4 flex items-center shadow-inner" style={{ background: token.inputSurface, borderColor: token.border }}>
                  <User className="w-4 h-4 mr-3 opacity-50" style={{ color: token.mutedText }} />
                  <span className="text-xs" style={{ color: token.mutedText }}>Email Address</span>
                </motion.div>
                <motion.div variants={itemFade} className="h-12 w-full rounded-xl border px-4 flex items-center shadow-inner" style={{ background: token.inputSurface, borderColor: token.border }}>
                  <Lock className="w-4 h-4 mr-3 opacity-50" style={{ color: token.mutedText }} />
                  <span className="text-xs" style={{ color: token.mutedText }}>Password</span>
                </motion.div>
                <motion.div variants={itemFade} whileHover={{ scale: 1.02 }} className="h-12 w-full rounded-xl flex items-center justify-center mt-6 shadow-2xl" style={{ background: token.primaryGradient, boxShadow: token.glow }}>
                  <span className="text-sm font-bold text-white tracking-wide">Login</span>
                </motion.div>
                <motion.div variants={itemFade} className="text-center text-[10px] mt-4 font-bold" style={{ color: token.primary }}>
                  Create an account
                </motion.div>
                <motion.div variants={itemFade} className="flex justify-center items-center space-x-1 mt-8 opacity-70">
                  <Lock className="w-2.5 h-2.5" style={{ color: token.mutedText }} />
                  <span className="text-[8px]" style={{ color: token.mutedText }}>Protected by private access rules</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        );

      case 'register':
        return (
          <motion.div key="register" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col p-6 justify-center relative overflow-hidden" style={{ background: token.screenBackground }}>
            <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-[60px]" style={{ background: token.badgeSurface }} />
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="z-10 flex flex-col w-full">
              <motion.div variants={itemFade} className="mb-6 flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: token.cardSurface, border: `1px solid ${token.border}` }}>
                  <span className="font-heading font-bold text-lg" style={{ color: token.text }}>O</span>
                </div>
                <h2 className="text-xl font-bold font-heading text-center mb-1" style={{ color: token.text }}>Create Identity</h2>
                <div className="px-3 py-1 rounded-full text-[9px] font-bold mt-2" style={{ background: token.badgeSurface, color: token.primary, border: `1px solid ${token.border}` }}>
                  {token.name} will apply instantly
                </div>
              </motion.div>
              
              <motion.div variants={staggerContainer} className="space-y-3 w-full">
                <motion.div variants={itemFade} className="h-10 w-full rounded-xl border px-4 flex items-center" style={{ background: token.inputSurface, borderColor: token.border }}>
                  <span className="text-[10px]" style={{ color: token.mutedText }}>Full Name</span>
                </motion.div>
                <motion.div variants={itemFade} className="h-10 w-full rounded-xl border px-4 flex items-center" style={{ background: token.inputSurface, borderColor: token.border }}>
                  <span className="text-[10px]" style={{ color: token.mutedText }}>Username</span>
                </motion.div>
                <motion.div variants={itemFade} className="h-10 w-full rounded-xl border px-4 flex items-center" style={{ background: token.inputSurface, borderColor: token.border }}>
                  <span className="text-[10px]" style={{ color: token.mutedText }}>Password</span>
                </motion.div>
                <motion.div variants={itemFade} className="h-12 w-full rounded-xl flex items-center justify-center mt-4 shadow-xl" style={{ background: token.primaryGradient, boxShadow: token.glow }}>
                  <span className="text-xs font-bold text-white tracking-wide">Register Securely</span>
                </motion.div>
                <motion.div variants={itemFade} className="text-center text-[10px] mt-4 font-bold" style={{ color: token.mutedText }}>
                  Already have an identity? <span style={{ color: token.primary }}>Login</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        );

      case 'dashboard':
        return (
          <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col" style={{ background: token.screenBackground }}>
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex-1 flex flex-col">
              <div className="p-5 border-b" style={{ background: token.secondaryGradient, borderColor: token.border }}>
                <div className="flex justify-between items-center mb-6">
                  <motion.div variants={itemFade} className="text-lg font-heading font-bold text-white tracking-widest">ORVIX</motion.div>
                  <motion.div variants={itemFade} className="flex space-x-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.2)' }}><Search className="w-4 h-4"/></div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.2)' }}><SettingsIcon className="w-4 h-4"/></div>
                  </motion.div>
                </div>
                <motion.div variants={itemFade} className="flex items-center space-x-4 mb-6 bg-black/20 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 relative" style={{ background: token.mockupBackground, borderColor: token.primary, color: token.text }}>
                    OU
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" style={{ background: '#22c55e', borderColor: token.screenBackground }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Orvix User</div>
                    <div className="text-[10px] font-medium" style={{ color: token.accent }}>@orvix_user</div>
                  </div>
                </motion.div>
                <motion.div variants={itemFade} className="grid grid-cols-3 gap-2">
                  <div className="py-2 rounded-xl flex flex-col items-center justify-center border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-white font-bold text-sm">12</span>
                    <span className="text-[8px] uppercase tracking-wider text-white/60">Chats</span>
                  </div>
                  <div className="py-2 rounded-xl flex flex-col items-center justify-center border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-white font-bold text-sm">5</span>
                    <span className="text-[8px] uppercase tracking-wider text-white/60">Online</span>
                  </div>
                  <div className="py-2 rounded-xl flex flex-col items-center justify-center border" style={{ background: token.primaryGradient, borderColor: token.border, boxShadow: token.glow }}>
                    <span className="text-white font-bold text-[9px] text-center leading-tight mb-0.5 px-1 truncate w-full">{token.name}</span>
                    <span className="text-[7px] uppercase tracking-wider text-white/80 font-bold">Active</span>
                  </div>
                </motion.div>
              </div>
              <div className="p-4 flex-1">
                <motion.div variants={itemFade} className="h-10 rounded-xl flex items-center px-4 mb-4 border" style={{ background: token.inputSurface, borderColor: token.border }}>
                  <Search className="w-3 h-3 mr-3" style={{ color: token.primary }} />
                  <span className="text-[10px]" style={{ color: token.mutedText }}>Search users...</span>
                </motion.div>
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <motion.div key={i} variants={itemFade} className={`p-3 rounded-2xl flex items-center space-x-3 border ${i===1 ? 'relative overflow-hidden' : ''}`} style={{ background: i===1 ? token.strongSurface : token.softSurface, borderColor: i===1 ? token.primary : token.border, boxShadow: i===1 ? token.glow : 'none' }}>
                      {i===1 && <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: token.primary }} />}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: i===1 ? token.bubbleOutgoing : token.mockupBackground, color: i===1 ? '#fff' : token.mutedText }}>{i===1 ? 'AM' : 'MR'}</div>
                      <div className="flex-1">
                        <div className="text-xs font-bold" style={{ color: token.text }}>{i===1 ? 'Alex Morgan' : 'Maya Rose'}</div>
                        <div className="text-[10px]" style={{ color: i===1 ? token.primary : token.mutedText }}>{i===1 ? 'Ready for the private chat?' : 'Sent a photo'}</div>
                      </div>
                      <div className="text-[9px] font-bold" style={{ color: i===1 ? token.primary : token.mutedText }}>{i===1 ? 'Now' : '10m'}</div>
                    </motion.div>
                  ))}
                </div>
                <motion.div variants={itemFade} className="text-center mt-6">
                  <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: token.mutedText }}>Private one-to-one chats</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 'chat':
        return (
          <motion.div key="chat" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col" style={{ background: token.screenBackground }}>
            <div className="p-3 border-b flex items-center justify-between" style={{ background: token.softSurface, borderColor: token.border }}>
              <div className="flex items-center space-x-3">
                <ArrowLeft className="w-4 h-4" style={{ color: token.primary }} />
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: token.bubbleOutgoing, color: '#fff' }}>AM</div>
                <div>
                  <div className="text-xs font-bold" style={{ color: token.text }}>Alex Morgan</div>
                  <div className="text-[9px] font-medium" style={{ color: token.primary }}>@alex_m • Online</div>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full border flex items-center justify-center" style={{ borderColor: token.border, background: token.softSurface }}>
                <Lock className="w-3 h-3" style={{ color: token.primary }} />
              </div>
            </div>
            
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex-1 p-4 flex flex-col space-y-4 overflow-hidden">
              <motion.div variants={itemFade} className="self-center px-3 py-1 rounded-full border flex items-center space-x-1.5" style={{ background: token.badgeSurface, borderColor: token.primary }}>
                <Lock className="w-2.5 h-2.5" style={{ color: token.primary }} />
                <span className="text-[8px] font-bold" style={{ color: token.primary }}>End-to-End Encrypted</span>
              </motion.div>
              <motion.div variants={itemFade} className="self-end p-3 rounded-2xl rounded-tr-sm max-w-[85%] text-[11px] text-white shadow-lg" style={{ background: token.bubbleOutgoing, boxShadow: token.glow }}>
                This is a realistic chat view!
                <div className="text-[7px] text-white/70 mt-1 text-right">12:30 PM</div>
              </motion.div>
              <motion.div variants={itemFade} className="self-start p-3 rounded-2xl rounded-tl-sm max-w-[85%] text-[11px] border" style={{ background: token.bubbleIncoming, borderColor: token.border, color: token.text }}>
                The colors sync flawlessly.
                <div className="text-[7px] mt-1 opacity-50" style={{ color: token.text }}>12:31 PM</div>
              </motion.div>
              <motion.div variants={itemFade} className="self-end p-3 rounded-2xl rounded-tr-sm max-w-[85%] text-[11px] text-white shadow-lg" style={{ background: token.bubbleOutgoing, boxShadow: token.glow }}>
                Exactly. It feels so premium.
                <div className="text-[7px] text-white/70 mt-1 text-right flex justify-end items-center"><CheckCircle2 className="w-2 h-2 mr-0.5"/> 12:32 PM</div>
              </motion.div>
              <motion.div variants={itemFade} className="flex items-center space-x-1 mt-2 ml-1">
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 rounded-full" style={{ background: token.primary }} />
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full" style={{ background: token.primary }} />
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full" style={{ background: token.primary }} />
              </motion.div>
            </motion.div>
            
            <div className="p-3 border-t flex items-center space-x-2" style={{ background: token.softSurface, borderColor: token.border }}>
              <div className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ background: token.screenBackground, borderColor: token.border }}>
                <Plus className="w-4 h-4" style={{ color: token.mutedText }} />
              </div>
              <div className="flex-1 h-9 rounded-full border px-3 flex items-center" style={{ background: token.inputSurface, borderColor: token.border }}>
                <span className="text-[10px]" style={{ color: token.mutedText }}>Type a private message|</span>
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: token.primaryGradient, boxShadow: token.glow }}>
                <Mic className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        );

      case 'settings':
        return (
          <motion.div key="settings" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col p-5" style={{ background: token.screenBackground }}>
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex-1">
              <motion.div variants={itemFade} className="flex items-center space-x-4 mb-8 p-4 rounded-2xl border" style={{ background: token.softSurface, borderColor: token.border }}>
                <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-lg font-bold" style={{ borderColor: token.primary, background: token.mockupBackground, color: token.primary }}>
                  OU
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: token.text }}>Orvix User</div>
                  <div className="text-[10px] font-medium" style={{ color: token.mutedText }}>hello@orvix.app</div>
                </div>
              </motion.div>
              
              <div className="space-y-3">
                <motion.div variants={itemFade} className="p-4 rounded-xl border flex items-center justify-between" style={{ background: token.softSurface, borderColor: token.border }}>
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4" style={{ color: token.mutedText }} />
                    <span className="text-xs font-medium" style={{ color: token.text }}>Edit Profile</span>
                  </div>
                </motion.div>
                
                <motion.div variants={itemFade} className="p-4 rounded-xl border flex items-center justify-between" style={{ background: token.strongSurface, borderColor: token.primary, boxShadow: token.glow }}>
                  <div className="flex items-center space-x-3">
                    <Palette className="w-4 h-4" style={{ color: token.primary }} />
                    <span className="text-xs font-bold" style={{ color: token.primary }}>Theme Settings</span>
                  </div>
                  <div className="px-2 py-1 rounded-full text-[9px] font-bold" style={{ background: token.badgeSurface, color: token.primary }}>
                    {token.name}
                  </div>
                </motion.div>
                
                <motion.div variants={itemFade} className="p-4 rounded-xl border flex items-center justify-between" style={{ background: token.softSurface, borderColor: token.border }}>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-4 h-4" style={{ color: token.mutedText }} />
                    <span className="text-xs font-medium" style={{ color: token.text }}>Privacy & Security</span>
                  </div>
                </motion.div>

                <motion.div variants={itemFade} className="p-4 rounded-xl border flex items-center justify-between mt-8" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
                  <div className="flex items-center space-x-3 text-red-500">
                    <LogOut className="w-4 h-4" />
                    <span className="text-xs font-medium">Logout Securely</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        );

      case 'themes':
        return (
          <motion.div key="themes" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex flex-col p-5 relative overflow-hidden" style={{ background: token.screenBackground }}>
            <div className="absolute top-1/4 right-0 w-40 h-40 rounded-full blur-[80px]" style={{ background: token.badgeSurface }} />
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="z-10 h-full flex flex-col">
              <motion.h3 variants={itemFade} className="text-xs font-bold mb-6 flex items-center" style={{ color: token.text }}><Palette className="w-4 h-4 mr-2" style={{ color: token.primary }}/> Theme Settings</motion.h3>
              <div className="flex-1 flex flex-col space-y-4">
                <motion.div variants={itemFade} className="p-4 rounded-2xl border relative overflow-hidden" style={{ background: token.cardSurface, borderColor: token.primary, boxShadow: token.glow }}>
                  <div className="absolute top-0 right-0 w-24 h-24 blur-2xl rounded-full" style={{ background: token.badgeSurface }} />
                  <div className="text-[10px] font-bold mb-1" style={{ color: token.text }}>Active Theme</div>
                  <div className="text-lg font-bold font-heading" style={{ color: token.primary }}>{token.name}</div>
                  <div className="flex space-x-2 mt-4">
                    <div className="w-6 h-6 rounded-full" style={{ background: token.primary }} />
                    <div className="w-6 h-6 rounded-full" style={{ background: token.secondary }} />
                    <div className="w-6 h-6 rounded-full" style={{ background: token.accent }} />
                  </div>
                </motion.div>
                <motion.div variants={itemFade} className="grid grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-16 rounded-xl border flex flex-col items-center justify-center space-y-1" style={{ background: i===1 ? token.strongSurface : token.softSurface, borderColor: i===1 ? token.primary : token.border, boxShadow: i===1 ? token.glow : 'none' }}>
                      <div className="flex space-x-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: i===1 ? token.primary : '#4B5563' }} />
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: i===1 ? token.secondary : '#374151' }} />
                      </div>
                      <div className="text-[9px] font-medium" style={{ color: i===1 ? token.text : token.mutedText }}>{i===1 ? token.name : `Theme ${i+1}`}</div>
                    </div>
                  ))}
                </motion.div>
                <motion.div variants={itemFade} className="mt-auto pt-4 text-center text-[10px] font-bold" style={{ color: token.primary }}>
                  This vibe applies across your full Orvix app.
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        );

      default: return null;
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Premium Floating Badges */}
      <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="hidden sm:flex absolute -left-24 top-[15%] px-4 py-2.5 rounded-2xl border shadow-xl z-20 items-center space-x-2 backdrop-blur-xl" style={{ background: 'rgba(10,10,15,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="w-2 h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" style={{ background: '#38bdf8' }} />
        <span className="text-xs text-white font-bold tracking-wide">Realtime Chat</span>
      </motion.div>
      <motion.div animate={{ y: [10, -10, 10] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="hidden sm:flex absolute -right-28 top-[35%] px-4 py-2.5 rounded-2xl border shadow-xl z-20 items-center space-x-2 backdrop-blur-xl" style={{ background: 'rgba(10,10,15,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>
        <Shield className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
        <span className="text-xs text-white font-bold tracking-wide">Private & Secure</span>
      </motion.div>
      <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="hidden sm:flex absolute -left-20 bottom-[30%] px-4 py-2.5 rounded-2xl border shadow-xl z-20 items-center space-x-2 backdrop-blur-xl" style={{ background: 'rgba(10,10,15,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>
        <Palette className="w-3.5 h-3.5" style={{ color: '#f43f5e' }} />
        <span className="text-xs text-white font-bold tracking-wide">Premium UI</span>
      </motion.div>

      {/* Interactive Tabs */}
      <div className="flex w-full max-w-[340px] overflow-x-auto hide-scrollbar space-x-2 mb-8 pb-2 justify-start sm:justify-center px-4 sm:px-0">
        {screens.map(screen => {
          const isActive = activeScreen === screen.id;
          const Icon = screen.icon;
          return (
            <button
              key={screen.id}
              onClick={() => setActiveScreen(screen.id)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 border"
              style={{
                background: isActive ? token.strongSurface : 'rgba(255,255,255,0.03)',
                borderColor: isActive ? token.primary : 'rgba(255,255,255,0.05)',
                color: isActive ? token.text : '#9CA3AF',
                boxShadow: isActive ? token.glow : 'none'
              }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: isActive ? token.primary : '#9CA3AF' }} />
              <span className="text-[11px] font-bold tracking-wide">{screen.label}</span>
            </button>
          );
        })}
      </div>

      {/* Realistic Cinematic Hardware Mockup */}
      <motion.div 
        animate={{ y: [-5, 5, -5] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-[300px] sm:w-[340px] h-[620px] sm:h-[700px] rounded-[3.5rem] border-[12px] bg-black overflow-hidden flex flex-col z-10 transition-colors duration-500 shadow-2xl"
        style={{ borderColor: '#111', boxShadow: `0 30px 60px -12px rgba(0,0,0,0.8), ${token.glow}` }}
      >
        {/* Device Edge Highlights */}
        <div className="absolute inset-0 rounded-[2.8rem] border border-white/10 pointer-events-none z-50 mix-blend-overlay" />
        <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-50" />
        
        {/* Internal Screen Shadow / Depth */}
        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] z-40 pointer-events-none" />

        {/* Dynamic Glow reflection */}
        <div className="absolute -inset-10 blur-[100px] z-0 pointer-events-none opacity-40 transition-colors duration-700" style={{ background: token.primary }} />
        
        {/* Notch / Camera Island */}
        <div className="absolute top-2 inset-x-0 h-7 bg-black rounded-full w-[120px] mx-auto z-50 flex items-center justify-center space-x-3 shadow-md border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0a0a0a', boxShadow: 'inset 0 0 2px rgba(255,255,255,0.2)' }} />
          <div className="w-2.5 h-2.5 rounded-full relative overflow-hidden" style={{ background: '#050510' }}>
             <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-blue-400/40 rounded-full blur-[1px]" />
          </div>
        </div>

        {/* Screen Content Container */}
        <div className="relative flex-1 w-full h-full overflow-hidden bg-black transition-colors duration-500">
          <AnimatePresence mode="wait">
            {renderScreen()}
          </AnimatePresence>

          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 backdrop-blur-xl border text-white text-[10px] font-bold py-2 px-4 rounded-full flex items-center space-x-2 whitespace-nowrap z-50"
                style={{ background: token.strongSurface, borderColor: token.primary, boxShadow: token.glow }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: token.primary }} />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Caption below phone */}
      <div className="mt-8 text-center px-4 w-full max-w-md">
        <p className="text-xs font-medium text-gray-400">
          Live app preview — your selected theme follows you into Orvix.
        </p>
      </div>
    </div>
  );
}
