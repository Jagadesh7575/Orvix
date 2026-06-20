import React from 'react';
import { motion } from 'framer-motion';
import { CheckCheck } from 'lucide-react';

export default function MessageBubble({ msg, isMe }) {
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%] ${isMe ? 'ml-auto' : 'mr-auto'}`}
    >
      <div className={`p-3.5 rounded-2xl text-[15px] leading-relaxed relative overflow-hidden group ${
        isMe 
          ? 'theme-outgoing-bubble text-white rounded-tr-sm shadow-[var(--theme-glow)]' 
          : 'theme-incoming-bubble app-border app-text rounded-tl-sm shadow-sm'
      }`}>
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isMe ? 'bg-white/10' : 'bg-white/5'}`} />
        <span className="relative z-10">{msg.content}</span>
      </div>
      <div className={`flex items-center text-[10px] app-muted mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
        <span>{formatTime(msg.created_at)}</span>
        {isMe && <CheckCheck className="w-3.5 h-3.5 ml-1" style={{ color: 'var(--theme-primary)' }} />}
      </div>
    </motion.div>
  );
}
