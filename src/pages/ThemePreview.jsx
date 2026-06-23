import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Search, Phone, MoreVertical, Plus, Mic, 
  Settings as SettingsIcon, User, Shield, Layout, Palette, Download, Lock, MessageSquare
} from 'lucide-react';

const previewTokens = {
  cyber_violet: {
    id: 'cyber_violet',
    name: 'Cyber Violet',
    previewPageBackground: '#0B0914',
    previewHeroGlow: 'radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.25) 0%, transparent 60%)',
    mockupBackground: '#130F23',
    screenBackground: '#0D0A18',
    cardSurface: 'rgba(124, 58, 237, 0.08)',
    softSurface: 'rgba(124, 58, 237, 0.04)',
    strongSurface: 'rgba(124, 58, 237, 0.15)',
    primary: '#7C3AED',
    secondary: '#06B6D4',
    accent: '#A78BFA',
    text: '#FFFFFF',
    mutedText: '#9CA3AF',
    border: 'rgba(124, 58, 237, 0.3)',
    glow: '0 0 20px rgba(124, 58, 237, 0.4)',
    primaryGradient: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
    secondaryGradient: 'linear-gradient(135deg, #4C1D95, #0891B2)',
    bubbleOutgoing: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
    bubbleIncoming: 'rgba(124, 58, 237, 0.1)',
    inputSurface: 'rgba(0, 0, 0, 0.4)',
    badgeSurface: 'rgba(124, 58, 237, 0.2)',
    patternOverlay: 'none'
  },
  royal_gold: {
    id: 'royal_gold',
    name: 'Royal Gold',
    previewPageBackground: '#120F0A',
    previewHeroGlow: 'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.2) 0%, transparent 60%)',
    mockupBackground: '#1A1610',
    screenBackground: '#14110C',
    cardSurface: 'rgba(212, 175, 55, 0.06)',
    softSurface: 'rgba(212, 175, 55, 0.03)',
    strongSurface: 'rgba(212, 175, 55, 0.12)',
    primary: '#D4AF37',
    secondary: '#FACC15',
    accent: '#FDE047',
    text: '#FFFBEB',
    mutedText: '#A19D94',
    border: 'rgba(212, 175, 55, 0.3)',
    glow: '0 0 20px rgba(212, 175, 55, 0.3)',
    primaryGradient: 'linear-gradient(135deg, #D4AF37, #B48E2D)',
    secondaryGradient: 'linear-gradient(135deg, #7A5E1A, #574212)',
    bubbleOutgoing: 'linear-gradient(135deg, #D4AF37, #B48E2D)',
    bubbleIncoming: 'rgba(212, 175, 55, 0.08)',
    inputSurface: 'rgba(0, 0, 0, 0.5)',
    badgeSurface: 'rgba(212, 175, 55, 0.15)',
    patternOverlay: 'none'
  },
  heart_glow: {
    id: 'heart_glow',
    name: 'Heart Glow',
    previewPageBackground: '#14080B',
    previewHeroGlow: 'radial-gradient(circle at 50% 0%, rgba(244, 63, 94, 0.25) 0%, transparent 60%)',
    mockupBackground: '#1F0B11',
    screenBackground: '#17080D',
    cardSurface: 'rgba(244, 63, 94, 0.08)',
    softSurface: 'rgba(244, 63, 94, 0.04)',
    strongSurface: 'rgba(244, 63, 94, 0.15)',
    primary: '#F43F5E',
    secondary: '#FB7185',
    accent: '#FDA4AF',
    text: '#FFF1F2',
    mutedText: '#F43F5E',
    border: 'rgba(244, 63, 94, 0.3)',
    glow: '0 0 20px rgba(244, 63, 94, 0.4)',
    primaryGradient: 'linear-gradient(135deg, #F43F5E, #E11D48)',
    secondaryGradient: 'linear-gradient(135deg, #9F1239, #881337)',
    bubbleOutgoing: 'linear-gradient(135deg, #F43F5E, #E11D48)',
    bubbleIncoming: 'rgba(244, 63, 94, 0.1)',
    inputSurface: 'rgba(0, 0, 0, 0.4)',
    badgeSurface: 'rgba(244, 63, 94, 0.2)',
    patternOverlay: 'none'
  },
  lavender_glow: {
    id: 'lavender_glow',
    name: 'Lavender Dream',
    previewPageBackground: '#110D1A',
    previewHeroGlow: 'radial-gradient(circle at 50% 0%, rgba(167, 139, 250, 0.25) 0%, transparent 60%)',
    mockupBackground: '#1A1429',
    screenBackground: '#130E1F',
    cardSurface: 'rgba(167, 139, 250, 0.08)',
    softSurface: 'rgba(167, 139, 250, 0.04)',
    strongSurface: 'rgba(167, 139, 250, 0.15)',
    primary: '#A78BFA',
    secondary: '#D8B4FE',
    accent: '#E9D5FF',
    text: '#FAF5FF',
    mutedText: '#A78BFA',
    border: 'rgba(167, 139, 250, 0.3)',
    glow: '0 0 20px rgba(167, 139, 250, 0.4)',
    primaryGradient: 'linear-gradient(135deg, #A78BFA, #D8B4FE)',
    secondaryGradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
    bubbleOutgoing: 'linear-gradient(135deg, #A78BFA, #D8B4FE)',
    bubbleIncoming: 'rgba(167, 139, 250, 0.1)',
    inputSurface: 'rgba(0, 0, 0, 0.4)',
    badgeSurface: 'rgba(167, 139, 250, 0.2)',
    patternOverlay: 'none'
  },
  ocean_blue: {
    id: 'ocean_blue',
    name: 'Ocean Pulse',
    previewPageBackground: '#061017',
    previewHeroGlow: 'radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.25) 0%, transparent 60%)',
    mockupBackground: '#0A1A26',
    screenBackground: '#08141D',
    cardSurface: 'rgba(14, 165, 233, 0.08)',
    softSurface: 'rgba(14, 165, 233, 0.04)',
    strongSurface: 'rgba(14, 165, 233, 0.15)',
    primary: '#0EA5E9',
    secondary: '#38BDF8',
    accent: '#7DD3FC',
    text: '#F0F9FF',
    mutedText: '#0EA5E9',
    border: 'rgba(14, 165, 233, 0.3)',
    glow: '0 0 20px rgba(14, 165, 233, 0.4)',
    primaryGradient: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
    secondaryGradient: 'linear-gradient(135deg, #0369A1, #075985)',
    bubbleOutgoing: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
    bubbleIncoming: 'rgba(14, 165, 233, 0.1)',
    inputSurface: 'rgba(0, 0, 0, 0.4)',
    badgeSurface: 'rgba(14, 165, 233, 0.2)',
    patternOverlay: 'none'
  },
  emerald_matrix: {
    id: 'emerald_matrix',
    name: 'Emerald Matrix',
    previewPageBackground: '#05140D',
    previewHeroGlow: 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.2) 0%, transparent 60%)',
    mockupBackground: '#092116',
    screenBackground: '#071A11',
    cardSurface: 'rgba(16, 185, 129, 0.08)',
    softSurface: 'rgba(16, 185, 129, 0.04)',
    strongSurface: 'rgba(16, 185, 129, 0.15)',
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#6EE7B7',
    text: '#ECFDF5',
    mutedText: '#10B981',
    border: 'rgba(16, 185, 129, 0.3)',
    glow: '0 0 20px rgba(16, 185, 129, 0.4)',
    primaryGradient: 'linear-gradient(135deg, #10B981, #059669)',
    secondaryGradient: 'linear-gradient(135deg, #047857, #065F46)',
    bubbleOutgoing: 'linear-gradient(135deg, #10B981, #059669)',
    bubbleIncoming: 'rgba(16, 185, 129, 0.1)',
    inputSurface: 'rgba(0, 0, 0, 0.4)',
    badgeSurface: 'rgba(16, 185, 129, 0.2)',
    patternOverlay: 'radial-gradient(rgba(16,185,129,0.1) 1px, transparent 1px) 0 0 / 20px 20px'
  },
  sunset_neon: {
    id: 'sunset_neon',
    name: 'Sunset Neon',
    previewPageBackground: '#1a0b12',
    previewHeroGlow: 'radial-gradient(circle at 50% 0%, rgba(249, 115, 22, 0.25) 0%, transparent 60%)',
    mockupBackground: '#431407',
    screenBackground: '#4c0519',
    cardSurface: 'rgba(249, 115, 22, 0.08)',
    softSurface: 'rgba(249, 115, 22, 0.04)',
    strongSurface: 'rgba(249, 115, 22, 0.15)',
    primary: '#F97316',
    secondary: '#E11D48',
    accent: '#F43F5E',
    text: '#FFF7ED',
    mutedText: '#FDBA74',
    border: 'rgba(249, 115, 22, 0.3)',
    glow: '0 0 20px rgba(249, 115, 22, 0.4)',
    primaryGradient: 'linear-gradient(135deg, #EA580C, #E11D48)',
    secondaryGradient: 'linear-gradient(135deg, #C2410C, #BE123C)',
    bubbleOutgoing: 'linear-gradient(135deg, #C2410C, #BE123C)',
    bubbleIncoming: 'rgba(255, 255, 255, 0.1)',
    inputSurface: 'rgba(0, 0, 0, 0.4)',
    badgeSurface: 'rgba(249, 115, 22, 0.2)',
    patternOverlay: 'none'
  },
  arctic_frost: {
    id: 'arctic_frost',
    name: 'Arctic Frost',
    previewPageBackground: '#0F172A',
    previewHeroGlow: 'radial-gradient(circle at 50% 0%, rgba(226, 232, 240, 0.15) 0%, transparent 60%)',
    mockupBackground: '#1E293B',
    screenBackground: '#0B1120',
    cardSurface: 'rgba(226, 232, 240, 0.03)',
    softSurface: 'rgba(226, 232, 240, 0.01)',
    strongSurface: 'rgba(226, 232, 240, 0.08)',
    primary: '#E2E8F0',
    secondary: '#94A3B8',
    accent: '#38BDF8',
    text: '#F8FAFC',
    mutedText: '#94A3B8',
    border: 'rgba(226, 232, 240, 0.1)',
    glow: '0 0 20px rgba(226, 232, 240, 0.1)',
    primaryGradient: 'linear-gradient(135deg, #CBD5E1, #E2E8F0)',
    secondaryGradient: 'linear-gradient(135deg, #94A3B8, #CBD5E1)',
    bubbleOutgoing: 'linear-gradient(135deg, #94A3B8, #CBD5E1)',
    bubbleIncoming: 'rgba(255, 255, 255, 0.05)',
    inputSurface: 'rgba(255, 255, 255, 0.02)',
    badgeSurface: 'rgba(255, 255, 255, 0.05)',
    patternOverlay: 'none'
  }
};

export default function ThemePreview() {
  const { themeId } = useParams();
  const navigate = useNavigate();

  // Normalize ID: cyber-violet -> cyber_violet
  const normalizedThemeId = themeId ? themeId.replaceAll("-", "_").toLowerCase() : "";
  const token = previewTokens[normalizedThemeId] || previewTokens['cyber_violet'];
  
  const [isValidTheme, setIsValidTheme] = useState(true);

  useEffect(() => {
    if (!previewTokens[normalizedThemeId]) {
      setIsValidTheme(false);
    } else {
      setIsValidTheme(true);
    }
    window.scrollTo(0, 0);
  }, [normalizedThemeId]);

  if (!isValidTheme) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-4">
        <h1 className="text-4xl font-bold mb-4">Theme not found</h1>
        <p className="text-gray-400 mb-8 text-center max-w-md">
          The theme you are looking for doesn't exist or was removed.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
        >
          Back to Themes
        </button>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full relative overflow-x-hidden font-sans"
      style={{ 
        background: token.previewPageBackground,
        color: token.text
      }}
    >
      {/* Background Glow */}
      <div 
        className="absolute top-0 left-0 right-0 h-[800px] pointer-events-none"
        style={{ background: token.previewHeroGlow }}
      />
      {token.patternOverlay !== 'none' && (
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: token.patternOverlay }}
        />
      )}

      {/* Header */}
      <header className="relative z-10 p-6 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 px-4 py-2 rounded-full transition-all hover:scale-105"
          style={{ background: token.softSurface, border: `1px solid ${token.border}`, color: token.text }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Themes</span>
        </button>
        
        <a 
          href="/downloads/orvix-v7.apk"
          download
          className="flex items-center space-x-2 px-5 py-2 rounded-full text-sm font-bold shadow-lg transition-transform hover:scale-105"
          style={{ background: token.primaryGradient, color: '#fff', boxShadow: token.glow }}
        >
          <Download className="w-4 h-4" />
          <span>Download APK</span>
        </a>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-16 pb-12 sm:pt-24 flex flex-col items-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-6xl font-bold font-display tracking-tight mb-4" style={{ color: token.text }}>
            {token.name} <span style={{ color: token.primary }}>Vibe</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: token.mutedText }}>
            Live preview of the full Orvix experience with {token.name} applied across the dashboard, chat, and settings.
          </p>
        </motion.div>

        {/* Mockups Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl">
          
          {/* 1. Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[2.5rem] p-4 flex flex-col relative overflow-hidden"
            style={{ background: token.cardSurface, border: `1px solid ${token.border}`, boxShadow: token.glow }}
          >
            <div className="flex items-center mb-4 space-x-2 ml-2">
              <Layout className="w-5 h-5" style={{ color: token.primary }} />
              <h2 className="text-lg font-bold">Dashboard Preview</h2>
            </div>
            
            <div className="flex-1 rounded-[2rem] overflow-hidden flex flex-col border" style={{ background: token.screenBackground, borderColor: token.border }}>
              <div className="p-5 border-b" style={{ background: token.secondaryGradient, borderColor: token.border }}>
                <div className="flex justify-between items-center mb-6">
                  <div className="text-xl font-display font-bold text-white tracking-widest">ORVIX</div>
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.2)' }}><Plus className="w-4 h-4"/></div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-2 relative" style={{ background: token.mockupBackground, borderColor: token.primary, color: token.text }}>
                    OU
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" style={{ background: '#22c55e', borderColor: token.screenBackground }} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">Orvix User</div>
                    <div className="text-sm opacity-80" style={{ color: token.accent }}>@orvix_user</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl flex flex-col items-center justify-center border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-white font-bold text-lg">12</span>
                    <span className="text-[9px] uppercase tracking-wider text-white/60">Chats</span>
                  </div>
                  <div className="p-3 rounded-xl flex flex-col items-center justify-center border" style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <span className="text-white font-bold text-lg">5</span>
                    <span className="text-[9px] uppercase tracking-wider text-white/60">Online</span>
                  </div>
                  <div className="p-3 rounded-xl flex flex-col items-center justify-center border" style={{ background: token.primaryGradient, borderColor: token.border, boxShadow: token.glow }}>
                    <span className="text-white font-bold text-[10px] text-center leading-tight mb-1">{token.name}</span>
                    <span className="text-[8px] uppercase tracking-wider text-white/80 font-bold">Active Theme</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 flex-1">
                <div className="h-10 rounded-xl flex items-center px-4 mb-4 border" style={{ background: token.inputSurface, borderColor: token.border }}>
                  <Search className="w-4 h-4 mr-3" style={{ color: token.primary }} />
                  <span className="text-sm" style={{ color: token.mutedText }}>Search users...</span>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl flex items-center space-x-3 border relative overflow-hidden" style={{ background: token.strongSurface, borderColor: token.primary, boxShadow: token.glow }}>
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: token.primary }} />
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: token.bubbleOutgoing, color: '#fff' }}>AM</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold" style={{ color: token.text }}>Alex Morgan</div>
                      <div className="text-xs" style={{ color: token.primary }}>Ready for the private chat?</div>
                    </div>
                    <div className="text-[10px] font-bold" style={{ color: token.primary }}>Now</div>
                  </div>
                  
                  <div className="p-3 rounded-2xl flex items-center space-x-3 border" style={{ background: token.softSurface, borderColor: token.border }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: token.mockupBackground, color: token.mutedText }}>MR</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold" style={{ color: token.text }}>Maya Rose</div>
                      <div className="text-xs" style={{ color: token.mutedText }}>Sent a photo</div>
                    </div>
                    <div className="text-[10px]" style={{ color: token.mutedText }}>10m</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 2. Chat Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[2.5rem] p-4 flex flex-col relative overflow-hidden"
            style={{ background: token.cardSurface, border: `1px solid ${token.border}`, boxShadow: token.glow }}
          >
            <div className="flex items-center mb-4 space-x-2 ml-2">
              <MessageSquare className="w-5 h-5" style={{ color: token.primary }} />
              <h2 className="text-lg font-bold">Chat Preview</h2>
            </div>
            
            <div className="flex-1 rounded-[2rem] overflow-hidden flex flex-col border" style={{ background: token.screenBackground, borderColor: token.border }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ background: token.softSurface, borderColor: token.border }}>
                <div className="flex items-center space-x-3">
                  <ArrowLeft className="w-5 h-5" style={{ color: token.primary }} />
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: token.bubbleOutgoing, color: '#fff' }}>AM</div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: token.text }}>Alex Morgan</div>
                    <div className="text-xs font-medium" style={{ color: token.primary }}>@alex_m • Online</div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: token.border, background: token.softSurface }}>
                  <Lock className="w-4 h-4" style={{ color: token.primary }} />
                </div>
              </div>
              
              <div className="flex-1 p-4 flex flex-col space-y-4">
                <div className="self-center px-4 py-1 rounded-full border flex items-center space-x-2" style={{ background: token.badgeSurface, borderColor: token.primary }}>
                  <Lock className="w-3 h-3" style={{ color: token.primary }} />
                  <span className="text-[10px] font-bold" style={{ color: token.primary }}>End-to-End Encrypted</span>
                </div>
                
                <div className="self-end p-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm text-white" style={{ background: token.bubbleOutgoing, boxShadow: token.glow }}>
                  Yes, this vibe feels perfect for private chats.
                </div>
                
                <div className="self-start p-3 rounded-2xl rounded-tl-sm max-w-[80%] text-sm border" style={{ background: token.bubbleIncoming, borderColor: token.border, color: token.text }}>
                  The colors change everywhere?
                </div>
                
                <div className="self-end p-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm text-white" style={{ background: token.bubbleOutgoing, boxShadow: token.glow }}>
                  Exactly — dashboard, chat, login, and settings.
                </div>
                
                <div className="flex items-center space-x-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: token.primary }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce delay-100" style={{ background: token.primary }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce delay-200" style={{ background: token.primary }} />
                  <span className="text-[10px] ml-2" style={{ color: token.primary }}>Alex is typing...</span>
                </div>
              </div>
              
              <div className="p-3 border-t flex items-center space-x-2" style={{ background: token.softSurface, borderColor: token.border }}>
                <div className="w-10 h-10 rounded-full border flex items-center justify-center" style={{ background: token.screenBackground, borderColor: token.border }}>
                  <Plus className="w-5 h-5" style={{ color: token.mutedText }} />
                </div>
                <div className="flex-1 h-10 rounded-full border px-4 flex items-center" style={{ background: token.inputSurface, borderColor: token.border }}>
                  <span className="text-sm" style={{ color: token.text }}>Type a private message|</span>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: token.primaryGradient, boxShadow: token.glow }}>
                  <Mic className="w-5 h-5" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. Auth Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[2.5rem] p-4 flex flex-col relative overflow-hidden"
            style={{ background: token.cardSurface, border: `1px solid ${token.border}`, boxShadow: token.glow }}
          >
            <div className="flex items-center mb-4 space-x-2 ml-2">
              <Shield className="w-5 h-5" style={{ color: token.primary }} />
              <h2 className="text-lg font-bold">Login & Register Preview</h2>
            </div>
            
            <div className="flex-1 rounded-[2rem] overflow-hidden flex flex-col border items-center justify-center p-8 relative" style={{ background: token.screenBackground, borderColor: token.border }}>
              <div className="absolute top-0 w-full h-32 blur-[60px]" style={{ background: token.badgeSurface }} />
              
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 z-10" style={{ background: token.primaryGradient, boxShadow: token.glow }}>
                <Shield className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold font-display mb-8 z-10" style={{ color: token.text }}>Welcome to Orvix</h3>
              
              <div className="w-full flex p-1 rounded-xl mb-6 z-10 border" style={{ background: token.inputSurface, borderColor: token.border }}>
                <div className="flex-1 py-2 text-center rounded-lg text-sm font-bold" style={{ color: token.mutedText }}>Login</div>
                <div className="flex-1 py-2 text-center rounded-lg text-sm font-bold text-white" style={{ background: token.primaryGradient, boxShadow: token.glow }}>Register</div>
              </div>
              
              <div className="w-full space-y-3 z-10">
                <div className="w-full h-12 rounded-xl border px-4 flex items-center" style={{ background: token.inputSurface, borderColor: token.border }}>
                  <span className="text-sm" style={{ color: token.mutedText }}>Full Name</span>
                </div>
                <div className="w-full h-12 rounded-xl border px-4 flex items-center" style={{ background: token.inputSurface, borderColor: token.border }}>
                  <span className="text-sm" style={{ color: token.mutedText }}>Email Address</span>
                </div>
                <div className="w-full h-12 rounded-xl flex items-center justify-center font-bold text-white mt-4 transition-transform hover:scale-105 cursor-pointer" style={{ background: token.primaryGradient, boxShadow: token.glow }}>
                  Create Identity
                </div>
              </div>
            </div>
          </motion.div>

          {/* 4. Settings Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-[2.5rem] p-4 flex flex-col relative overflow-hidden"
            style={{ background: token.cardSurface, border: `1px solid ${token.border}`, boxShadow: token.glow }}
          >
            <div className="flex items-center mb-4 space-x-2 ml-2">
              <SettingsIcon className="w-5 h-5" style={{ color: token.primary }} />
              <h2 className="text-lg font-bold">Settings & Profile Preview</h2>
            </div>
            
            <div className="flex-1 rounded-[2rem] overflow-hidden flex flex-col border p-5" style={{ background: token.screenBackground, borderColor: token.border }}>
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-xl font-bold" style={{ borderColor: token.primary, background: token.softSurface, color: token.primary }}>
                  OU
                </div>
                <div>
                  <div className="text-xl font-bold" style={{ color: token.text }}>Orvix User</div>
                  <div className="text-sm font-medium" style={{ color: token.primary }}>Online • Identity Secured</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: token.softSurface, borderColor: token.border }}>
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5" style={{ color: token.mutedText }} />
                    <span className="font-medium" style={{ color: token.text }}>Edit Profile</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: token.strongSurface, borderColor: token.primary, boxShadow: token.glow }}>
                  <div className="flex items-center space-x-3">
                    <Palette className="w-5 h-5" style={{ color: token.primary }} />
                    <span className="font-bold" style={{ color: token.primary }}>Theme Settings</span>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: token.badgeSurface, color: token.primary }}>
                    {token.name} Active
                  </div>
                </div>
                
                <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: token.softSurface, borderColor: token.border }}>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5" style={{ color: token.mutedText }} />
                    <span className="font-medium" style={{ color: token.text }}>Privacy & Security</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center w-full max-w-2xl p-8 rounded-3xl border relative overflow-hidden"
          style={{ background: token.cardSurface, borderColor: token.border }}
        >
          <div className="absolute inset-0 blur-[80px] pointer-events-none opacity-50" style={{ background: token.badgeSurface }} />
          <h2 className="text-2xl font-bold mb-4 relative z-10" style={{ color: token.text }}>Ready for {token.name}?</h2>
          <p className="mb-8 relative z-10" style={{ color: token.mutedText }}>
            Download the APK, open Orvix, and start private realtime chatting with this theme applied.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <a 
              href="/downloads/orvix-v7.apk"
              download
              className="w-full sm:w-auto px-10 py-4 rounded-full text-white font-bold text-lg flex items-center justify-center space-x-2 transition-transform hover:scale-105"
              style={{ background: token.primaryGradient, boxShadow: token.glow }}
            >
              <Download className="w-5 h-5" />
              <span>Download APK</span>
            </a>
            <button 
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-10 py-4 rounded-full font-bold text-lg transition-colors border"
              style={{ background: token.softSurface, borderColor: token.border, color: token.text }}
            >
              Back to Themes
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
