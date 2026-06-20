import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Loader2 } from 'lucide-react';

const MediaViewer = ({ 
  isOpen, 
  onClose, 
  message, 
  senderName,
  chatId
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !message) return null;

  // Prefer original media_url, fallback to thumbnail
  const imageUrl = message.media_url || message.thumbnail_url;
  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      if (imageUrl) {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = imageUrl;
        a.download = message.file_name || 'download';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 1000);
      }
    } catch (err) {
      alert("Download failed: " + err.message); // In real app use toast
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex flex-col pt-safe backdrop-blur-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 z-10 bg-gradient-to-b from-black/60 to-transparent">
          <button 
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-white font-medium text-sm">
              {senderName || 'Photo'}
            </span>
            <span className="text-white/50 text-[10px]">
              {new Date(message.created_at).toLocaleString()}
            </span>
          </div>

          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Download className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center p-2 relative overflow-hidden">
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            src={imageUrl}
            alt="HD Media"
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Caption Area */}
        {message.caption && (
          <div className="p-6 bg-gradient-to-t from-black/80 to-transparent pb-[calc(env(safe-area-inset-bottom,20px)+20px)] text-center text-white">
            <p className="text-sm font-medium whitespace-pre-wrap">{message.caption}</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaViewer;
