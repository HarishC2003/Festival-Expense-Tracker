import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

export const SubmissionOverlay = ({ isSubmitting, text = "Submitting...", progress }: { isSubmitting: boolean, text?: string, progress?: number }) => {
  if (!isSubmitting || typeof document === 'undefined') return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
      {progress === undefined ? (
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
      ) : (
        <div className="w-64 h-4 bg-secondary rounded-full overflow-hidden mb-4 relative shadow-inner">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%`}} />
        </div>
      )}
      <p className="text-xl font-medium text-foreground animate-pulse">
        {text} {progress !== undefined ? `${Math.round(progress)}%` : ''}
      </p>
    </div>,
    document.body
  );
};
