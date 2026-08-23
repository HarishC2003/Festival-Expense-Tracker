import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  description = "An unexpected error occurred while loading this content.",
  onRetry,
  className
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-4 animate-fade-in", className)}>
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" strokeWidth={1.5} />
      </div>
      
      <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-md mb-8">
        {description}
      </p>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="inline-flex items-center justify-center px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-foreground text-sm font-medium rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
