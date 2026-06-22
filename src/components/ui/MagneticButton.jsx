import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function MagneticButton({ children, className = '', onClick, href, download }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    if (window.innerWidth < 768) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;
  const commonProps = {
    ref,
    onMouseMove: handleMouse,
    onMouseLeave: reset,
    animate: { x, y },
    transition: { type: "spring", stiffness: 350, damping: 25, mass: 0.5 },
    className: `relative inline-flex items-center justify-center font-button font-semibold overflow-hidden transition-all duration-300 ${className}`,
    onClick
  };

  if (href) {
    return (
      <motion.a href={href} download={download} {...commonProps}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button {...commonProps}>
      {children}
    </motion.button>
  );
}
