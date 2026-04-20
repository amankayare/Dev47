import React from 'react';
import { cn } from '@/lib/utils';

type RippleLoaderProps = {
  className?: string;
  count?: number;
  color?: string;
  size?: number;
  speed?: number;
  opacity?: number;
};

export function RippleLoader({
  className,
  count = 4,
  color = 'currentColor',
  size = 80,
  speed = 2,
  opacity = 0.2,
}: RippleLoaderProps) {
  const circles = Array.from({ length: count }).map((_, index) => (
    <div
      key={index}
      className={cn(
        'absolute inset-0 m-auto',
        'rounded-full border',
        'opacity-0',
        'origin-center',
        className
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderColor: color,
        borderWidth: '1px',
        animation: `ripple ${speed}s infinite ease-out`,
        animationDelay: `${(index * speed) / count}s`,
        '--ripple-opacity': opacity,
        '--ripple-scale': 3,
      } as React.CSSProperties}
      aria-hidden="true"
    />
  ));

  return (
    <div 
      className={cn(
        'relative w-full h-full',
        'flex items-center justify-center',
        'pointer-events-none',
        className
      )}
      aria-label="Loading..."
    >
      <div className="relative" style={{ width: size, height: size }}>
        {circles}
      </div>
    </div>
  );
}
