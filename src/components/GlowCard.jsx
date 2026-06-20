import React, { useEffect, useRef } from 'react';

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 }
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96'
};

let globalPointerListenerAdded = false;
let lastGlowMove = 0;

const syncPointer = (e) => {
  const now = performance.now();
  if (now - lastGlowMove < 16) return; // Throttle ~60fps
  lastGlowMove = now;
  
  const x = e.clientX.toFixed(2);
  const xp = (e.clientX / window.innerWidth).toFixed(2);
  const y = e.clientY.toFixed(2);
  const yp = (e.clientY / window.innerHeight).toFixed(2);
  
  // Use requestAnimationFrame for smooth layout painting
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--x', x);
    document.documentElement.style.setProperty('--xp', xp);
    document.documentElement.style.setProperty('--y', y);
    document.documentElement.style.setProperty('--yp', yp);
  });
};

export const GlowCard = ({ 
  children, 
  className = '', 
  glowColor = 'purple',
  size = 'md',
  width,
  height,
  customSize = false
}) => {
  const cardRef = useRef(null);
  const innerRef = useRef(null);

  useEffect(() => {
    if (!globalPointerListenerAdded) {
      // Don't track pointer on mobile/touch devices to save battery/performance
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      if (!isTouch) {
        document.addEventListener('pointermove', syncPointer, { passive: true });
      }
      globalPointerListenerAdded = true;
    }
  }, []);

  const colorConfig = glowColorMap[glowColor] || glowColorMap.purple;
  const base = colorConfig.base;
  const spread = colorConfig.spread;

  const getSizeClasses = () => {
    if (customSize) {
      return ''; 
    }
    return sizeMap[size];
  };

  const getInlineStyles = () => {
    const baseStyles = {
      '--base': base,
      '--spread': spread,
      '--radius': '14',
      '--border': '2',
      '--backdrop': 'hsl(0 0% 60% / 0.12)',
      '--backup-border': 'var(--backdrop)',
      '--size': '300',
      '--outer': '1',
      '--border-size': 'calc(var(--border, 2) * 1px)',
      '--spotlight-size': 'calc(var(--size, 150) * 1px)',
      '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)), transparent
      )`,
      backgroundColor: 'var(--backdrop, transparent)',
      backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
      backgroundPosition: '50% 50%',
      backgroundAttachment: 'fixed',
      border: 'var(--border-size) solid var(--backup-border)',
      position: 'relative',
      touchAction: 'none',
    };

    if (width !== undefined) {
      baseStyles.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height !== undefined) {
      baseStyles.height = typeof height === 'number' ? `${height}px` : height;
    }

    return baseStyles;
  };

  return (
    <div
      ref={cardRef}
      data-glow
      style={getInlineStyles()}
      className={`
        ${getSizeClasses()}
        ${!customSize ? 'aspect-[3/4]' : ''}
        rounded-2xl 
        relative 
        shadow-[0_1rem_2rem_-1rem_black] 
        ${className}
      `}
    >
      <div ref={innerRef} data-glow></div>
      {children}
    </div>
  );
};

export default GlowCard;
