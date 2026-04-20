import { useState, useEffect } from 'react';

export function useMinimumLoadTime(minimumTime = 2000) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMinimumTimeElapsed, setIsMinimumTimeElapsed] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);

  useEffect(() => {
    // Start the minimum time timer
    const timer = setTimeout(() => {
      setIsMinimumTimeElapsed(true);
      // If content is already ready, we can set loading to false
      if (isContentReady) {
        setIsLoading(false);
      }
    }, minimumTime);

    return () => clearTimeout(timer);
  }, [minimumTime, isContentReady]);

  const handleContentReady = () => {
    setIsContentReady(true);
    // Only set loading to false if minimum time has elapsed
    if (isMinimumTimeElapsed) {
      setIsLoading(false);
    }
  };

  return { isLoading, handleContentReady };
}
