import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LoadingContext } from './LoadingContext';
import { LoadingScreen } from './LoadingScreen';

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  const showLoader = () => setIsLoading(true);
  const hideLoader = () => setIsLoading(false);

  // Automatically trigger loading during page navigation
  useEffect(() => {
    if (!isLoading) {
      showLoader();
      // Enforce a minimum display time for the premium aesthetic
      const timer = setTimeout(() => {
        hideLoader();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoader, hideLoader }}>
      {children}
      <LoadingScreen />
    </LoadingContext.Provider>
  );
};
