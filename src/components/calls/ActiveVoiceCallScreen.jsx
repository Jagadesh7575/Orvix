import React from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

export function ActiveVoiceCallScreen({
  currentCall,
  endCall,
  isMuted,
  toggleMute,
  callDuration,
  remoteUser
}) {
  const [isSpeaker, setIsSpeaker] = React.useState(true);

  const toggleSpeaker = () => setIsSpeaker(!isSpeaker);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col items-center justify-between py-24 px-6 text-white">
      {/* Top Section */}
      <div className="flex flex-col items-center mt-12 space-y-6">
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-4xl font-bold shadow-2xl">
          {/* Avatar placeholder */}
          <span>{remoteUser ? remoteUser.uid?.toString().slice(0, 2).toUpperCase() : '...'}</span>
          {remoteUser?.hasAudio && (
            <div className="absolute inset-0 rounded-full ring-4 ring-green-500/50 animate-pulse" />
          )}
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">Active Call</h2>
          <p className="text-white/70 text-lg font-mono">
            {formatDuration(callDuration)}
          </p>
        </div>
      </div>

      {/* Bottom Section Controls */}
      <div className="flex items-center justify-center gap-8 w-full max-w-sm">
        <button
          onClick={toggleMute}
          className={`flex flex-col items-center gap-2`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-white text-gray-900' : 'bg-gray-800 text-white'}`}>
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </div>
          <span className="text-xs font-medium text-white/80">Mute</span>
        </button>

        {/* End Button */}
        <button
          onClick={endCall}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
            <PhoneOff size={28} className="text-white" />
          </div>
          <span className="text-xs font-medium text-white/80">End</span>
        </button>

        <button
          onClick={toggleSpeaker}
          className={`flex flex-col items-center gap-2`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${!isSpeaker ? 'bg-white text-gray-900' : 'bg-gray-800 text-white'}`}>
            {!isSpeaker ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </div>
          <span className="text-xs font-medium text-white/80">Speaker</span>
        </button>
      </div>
    </div>
  );
}
