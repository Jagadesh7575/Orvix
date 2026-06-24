import React from 'react';
import { PhoneOff } from 'lucide-react';
import { motion } from 'framer-motion';

export function OutgoingCallScreen({ currentCall, endCall }) {
  if (!currentCall) return null;

  const isVideo = currentCall.call_type === 'video';

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between py-24 px-6 text-white">
      {/* Top Section */}
      <div className="flex flex-col items-center mt-12 space-y-6">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center text-4xl font-bold shadow-2xl"
        >
          {/* Avatar placeholder */}
          <span>{currentCall.receiver_id?.slice(0, 2).toUpperCase() || 'U'}</span>
        </motion.div>
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Calling...</h2>
          <p className="text-white/70 text-lg">
            {isVideo ? 'Video' : 'Voice'} Call
          </p>
        </div>
      </div>

      {/* Bottom Section Controls */}
      <div className="flex items-center justify-center w-full max-w-sm">
        {/* End Button */}
        <button
          onClick={endCall}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
            <PhoneOff size={28} className="text-white" />
          </div>
          <span className="text-sm font-medium text-white/80">Cancel</span>
        </button>
      </div>
    </div>
  );
}
