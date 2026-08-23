import React from 'react';

export interface LoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Loader: React.FC<LoaderProps> = ({ fullScreen = false, size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  const spinner = (
    <div className={`${sizes[size]} border-2 border-indigo-500
                     border-t-transparent rounded-full animate-spin`} />
  )
  if (fullScreen) return (
    <div className="fixed inset-0 bg-[#0F172A] flex items-center
                    justify-center z-50">
      {spinner}
    </div>
  )
  return spinner
}
