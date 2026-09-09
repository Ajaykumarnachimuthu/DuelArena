import React, { useState, useRef, useEffect, useCallback } from 'react';

interface HoverMarqueeTextProps {
  text: string;
  className?: string;
  title?: string;
  speedPxPerSec?: number;
  minDuration?: number;
}

export const HoverMarqueeText: React.FC<HoverMarqueeTextProps> = ({
  text,
  className = '',
  title,
  speedPxPerSec = 35,
  minDuration = 2.5
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [overflowDistance, setOverflowDistance] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const checkOverflow = useCallback(() => {
    if (containerRef.current && textRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const textWidth = textRef.current.scrollWidth;
      const dist = textWidth - containerWidth;
      if (dist > 3) {
        setIsOverflowing(true);
        setOverflowDistance(dist);
      } else {
        setIsOverflowing(false);
        setOverflowDistance(0);
      }
    }
  }, []);

  useEffect(() => {
    checkOverflow();
    const handleResize = () => checkOverflow();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [text, checkOverflow]);

  const duration = Math.max(minDuration, overflowDistance / speedPxPerSec);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        checkOverflow();
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
      className="overflow-hidden min-w-0 flex-1 whitespace-nowrap relative cursor-pointer select-none"
      title={title || text}
    >
      <span
        ref={textRef}
        className={`inline-block transition-transform ${className} ${
          !isHovered && isOverflowing ? 'truncate block' : ''
        }`}
        style={
          isHovered && isOverflowing
            ? {
                animationName: 'hover-scroll-marquee',
                animationDuration: `${duration}s`,
                animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                animationIterationCount: 'infinite',
                animationDirection: 'alternate',
                ['--marquee-shift' as any]: `-${overflowDistance + 8}px`,
                transform: `translateX(-${overflowDistance + 8}px)`
              }
            : {
                transform: 'translateX(0px)',
                transitionDuration: '0.3s',
                transitionTimingFunction: 'ease-out'
              }
        }
      >
        {text}
      </span>
    </div>
  );
};

export default HoverMarqueeText;
