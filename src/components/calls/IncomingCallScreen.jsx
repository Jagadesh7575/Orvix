import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { motion } from 'framer-motion';

export function IncomingCallScreen({ currentCall, answerCall, rejectCall }) {
  if (!currentCall) return null;

  const isVideo = currentCall.call_type === 'video';

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between py-24 px-6 text-white">
      {/* Top Section */}
      <div className="flex flex-col items-center mt-12 space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-4xl font-bold shadow-2xl"
        >
          {/* Avatar placeholder - Could fetch profile pic using caller_id if desired */}
          <span>{currentCall.caller_id?.slice(0, 2).toUpperCase() || 'U'}</span>
          <div className="absolute inset-0 rounded-full ring-4 ring-purple-500/50 animate-ping" />
        </motion.div>
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Incoming Call</h2>
          <p className="text-white/70 text-lg flex items-center justify-center gap-2">
            {isVideo ? <Video size={20} /> : <Phone size={20} />}
            <span>{isVideo ? 'Video' : 'Voice'} Call</span>
          </p>
        </div>
      </div>

      {/* Bottom Section Controls */}
      <div className="flex items-center justify-center gap-12 w-full max-w-sm">
        {/* Reject Button */}
        <button
          onClick={rejectCall}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
            <PhoneOff size={28} className="text-white" />
          </div>
          <span className="text-sm font-medium text-white/80">Decline</span>
        </button>

        {/* Answer Button */}
        <motion.button
          onClick={answerCall}
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30">
            {isVideo ? <Video size={28} className="text-white" /> : <Phone size={28} className="text-white" />}
          </div>
          <span className="text-sm font-medium text-white/80">Accept</span>
        </motion.button>
      </div>
    </div>
  );
}
