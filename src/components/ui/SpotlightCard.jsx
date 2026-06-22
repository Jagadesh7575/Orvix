import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function SpotlightCard({ children, className = '', containerClassName = '' }) {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative rounded-3xl border border-white/10 bg-theme-surface/50 overflow-hidden ${containerClassName}`}
    >
      <div
        ref={divRef}
        onMouseMove={handleMouseMove}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative h-full w-full rounded-3xl p-6 backdrop-blur-md ${className}`}
        style={{
          background: 'linear-gradient(to bottom right, rgba(255,255,255,0.03), rgba(255,255,255,0.01))'
        }}
      >
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(124, 58, 237, 0.15), transparent 40%)`
          }}
        />
        <div className="relative z-10 h-full">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
