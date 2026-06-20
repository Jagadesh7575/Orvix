import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  User, Shield, Bell, Palette, MessageSquare, 
  Database, HelpCircle, LogOut, ChevronRight,
  AtSign, Mail, Lock, EyeOff, CheckCheck, UserX,
  Volume2, Vibrate, Type, Download, Trash2, Info
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [toggles, setToggles] = useState({
    privateAccount: false,
    hideOnline: false,
    readReceipts: true,
    messageNotifs: true,
    sounds: true,
    vibration: true,
    autoDownload: true
  });

  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const ToggleSwitch = ({ isOn, onToggle }) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out relative app-border"
      style={{ background: isOn ? 'var(--theme-primary)' : 'var(--theme-surface)', border: isOn ? 'none' : '1px solid var(--theme-card-border)' }}
    >
      <motion.div 
        layout
        className={`w-4 h-4 rounded-full bg-white shadow-sm ${isOn ? 'ml-6' : 'ml-0'}`}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );

  const settingsGroups = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", desc: "Change name, bio, avatar", onClick: () => navigate('/app/profile') },
        { icon: Palette, label: "Theme", desc: "Change app colors and style", onClick: () => navigate('/app/themes') },
        { icon: Type, label: "Typography", desc: "Choose your Orvix font style", onClick: () => navigate('/app/typography') },
      ]
    },
    {
      title: "Privacy",
      items: [
        { icon: UserX, label: "Blocked Users", desc: "Manage blocked contacts", onClick: () => navigate('/app/settings/blocked-users') },
      ]
    },
    {
      title: "Session",
      items: [
        { icon: LogOut, label: "Log Out", desc: "Sign out of your account", onClick: () => setShowLogoutModal(true), isDanger: true },
      ]
    }
  ];

  return (
    <div className="app-page w-full p-4 md:max-w-xl mx-auto">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6 flex items-center justify-between"
      >
        <h1 className="text-2xl font-bold font-display app-text">Settings</h1>
      </motion.div>

      <div className="space-y-6">
        {settingsGroups.map((group, gIndex) => (
          <motion.div 
            key={group.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 * gIndex }}
          >
            <h3 className="text-xs font-bold app-muted uppercase tracking-widest mb-3 px-2">{group.title}</h3>
            <div className="glass-panel rounded-3xl overflow-hidden border app-border">
              {group.items.map((item, i) => (
                <div 
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center p-4 hover:bg-white/5 transition-colors text-left ${item.onClick ? 'cursor-pointer active:bg-white/10' : ''} ${
                    i !== group.items.length - 1 ? 'border-b border-[var(--theme-card-border)]' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl app-surface border app-border flex items-center justify-center mr-4 flex-shrink-0 ${item.isDanger ? 'border-red-500/20 bg-red-500/10' : ''}`}>
                    <item.icon className="w-5 h-5" style={{ color: item.isDanger ? '#ef4444' : 'var(--theme-primary)' }} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className={`font-semibold text-[15px] truncate ${item.isDanger ? 'text-red-500' : 'app-text'}`}>{item.label}</div>
                    <div className="app-muted text-[13px] mt-0.5 truncate">{item.desc}</div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {item.action ? item.action : <ChevronRight className="w-5 h-5 app-muted opacity-50" />}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-panel p-6 rounded-3xl w-full max-w-sm relative z-10 border app-border shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 mx-auto border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <LogOut className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold app-text text-center mb-2 font-display">Logout from Orvix?</h2>
              <p className="text-sm app-muted text-center mb-6">You will need to login again to access your private chats.</p>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 app-surface border app-border rounded-xl app-text font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowLogoutModal(false);
                    signOut();
                  }}
                  className="flex-1 py-3 rounded-xl text-white font-medium transition-colors shadow-sm"
                  style={{ background: 'var(--theme-danger)' }}
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
