import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div 
      className="w-full min-h-[100dvh] font-sans relative selection:bg-primary/30 selection:text-text transition-colors duration-500 app-bg app-text"
      style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}
    >
      {/* Global Background Glow for native app */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] pointer-events-none z-0" style={{ background: 'var(--theme-secondary)', opacity: 0.05 }} />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] pointer-events-none z-0" style={{ background: 'var(--theme-primary)', opacity: 0.05 }} />
      
      <main className="w-full z-10 relative">
        <Outlet />
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}
