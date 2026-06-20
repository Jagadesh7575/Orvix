import React from 'react';
import orvixIcon from '../../assets/untitled folder/5e6123c1-4354-46a7-aea2-120ef7a524cf.png';

export default function LogoLockup({ variant = 'navbar' }) {
  let iconClass = "w-[40px] h-[40px] md:w-[52px] md:h-[52px]";
  let textClass = "text-[28px] md:text-[36px]";
  let gapClass = "gap-[12px] md:gap-[16px]";

  if (variant === 'footer') {
    iconClass = "w-[40px] h-[40px]";
    textClass = "text-[28px]";
    gapClass = "gap-[14px]";
  }

  return (
    <div className={`flex items-center ${gapClass}`}>
      <img
        src={orvixIcon}
        alt="Orvix"
        className={`${iconClass} object-contain shrink-0`}
      />
      <span 
        className={`text-white ${textClass} font-semibold tracking-[0.18em] uppercase leading-none font-['Michroma']`}
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 20px rgba(255,255,255,0.05)'
        }}
      >
        ORVIX
      </span>
    </div>
  );
}
