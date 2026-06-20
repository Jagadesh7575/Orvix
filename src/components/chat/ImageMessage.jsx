import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ImageMessage = ({ 
  message, 
  isMine, 
  onImageClick, 
  showTime, 
  formattedTime, 
  statusIcon, 
  seenText 
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // We use media_url which contains the image url
  const imageUrl = message.media_url || message.thumbnail_url;
  const hasCaption = message.caption && message.caption.trim().length > 0;

  return (
    <div className={`flex w-full mb-2 ${isMine ? 'justify-end pr-2 pl-12' : 'justify-start pl-2 pr-12'}`}>
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%]`}>
        
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform ${
            isMine 
              ? 'bg-[var(--theme-primary)] text-white border-none' 
              : 'bg-[var(--theme-surface)] border app-border app-text'
          }`}
          onClick={() => {
            if (!imgError && imageUrl) {
              onImageClick(message);
            }
          }}
        >
          {/* Image Container */}
          <div className="relative flex items-center justify-center min-h-[150px] min-w-[200px] bg-black/5">
            {!imgLoaded && !imgError && (
              <div className="absolute inset-0 bg-white/10 animate-pulse" />
            )}
            
            {imgError ? (
              <div className="flex items-center justify-center p-8 text-xs opacity-60 flex-col">
                <span className="mb-1">⚠️</span>
                Image unavailable
              </div>
            ) : (
              <img
                src={imageUrl}
                alt="Chat Attachment"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={`max-h-[350px] w-full object-cover transition-opacity duration-300 ${
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
              />
            )}
          </div>

          {/* Caption */}
          {hasCaption && (
            <div className={`px-3 py-2 text-[15px] ${isMine ? 'text-white' : 'app-text'}`}>
              <p className="whitespace-pre-wrap break-words">{message.caption}</p>
            </div>
          )}

        </motion.div>

        {/* Time and Status (Mirrors Text Message layout perfectly) */}
        {showTime && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center mt-1 px-1 space-x-1 text-[11px] font-medium app-muted`}
          >
            {isMine && statusIcon}
            <span>{formattedTime}</span>
          </motion.div>
        )}
        
        {/* Seen Text */}
        {seenText && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-[11px] font-bold mt-0.5 px-1 tracking-wide"
            style={{ color: 'var(--theme-muted)' }}
          >
            {seenText}
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default ImageMessage;
