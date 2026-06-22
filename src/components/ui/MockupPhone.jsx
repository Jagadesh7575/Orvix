import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../theme/ThemeContext';
import { Settings, ChevronLeft, Send, Search, Home, Activity, User, MessageSquare } from 'lucide-react';

export default function MockupPhone({ className = '' }) {
  const { theme } = useTheme();
  const [activeScreen, setActiveScreen] = useState('dashboard');

  useEffect(() => {
    const screens = ['dashboard', 'chatPage', 'activity', 'settings'];
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % screens.length;
      setActiveScreen(screens[currentIndex]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative mx-auto w-[280px] h-[580px] md:w-[300px] md:h-[620px] ${className}`}>
      {/* Outer Phone Frame */}
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 6, repeat: window.innerWidth < 768 ? 0 : Infinity, ease: "easeInOut" }}
        className="w-full h-full relative rounded-[3rem] border-[10px] border-[#1a1a24] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)_inset,0_0_0_1px_rgba(255,255,255,0.05)] ring-1 ring-white/5 flex flex-col"
        style={{ background: theme.background }}
      >
        {/* Subtle Screen Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none z-30"></div>

        {/* Dynamic Notch / Island */}
        <div className="absolute top-0 inset-x-0 h-8 flex justify-center z-50">
          <div className="w-28 h-7 bg-black rounded-b-3xl flex items-center justify-center space-x-2 px-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500/80"></div>
            <div className="w-2 h-2 rounded-full bg-[#111] border border-white/10"></div>
          </div>
        </div>

        {/* Screen Content Wrapper */}
        <div className="flex-1 relative pt-12 z-10 flex flex-col font-body w-full">
          <AnimatePresence mode="wait">
            {activeScreen === 'dashboard' && <DashboardScreen key="dashboard" theme={theme} />}
            {activeScreen === 'chatPage' && <ChatPageScreen key="chatPage" theme={theme} />}
            {activeScreen === 'activity' && <ActivityScreen key="activity" theme={theme} />}
            {activeScreen === 'settings' && <SettingsScreen key="settings" theme={theme} />}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

const BottomNav = ({ theme, active }) => (
  <div className="absolute bottom-0 inset-x-0 h-16 border-t flex items-center justify-around px-2 z-20 backdrop-blur-md" style={{ backgroundColor: theme.surface, borderColor: theme.cardBorder }}>
    <NavIcon icon={Home} active={active === 'dashboard'} theme={theme} />
    <NavIcon icon={MessageSquare} active={active === 'chat'} theme={theme} />
    <NavIcon icon={Activity} active={active === 'activity'} theme={theme} />
    <NavIcon icon={User} active={active === 'settings'} theme={theme} />
    <div className="absolute bottom-1 w-24 h-1 rounded-full bg-white/20"></div>
  </div>
);

const NavIcon = ({ icon: Icon, active, theme }) => (
  <div className="flex flex-col items-center justify-center w-12 h-12 relative">
    <Icon className="w-5 h-5 transition-all" style={{ color: active ? theme.primary : theme.textMuted }} />
    {active && (
      <motion.div layoutId="nav-indicator" className="absolute -bottom-1 w-1 h-1 rounded-full" style={{ backgroundColor: theme.primary, boxShadow: theme.glow }} />
    )}
  </div>
);

const DashboardScreen = ({ theme }) => (
  <motion.div 
    initial={{ opacity: 0, filter: 'blur(4px)' }}
    animate={{ opacity: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, filter: 'blur(4px)' }}
    transition={{ duration: 0.4 }}
    className="flex flex-col h-full w-full relative pb-16"
  >
    <div className="flex justify-between items-center mb-6 px-5">
      <h2 className="text-2xl font-heading font-bold" style={{ color: theme.text }}>Orvix</h2>
      <div className="flex space-x-3">
        <Search className="w-5 h-5" style={{ color: theme.textMuted }} />
      </div>
    </div>
    <div className="flex flex-col space-y-3 px-4">
      <ChatItem theme={theme} name="Alex Chen" msg="Sent 1m ago" time="1m" unread={true} />
      <ChatItem theme={theme} name="Sarah Smith" msg="Seen just now" time="1h" />
      <ChatItem theme={theme} name="Design Team" msg="Looks great, shipping it." time="4h" />
      <ChatItem theme={theme} name="Jagadesh" msg="Orvix is live." time="1d" />
    </div>
    <BottomNav theme={theme} active="dashboard" />
  </motion.div>
);

const ChatItem = ({ theme, name, msg, time, unread }) => (
  <div className="flex items-center space-x-3 p-2.5 rounded-2xl border border-transparent transition-colors" style={{ backgroundColor: unread ? theme.backgroundSoft : 'transparent' }}>
    <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ background: theme.buttonGradient }} />
    <div className="flex-1 overflow-hidden">
      <div className="flex justify-between items-center mb-0.5">
        <span className="font-bold text-sm truncate" style={{ color: theme.text }}>{name}</span>
        <span className="text-[10px]" style={{ color: unread ? theme.primary : theme.textMuted }}>{time}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs truncate font-medium" style={{ color: unread ? theme.text : theme.textMuted }}>{msg}</span>
        {unread && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primary, boxShadow: theme.glow }} />}
      </div>
    </div>
  </div>
);

const ActivityScreen = ({ theme }) => (
  <motion.div 
    initial={{ opacity: 0, filter: 'blur(4px)' }}
    animate={{ opacity: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, filter: 'blur(4px)' }}
    transition={{ duration: 0.4 }}
    className="flex flex-col h-full w-full relative pb-16"
  >
    <div className="flex justify-between items-center mb-6 px-5">
      <h2 className="text-2xl font-heading font-bold" style={{ color: theme.text }}>Activity</h2>
    </div>
    <div className="flex flex-col space-y-4 px-4 overflow-hidden">
      <ActivityItem theme={theme} title="New Login" desc="MacBook Pro • San Francisco" time="2m ago" icon={ShieldIcon} />
      <ActivityItem theme={theme} title="Keys Rotated" desc="End-to-end encryption updated" time="1h ago" icon={KeyIcon} />
      <ActivityItem theme={theme} title="Theme Changed" desc={`Switched to ${theme.name}`} time="3h ago" icon={PaletteIcon} />
    </div>
    <BottomNav theme={theme} active="activity" />
  </motion.div>
);

const ActivityItem = ({ theme, title, desc, time, icon: Icon }) => (
  <div className="flex items-start space-x-3">
    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.backgroundSoft }}>
      <Icon className="w-4 h-4" style={{ color: theme.primary }} />
    </div>
    <div className="flex-1 border-b pb-3" style={{ borderColor: theme.cardBorder }}>
      <div className="flex justify-between items-center">
        <span className="font-bold text-[13px]" style={{ color: theme.text }}>{title}</span>
        <span className="text-[10px]" style={{ color: theme.textMuted }}>{time}</span>
      </div>
      <div className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{desc}</div>
    </div>
  </div>
);

const ShieldIcon = (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const KeyIcon = (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
const PaletteIcon = (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>;

const ChatPageScreen = ({ theme }) => (
  <motion.div 
    initial={{ opacity: 0, filter: 'blur(4px)' }}
    animate={{ opacity: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, filter: 'blur(4px)' }}
    transition={{ duration: 0.4 }}
    className="flex flex-col h-full w-full relative pb-6"
  >
    <div className="flex items-center space-x-3 mb-6 pb-4 border-b px-4" style={{ borderColor: theme.cardBorder }}>
      <ChevronLeft className="w-5 h-5" style={{ color: theme.text }} />
      <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: theme.buttonGradient }} />
      <div>
        <div className="font-bold text-sm" style={{ color: theme.text }}>Alex Chen</div>
        <div className="text-[10px] font-medium" style={{ color: theme.secondary }}>Online</div>
      </div>
    </div>
    
    <div className="flex-1 flex flex-col space-y-4 px-4">
      <div className="self-start max-w-[85%] p-3.5 rounded-2xl rounded-tl-sm text-[13px] shadow-sm border" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder, color: theme.text }}>
        Are we still on for the 4PM call?
      </div>
      <div className="self-end max-w-[85%] p-3.5 rounded-2xl rounded-tr-sm text-[13px] shadow-md relative" style={{ background: theme.bubbleOutgoing, color: '#fff' }}>
        Yes, I'll send the secure link now.
        <div className="absolute -bottom-5 right-1 text-[9px] font-medium flex items-center space-x-1" style={{ color: theme.textMuted }}>
          <span>Seen just now</span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.secondary }} />
        </div>
      </div>
    </div>
    
    <div className="mt-auto px-4">
      <div className="h-12 w-full rounded-full flex items-center px-4 border shadow-sm" style={{ backgroundColor: theme.inputBackground, borderColor: theme.cardBorder }}>
        <span className="text-[13px]" style={{ color: theme.textMuted }}>Message...</span>
        <div className="ml-auto w-7 h-7 rounded-full flex items-center justify-center shadow-sm" style={{ background: theme.buttonGradient }}>
          <Send className="w-3.5 h-3.5 text-white" style={{ marginLeft: '-1px' }} />
        </div>
      </div>
    </div>
    
    {/* Simple line indicator for home gesture on chat screen */}
    <div className="absolute bottom-1 inset-x-0 flex justify-center">
      <div className="w-24 h-1 rounded-full bg-white/20"></div>
    </div>
  </motion.div>
);

const SettingsScreen = ({ theme }) => (
  <motion.div 
    initial={{ opacity: 0, filter: 'blur(4px)' }}
    animate={{ opacity: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, filter: 'blur(4px)' }}
    transition={{ duration: 0.4 }}
    className="flex flex-col h-full w-full relative pb-16"
  >
    <div className="flex items-center space-x-3 mb-6 px-5">
      <h2 className="text-2xl font-heading font-bold" style={{ color: theme.text }}>Profile</h2>
    </div>
    
    <div className="flex flex-col items-center mb-8 mt-2">
      <div className="w-24 h-24 rounded-full mb-4 shadow-lg p-1" style={{ background: theme.buttonGradient }}>
        <div className="w-full h-full rounded-full" style={{ backgroundColor: theme.surface }} />
      </div>
      <div className="font-bold text-xl font-heading" style={{ color: theme.text }}>Founder</div>
      <div className="text-[13px] font-medium mt-1" style={{ color: theme.primary }}>@jagadesh</div>
    </div>
    
    <div className="flex flex-col space-y-3 px-4">
      <div className="p-3.5 rounded-2xl border flex items-center justify-between" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.backgroundSoft }}>
            <Settings className="w-4.5 h-4.5" style={{ color: theme.primary }} />
          </div>
          <span className="text-[13px] font-bold" style={{ color: theme.text }}>Theme Active</span>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-md" style={{ backgroundColor: theme.primary, color: '#fff', boxShadow: theme.glow }}>
          {theme.name}
        </span>
      </div>
      
      <div className="p-3.5 rounded-2xl border flex items-center justify-between" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.backgroundSoft }}>
            <div className="w-4.5 h-4.5 rounded-full" style={{ backgroundColor: theme.secondary }} />
          </div>
          <span className="text-[13px] font-bold" style={{ color: theme.text }}>Accent Color</span>
        </div>
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.secondary, boxShadow: theme.glow }} />
      </div>
    </div>
    <BottomNav theme={theme} active="settings" />
  </motion.div>
);
