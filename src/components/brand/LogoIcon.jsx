import React from 'react';
import officialIcon from '../../assets/orvix-official-icon.png';

export default function LogoIcon({ className = "w-12 h-12" }) {
  return (
    <img 
      src={officialIcon} 
      alt="Orvix Icon" 
      className={`object-contain flex-shrink-0 ${className}`} 
    />
  );
}
