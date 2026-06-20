import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, File, Video, X } from 'lucide-react';
import { validateMediaFile } from '../../utils/mediaValidation';

const AttachmentMenu = ({ isOpen, onClose, onFileSelected }) => {
  const fileInputRef = useRef(null);

  const handlePhotoClick = () => {
    // Only accept images for Phase 1
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateMediaFile(file);
    if (!validation.valid) {
      alert(validation.error); // In a real app, use the toast mechanism
      e.target.value = ''; // Reset input
      return;
    }

    onFileSelected(file);
    onClose();
    e.target.value = ''; // Reset input so the same file can be selected again if needed
  };

  return (
    <>
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={onClose}
              style={{ background: 'transparent' }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-16 left-2 w-48 bg-surface border app-border rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="flex flex-col py-2">
                
                <button 
                  onClick={handlePhotoClick}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="font-medium app-text text-sm">Photo</span>
                </button>

                <button 
                  disabled
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left opacity-50 cursor-not-allowed"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Video className="w-4 h-4 text-purple-500" />
                  </div>
                  <span className="font-medium app-text text-sm flex-1">Video</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">Soon</span>
                </button>

                <button 
                  disabled
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left opacity-50 cursor-not-allowed"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <File className="w-4 h-4 text-orange-500" />
                  </div>
                  <span className="font-medium app-text text-sm flex-1">Document</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">Soon</span>
                </button>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AttachmentMenu;
