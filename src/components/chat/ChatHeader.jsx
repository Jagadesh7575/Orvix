import React from 'react';
import { Phone, Video, Lock, MoreVertical, ArrowLeft } from 'lucide-react';
import { isUserActuallyOnline, formatLastSeen } from '../../utils/presence';

export default function ChatHeader({ chatDetails, onBack }) {
  return (
    <div className="px-4 py-3 border-b app-border app-surface backdrop-blur-md flex items-center justify-between z-20 sticky top-0">
      <div className="flex items-center space-x-3">
        <button onClick={onBack} className="md:hidden p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors">
           <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative">
          <div className="w-10 h-10 rounded-full border app-border flex items-center justify-center overflow-hidden" style={{ background: 'var(--theme-bg-soft)' }}>
            {chatDetails?.otherMember?.avatar_url ? (
              <img src={chatDetails.otherMember.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="app-text font-bold">{chatDetails?.otherMember?.full_name?.charAt(0).toUpperCase() || chatDetails?.otherMember?.username?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          {isUserActuallyOnline(chatDetails?.otherMember) && (
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--theme-surface)]" style={{ background: 'var(--theme-success)' }} />
          )}
        </div>
        <div>
          <h3 className="font-semibold app-text text-sm font-display">{chatDetails?.otherMember?.full_name || chatDetails?.otherMember?.username || 'Loading...'}</h3>
          <div className="text-xs font-medium" style={{ color: isUserActuallyOnline(chatDetails?.otherMember) ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}>
            {isUserActuallyOnline(chatDetails?.otherMember) ? 'Online' : (chatDetails?.otherMember?.id ? formatLastSeen(chatDetails.otherMember.last_seen) : 'Offline')}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-0.5 app-muted">
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors hover:text-white"><Video className="w-4 h-4" /></button>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors hover:text-white"><Phone className="w-4 h-4" /></button>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors hover:text-white"><Lock className="w-4 h-4" /></button>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors hover:text-white"><MoreVertical className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
