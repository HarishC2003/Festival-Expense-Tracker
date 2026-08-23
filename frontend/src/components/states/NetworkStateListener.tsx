import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export const NetworkStateListener: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
      toast.success('Back online', { duration: 3000 });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500/90 text-white px-4 py-2 flex items-center justify-center gap-2 backdrop-blur-md shadow-sm animate-slide-in">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">You're offline — changes won't be saved</span>
    </div>
  );
};
