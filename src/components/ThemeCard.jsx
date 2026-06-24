import React from 'react';
import { motion } from 'framer-motion';
import { Check, Eye, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';
import GlowCard from './GlowCard';

export default function ThemeCard({ themeItem, glowColor = "purple" }) {
  const { selectedThemeId, applyTheme } = useTheme();
  const isSelected = selectedThemeId === themeItem.id;

  const renderBackground = () => {
    const bubbleBase = "px-2 py-1.5 rounded-lg text-[8px] max-w-[80%] shadow-sm backdrop-blur-md";
    
    switch(themeItem.id) {
      case 'cyber_violet':
        return (
          <div className="absolute inset-0 bg-black/60 z-0 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/40 to-[#06B6D4]/40" />
            <div className="absolute w-32 h-32 bg-[#7C3AED]/50 rounded-full blur-2xl opacity-70" />
            
            <div className="relative z-10 w-3/4 flex flex-col space-y-2 mt-4">
              <div className={`self-start ${bubbleBase} bg-white/10 text-white/70 border border-white/5 rounded-tl-sm`}>Incoming encrypted</div>
              <div className={`self-end ${bubbleBase} bg-[#7C3AED] text-white border border-[#7C3AED]/50 rounded-tr-sm shadow-[0_0_15px_#7C3AED]`}>Secure connection established</div>
            </div>
          </div>
        );
      case 'royal_gold':
        return (
          <div className="absolute inset-0 bg-black/80 z-0 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/30 to-black/90" />
            <div className="absolute w-32 h-32 bg-[#D4AF37]/40 rounded-full blur-2xl opacity-80" />
            
            <div className="relative z-10 w-3/4 flex flex-col space-y-2 mt-4">
              <div className={`self-start ${bubbleBase} bg-white/5 text-white/70 border border-[#D4AF37]/20 rounded-tl-sm`}>Executive brief ready</div>
              <div className={`self-end ${bubbleBase} bg-gradient-to-r from-[#D4AF37] to-[#FACC15] text-black font-semibold rounded-tr-sm shadow-[0_0_15px_rgba(212,175,55,0.5)]`}>Approve transfer</div>
            </div>
          </div>
        );
      case 'lavender_glow':
        return (
          <div className="absolute inset-0 bg-[#1e1b2e] z-0 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#A78BFA]/30 to-[#F0ABFC]/20" />
            <div className="absolute w-32 h-32 bg-[#A78BFA]/50 rounded-full blur-2xl opacity-70" />
            
            <div className="relative z-10 w-3/4 flex flex-col space-y-2 mt-4">
              <div className={`self-start ${bubbleBase} bg-white/10 text-[#F0ABFC] border border-white/5 rounded-tl-sm`}>Good evening 🌙</div>
              <div className={`self-end ${bubbleBase} bg-[#A78BFA] text-white border border-[#A78BFA]/50 rounded-tr-sm shadow-[0_0_15px_rgba(167,139,250,0.5)]`}>Night mode activated</div>
            </div>
          </div>
        );
      case 'ocean_blue':
        return (
          <div className="absolute inset-0 bg-[#020617] z-0 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0EA5E9]/30 to-[#020617]" />
            <div className="absolute w-32 h-32 bg-[#0EA5E9]/40 rounded-full blur-2xl opacity-80" />
            
            <div className="relative z-10 w-3/4 flex flex-col space-y-2 mt-4">
              <div className={`self-start ${bubbleBase} bg-[#0EA5E9]/10 text-[#22D3EE] border border-[#0EA5E9]/20 rounded-tl-sm`}>Systems synced</div>
              <div className={`self-end ${bubbleBase} bg-[#0EA5E9] text-white border border-[#0EA5E9]/50 rounded-tr-sm shadow-[0_0_15px_rgba(14,165,233,0.5)]`}>Flow clear</div>
            </div>
          </div>
        );
      case 'midnight_black':
        return (
          <div className="absolute inset-0 bg-black z-0 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-black" />
            <div className="absolute w-32 h-32 bg-gray-800/50 rounded-full blur-2xl opacity-50" />
            
            <div className="relative z-10 w-3/4 flex flex-col space-y-2 mt-4">
              <div className={`self-start ${bubbleBase} bg-[#111] text-gray-400 border border-gray-800 rounded-tl-sm`}>Signal secure</div>
              <div className={`self-end ${bubbleBase} bg-gray-800 text-gray-200 border border-gray-700 rounded-tr-sm shadow-[0_0_15px_rgba(255,255,255,0.05)]`}>Zero distractions</div>
            </div>
          </div>
        );
      case 'heart_glow':
        return (
          <div className="absolute inset-0 bg-[#120508] z-0 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#F43F5E]/30 to-[#120508]" />
            <div className="absolute w-32 h-32 bg-[#F43F5E]/40 rounded-full blur-2xl opacity-60" />
            
            <div className="relative z-10 w-3/4 flex flex-col space-y-2 mt-4">
              <div className={`self-start ${bubbleBase} bg-white/5 text-white/80 border border-[#F43F5E]/20 rounded-tl-sm`}>Missed you</div>
              <div className={`self-end ${bubbleBase} bg-[#F43F5E] text-white border border-[#F43F5E]/50 rounded-tr-sm shadow-[0_0_15px_rgba(244,63,94,0.5)]`}>See you soon</div>
            </div>
          </div>
        );
      case 'emerald_matrix':
        return (
          <div className="absolute inset-0 bg-[#021207] z-0 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#10B981]/20 to-black" />
            <div className="absolute w-32 h-32 bg-[#10B981]/30 rounded-full blur-2xl opacity-50" />
            
            <div className="relative z-10 w-3/4 flex flex-col space-y-2 mt-4 font-mono">
              <div className={`self-start ${bubbleBase} bg-black/50 text-[#10B981] border border-[#10B981]/30 rounded-tl-sm`}>System breached?</div>
              <div className={`self-end ${bubbleBase} bg-[#10B981]/20 text-[#34D399] border border-[#10B981] rounded-tr-sm shadow-[0_0_15px_rgba(16,185,129,0.3)]`}>Encrypted tunnel active</div>
            </div>
          </div>
        );
      case 'sunset_neon':
        return (
          <div className="absolute inset-0 bg-[#1a0b12] z-0 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#F97316]/30 to-[#E11D48]/30" />
            <div className="absolute w-32 h-32 bg-[#F97316]/40 rounded-full blur-2xl opacity-70" />
            
            <div className="relative z-10 w-3/4 flex flex-col space-y-2 mt-4">
              <div className={`self-start ${bubbleBase} bg-white/5 text-orange-200 border border-white/5 rounded-tl-sm`}>Neon vibes</div>
              <div className={`self-end ${bubbleBase} bg-gradient-to-r from-[#F97316] to-[#E11D48] text-white border border-[#F97316]/50 rounded-tr-sm shadow-[0_0_15px_rgba(249,115,22,0.5)]`}>Looking good</div>
            </div>
          </div>
        );
      case 'arctic_frost':
        return (
          <div className="absolute inset-0 bg-[#0F172A] z-0 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E2E8F0]/20 to-[#38BDF8]/20" />
            <div className="absolute w-32 h-32 bg-[#E2E8F0]/30 rounded-full blur-2xl opacity-70" />
            
            <div className="relative z-10 w-3/4 flex flex-col space-y-2 mt-4">
              <div className={`self-start ${bubbleBase} bg-white/5 text-gray-300 border border-white/5 rounded-tl-sm`}>Stay cool</div>
              <div className={`self-end ${bubbleBase} bg-white text-slate-900 border border-white/50 rounded-tr-sm shadow-[0_0_15px_rgba(255,255,255,0.5)]`}>Frost activated</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const colors = {
    cyber_violet: ['#7C3AED', '#06B6D4'],
    royal_gold: ['#D4AF37', '#FACC15'],
    lavender_glow: ['#A78BFA', '#F0ABFC'],
    ocean_blue: ['#0EA5E9', '#22D3EE'],
    midnight_black: ['#64748B', '#CBD5E1'],
    heart_glow: ['#F43F5E', '#FB7185'],
    emerald_matrix: ['#10B981', '#34D399'],
    sunset_neon: ['#F97316', '#E11D48'],
    arctic_frost: ['#E2E8F0', '#94A3B8']
  };

  const handleThemeChange = () => {
    if (applyTheme) applyTheme(themeItem.id);
  };

  return (
    <div className="w-full max-w-[330px] sm:max-w-[320px] lg:max-w-none mx-auto transition-transform hover:sm:-translate-y-1">
      <GlowCard 
        customSize 
        glowColor={glowColor}
        className={`w-full h-[360px] group cursor-pointer ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} p-0 border-0 rounded-3xl overflow-hidden`}
      >
        <div 
          className="w-full h-full flex flex-col relative overflow-hidden"
          onClick={handleThemeChange}
        >
          {/* Background Visual */}
          <div className="absolute inset-0 h-[65%] overflow-hidden rounded-t-[1.5rem]">
            {renderBackground()}
            <div className="absolute inset-0 bg-gradient-to-t from-theme-surface via-transparent to-transparent z-10" />
          </div>
          
          {/* Content Area */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 bg-gradient-to-t from-theme-surface via-theme-surface/95 to-transparent">
            
            {/* Color Dots */}
            <div className="flex items-center space-x-1.5 mb-4 opacity-100 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity">
              {colors[themeItem.id].map((color, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
              ))}
            </div>

            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-xl font-bold font-heading ${isSelected ? 'text-white text-glow' : 'text-gray-200'}`}>
                {themeItem.name}
              </h3>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-white shadow-glow' : 'bg-white/10 text-transparent sm:group-hover:text-white/50'}`}>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
            
            <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-4 sm:group-hover:text-gray-300 transition-colors">
              {themeItem.desc}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 translate-y-0 sm:translate-y-4 sm:group-hover:translate-y-0">
              <Link 
                to={`/preview/${themeItem.id}`}
                onClick={(e) => {
                  localStorage.setItem("orvix_selected_theme", themeItem.id);
                  e.stopPropagation();
                }}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white flex items-center justify-center space-x-2 hover:bg-primary/20 hover:border-primary/50 transition-all hover:scale-105"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </Link>
              <a
                href="/downloads/orvix-v9.apk"
                download="orvix-v4.apk"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-primary text-xs font-semibold text-white flex items-center justify-center space-x-2 hover:bg-primary/90 transition-all shadow-glow hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>APK</span>
              </a>
            </div>
          </div>
        </div>
      </GlowCard>
    </div>
  );
}
