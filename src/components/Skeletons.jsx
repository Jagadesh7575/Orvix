import React from 'react';
import { motion } from 'framer-motion';

export const Shimmer = () => (
  <motion.div 
    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
    animate={{ translateX: ['-100%', '200%'] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
  />
);

export const ListSkeleton = ({ rows = 5 }) => (
  <div className="space-y-4 w-full">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center p-4 bg-surface rounded-2xl border border-white/5 shadow-sm relative overflow-hidden">
        <Shimmer />
        <div className="w-12 h-12 rounded-full bg-white/5 flex-shrink-0" />
        <div className="ml-4 flex-1 space-y-2">
          <div className="h-4 bg-white/5 rounded w-1/3" />
          <div className="h-3 bg-white/5 rounded w-1/4" />
        </div>
        <div className="ml-2 w-20 h-8 bg-white/5 rounded-xl flex-shrink-0" />
      </div>
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="px-4 pt-4 pb-2 md:max-w-xl mx-auto w-full relative overflow-hidden">
    <Shimmer />
    <div className="flex items-center space-x-6 mb-5">
      <div className="w-[86px] h-[86px] rounded-full bg-white/5 flex-shrink-0" />
      <div className="flex flex-col flex-1 justify-center space-y-3">
        <div className="h-5 bg-white/5 rounded w-1/2" />
        <div className="flex space-x-8">
          <div className="h-4 bg-white/5 rounded w-16" />
          <div className="h-4 bg-white/5 rounded w-16" />
        </div>
      </div>
    </div>
    <div className="h-10 w-full bg-white/5 rounded-2xl" />
  </div>
);

export const ChatSkeleton = () => (
  <div className="space-y-4 px-4 py-6 w-full h-full overflow-hidden relative">
    <Shimmer />
    {[true, false, true, true, false].map((isMine, i) => (
      <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
        <div className={`h-10 rounded-2xl bg-white/5 ${isMine ? 'w-2/3 rounded-tr-sm' : 'w-1/2 rounded-tl-sm'}`} />
      </div>
    ))}
  </div>
);
