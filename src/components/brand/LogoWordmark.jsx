import React from 'react';

export default function LogoWordmark({ className = "text-2xl" }) {
  return (
    <span 
      className={`font-['Michroma'] font-bold tracking-widest uppercase ${className}`}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 0 20px rgba(255,255,255,0.05)'
      }}
    >
      Orvix
    </span>
  );
}
