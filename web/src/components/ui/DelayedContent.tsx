import { ReactNode, useEffect, useState } from 'react';
import { Loader } from './loader';
import { useMinimumLoadTime } from '@/hooks/useMinimumLoadTime';
import { cn } from '@/lib/utils';

interface DelayedContentProps {
  children: ReactNode;
  delay?: number;
  loadingText?: string;
  fullScreen?: boolean;
  className?: string;
}

export function DelayedContent({
  children,
  delay = 2000,
  loadingText = 'Loading...',
  fullScreen = true,
  className = '',
}: DelayedContentProps) {
  const { isLoading, handleContentReady } = useMinimumLoadTime(delay);
  const [isClient, setIsClient] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Mark content as ready after a short delay to ensure smooth transitions
    const readyTimer = setTimeout(() => {
      setIsContentReady(true);
      handleContentReady();
    }, 100);

    return () => {
      clearTimeout(readyTimer);
    };
  }, [handleContentReady]);

  // Don't render anything during SSR to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  // Show loader if either content is not ready or minimum time hasn't elapsed
  if (isLoading) {
    return (
      <div 
        className={cn(
          fullScreen 
            ? 'fixed inset-0 z-50 w-screen h-screen' 
            : 'relative w-full h-full min-h-[200px]',
          'flex items-center justify-center',
          className
        )}
      >
        <Loader 
          size={fullScreen ? 'xl' : 'lg'}
          text={loadingText}
          fullScreen={fullScreen}
        />
      </div>
    );
  }

  // Fade in content when ready
  return (
    <div className={cn(
      'w-full h-full',
      'transition-opacity duration-300',
      isContentReady ? 'opacity-100' : 'opacity-0',
      className
    )}>
      {children}
    </div>
  );
}
