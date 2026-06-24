import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';

const InAppNotificationBanner = () => {
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleNotification = (e) => {
      setNotification(e.detail);
      
      window.dispatchEvent(new CustomEvent("orvix-debug-log", {
        detail: {
          source: "InAppNotificationBanner",
          title: "Banner Event Received",
          data: {
            banner_event_received: true,
            title: e.detail.title,
            body: e.detail.body,
            chat_id: e.detail.data?.chat_id,
            sender_id: e.detail.data?.sender_id,
            banner_visible: true
          }
        }
      }));

      // Auto dismiss after 10 seconds for easier testing
      const timer = setTimeout(() => {
        setNotification(null);
      }, 10000);
      
      return () => clearTimeout(timer);
    };

    window.addEventListener('in-app-notification', handleNotification);
    return () => window.removeEventListener('in-app-notification', handleNotification);
  }, []);

  if (!notification) return null;

  const handleTap = () => {
    if (notification.data?.chat_id) {
      navigate(`/app/chat/${notification.data.chat_id}`);
    }
    setNotification(null);
  };

  return (
    <div 
      className="fixed top-safe left-4 right-4 z-[9999] animate-in fade-in slide-in-from-top-10 duration-300"
      style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <div 
        onClick={handleTap}
        className="glass-panel bg-surface/90 backdrop-blur-xl border-2 border-purple-500 p-4 rounded-2xl shadow-glow-lg flex items-start space-x-3 cursor-pointer"
      >
        <div className="bg-purple-500/20 p-2 rounded-xl text-purple-400 flex-shrink-0 mt-0.5">
          <MessageSquare size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-bold text-sm truncate pr-4">
            {notification.title}
          </h4>
          <p className="text-muted text-xs line-clamp-2 mt-0.5">
            {notification.body}
          </p>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); setNotification(null); }}
          className="absolute top-2 right-2 text-white/50 hover:text-white p-1 rounded-full bg-white/5 active:scale-95"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default InAppNotificationBanner;
