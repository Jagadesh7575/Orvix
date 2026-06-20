import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, XCircle, RefreshCw } from 'lucide-react';

const UploadProgressBubble = ({ 
  previewUrl, 
  progress, 
  error, 
  onRetry, 
  onCancel 
}) => {
  return (
    <div className="flex w-full justify-end mb-2 pr-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-w-[75%] rounded-2xl overflow-hidden bg-[var(--theme-surface)] border app-border"
      >
        <div className="relative aspect-auto max-h-[300px] flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Upload Preview" 
              className={`w-full object-cover transition-opacity duration-300 ${error ? 'opacity-50' : 'opacity-80 blur-[2px]'}`}
            />
          ) : (
            <div className="w-48 h-48 bg-white/5 animate-pulse" />
          )}

          {/* Overlay Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40">
            {error ? (
              <div className="flex flex-col items-center text-center space-y-3">
                <XCircle className="w-8 h-8 text-red-500 mb-1" />
                <p className="text-white text-xs font-semibold px-2">{error}</p>
                <div className="flex space-x-2">
                  <button 
                    onClick={onRetry}
                    className="flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors text-white text-xs font-medium"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Retry
                  </button>
                  <button 
                    onClick={onCancel}
                    className="flex items-center px-3 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-full backdrop-blur-sm transition-colors text-white text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-white animate-spin mb-3" />
                <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-200 ease-out rounded-full"
                    style={{ width: `${Math.max(5, progress)}%` }}
                  />
                </div>
                <span className="text-white text-xs font-bold mt-2 shadow-sm">
                  {progress}%
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UploadProgressBubble;
