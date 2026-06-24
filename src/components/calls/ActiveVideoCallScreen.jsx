import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Camera } from 'lucide-react';
import { VideoResolutionSelector } from './VideoResolutionSelector';
import { agoraService } from '../../services/agoraService';

export function ActiveVideoCallScreen({
  endCall,
  isMuted,
  isVideoOn,
  toggleMute,
  toggleVideo,
  switchCamera,
  localVideoTrack,
  localAudioTrack,
  remoteUser,
  changeResolution
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [currentRes, setCurrentRes] = useState('auto');

  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }
    return () => {
      localVideoTrack?.stop();
    };
  }, [localVideoTrack]);

  useEffect(() => {
    if (remoteUser?.videoTrack && remoteVideoRef.current) {
      remoteUser.videoTrack.play(remoteVideoRef.current);
    }
    return () => {
      remoteUser?.videoTrack?.stop();
    };
  }, [remoteUser?.videoTrack]);

  const handleResolutionChange = (res) => {
    setCurrentRes(res);
    changeResolution(res);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-between">
      
      {/* Remote Video (Full Screen) */}
      <div 
        ref={remoteVideoRef} 
        className="absolute inset-0 w-full h-full bg-gray-900 flex items-center justify-center"
      >
        {!remoteUser?.hasVideo && (
          <div className="text-white/50 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4 text-2xl font-bold">
              {remoteUser ? remoteUser.uid?.toString().slice(0, 2).toUpperCase() : 'U'}
            </div>
            <span>Camera Off</span>
          </div>
        )}
      </div>

      {/* Local Video (Floating Picture-in-Picture) */}
      <div className="absolute top-12 right-4 w-28 h-40 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700/50 z-10">
        {isVideoOn ? (
          <div ref={localVideoRef} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
            <VideoOff size={24} />
          </div>
        )}
      </div>

      {/* Top Bar (Resolution) */}
      <div className="absolute top-12 left-4 z-10">
        <VideoResolutionSelector 
          currentResolution={currentRes} 
          changeResolution={handleResolutionChange} 
        />
      </div>

      {/* Bottom Section Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6 w-full px-4 z-10">
        <button
          onClick={switchCamera}
          className="p-4 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
        >
          <Camera size={24} />
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full flex items-center justify-center transition-colors backdrop-blur-md ${!isVideoOn ? 'bg-white text-gray-900' : 'bg-black/40 text-white hover:bg-black/60'}`}
        >
          {!isVideoOn ? <VideoOff size={24} /> : <Video size={24} />}
        </button>

        {/* End Button */}
        <button
          onClick={endCall}
          className="p-5 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
        >
          <PhoneOff size={28} className="text-white" />
        </button>

        <button
          onClick={toggleMute}
          className={`p-4 rounded-full flex items-center justify-center transition-colors backdrop-blur-md ${isMuted ? 'bg-white text-gray-900' : 'bg-black/40 text-white hover:bg-black/60'}`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
      </div>
    </div>
  );
}
