import React, { useState, useEffect } from 'react';
import { Spinner } from './Spinner';

interface PageLoaderProps {
  message?: string;
  className?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message, className }) => {
  const [loadingState, setLoadingState] = useState<'normal' | 'slow' | 'very_slow'>('normal');

  useEffect(() => {
    const slowTimer = setTimeout(() => {
      setLoadingState('slow');
    }, 3000);

    const verySlowTimer = setTimeout(() => {
      setLoadingState('very_slow');
    }, 10000);

    return () => {
      clearTimeout(slowTimer);
      clearTimeout(verySlowTimer);
    };
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] w-full bg-background relative ${className || ''}`}>
      {/* Background Glow matching oil-lamp */}
      <div className="absolute w-32 h-32 rounded-full bg-cyan-500/10 blur-[40px] animate-pulse-slow pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        <Spinner size="lg" />
        
        <div className="text-center min-h-[60px]">
          {message && <h3 className="text-lg font-medium text-foreground mb-2">{message}</h3>}
          
          <div className="transition-opacity duration-500">
            {loadingState === 'slow' && (
              <p className="text-sm text-muted-foreground animate-fade-in">
                This is taking longer than usual…
              </p>
            )}
            {loadingState === 'very_slow' && (
              <p className="text-sm text-muted-foreground animate-fade-in">
                Still trying — check your connection.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
