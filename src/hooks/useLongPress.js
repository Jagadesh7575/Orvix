import { useCallback, useRef } from 'react';

export const useLongPress = ({ 
  onLongPress, 
  onLongPressEnd, 
  onClick, 
  delay = 500, 
  disabled = false 
}) => {
  const timeout = useRef(null);
  const target = useRef(null);
  const isLongPress = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const start = useCallback((e) => {
    if (disabled) return;
    if (e.target) {
      target.current = e.target;
    }
    
    // Store starting position to detect scrolling
    if (e.touches && e.touches.length > 0) {
      startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    isLongPress.current = false;
    timeout.current = setTimeout(() => {
      isLongPress.current = true;
      if (onLongPress) onLongPress(e);
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, delay);
  }, [onLongPress, delay, disabled]);

  const clear = useCallback((e, shouldTriggerClick = true) => {
    if (timeout.current) clearTimeout(timeout.current);
    
    if (shouldTriggerClick && !isLongPress.current && onClick && !disabled) {
      // Prevent default behavior if it's a touch event to avoid double firing
      if (e.cancelable && e.type === 'touchend') {
        e.preventDefault();
      }
      onClick(e);
    }
    
    if (isLongPress.current && onLongPressEnd && !disabled) {
      onLongPressEnd(e);
    }
    
    isLongPress.current = false;
    target.current = null;
  }, [onClick, onLongPressEnd, disabled]);

  const move = useCallback((e) => {
    if (disabled) return;
    if (e.touches && e.touches.length > 0) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = Math.abs(currentX - startPos.current.x);
      const deltaY = Math.abs(currentY - startPos.current.y);
      
      // Cancel long press if scrolled more than 10px
      if (deltaX > 10 || deltaY > 10) {
        clear(e, false);
      }
    }
  }, [clear, disabled]);

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: (e) => clear(e, false),
    onTouchEnd: clear,
    onTouchMove: move,
    onTouchCancel: (e) => clear(e, false),
    onContextMenu: (e) => {
      if (!disabled) {
         e.preventDefault();
      }
    }
  };
};
