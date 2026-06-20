import React, { useState } from 'react';
import { Send, Plus, Mic, Paperclip, Smile } from 'lucide-react';

export default function MessageInput({ onSendMessage }) {
  const [newMessage, setNewMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 p-4 z-20 pointer-events-none"
      style={{ background: 'linear-gradient(to top, var(--theme-bg), transparent)' }}
    >
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 max-w-4xl mx-auto pointer-events-auto">
        <button type="button" className="w-11 h-11 rounded-full app-surface border app-border flex items-center justify-center transition-colors flex-shrink-0 backdrop-blur-md shadow-sm hover:bg-white/5" style={{ color: 'var(--theme-primary)' }}>
          <Plus className="w-5 h-5" />
        </button>
        
        <div className="flex-1 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
            className="w-full theme-input rounded-full py-3 pl-12 pr-[90px] focus:outline-none transition-all backdrop-blur-md shadow-sm"
            style={{ '--tw-ring-color': 'var(--theme-primary)', border: '1px solid var(--theme-card-border)' }}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
             <button type="button" className="app-muted hover:text-white transition-colors p-1">
               <Smile className="w-5 h-5" />
             </button>
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            <button type="button" className="app-muted hover:text-white transition-colors p-1.5">
               <Paperclip className="w-4 h-4" />
            </button>
            <button type="button" className="app-muted hover:text-white transition-colors p-1.5">
               <Mic className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className="w-12 h-12 rounded-full theme-gradient-btn flex items-center justify-center text-white hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0"
          style={{ boxShadow: 'var(--theme-glow)' }}
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </form>
    </div>
  );
}
