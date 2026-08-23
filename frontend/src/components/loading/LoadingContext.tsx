import { createContext, useContext } from 'react';

export interface LoadingContextType {
  isLoading: boolean;
  showLoader: () => void;
  hideLoader: () => void;
}

export const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  showLoader: () => {},
  hideLoader: () => {},
});

export const useLoading = () => useContext(LoadingContext);
