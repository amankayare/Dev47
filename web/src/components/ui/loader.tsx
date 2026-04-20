import React from 'react';
import { cn } from '@/lib/utils';
import { RippleLoader } from './RippleLoader';

type LoaderProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  fullScreen?: boolean;
};

const sizeMap = {
  sm: 40,
  md: 60,
  lg: 80,
  xl: 100,
};

export function Loader({
  className,
  size = 'md',
  variant = 'primary',
  fullScreen = false,
}: LoaderProps) {
  const containerClass = cn(
    'flex items-center justify-center',
    fullScreen ? 'fixed inset-0 z-50' : 'relative w-full h-full min-h-[120px]',
    fullScreen && 'bg-background/80 dark:bg-background/90 backdrop-blur-sm',
    className
  );

  return (
    <div 
      className={containerClass}
      role="status"
      aria-live="polite"
      aria-busy={true}
    >
      <RippleLoader 
        size={fullScreen ? sizeMap['xl'] : sizeMap[size]} 
        color={variant === 'default' ? 'currentColor' : `hsl(var(--${variant}))`}
        opacity={0.6}
      />
    </div>
  );
}

export function PageLoader() {
  return <Loader size="xl" fullScreen />;
}
