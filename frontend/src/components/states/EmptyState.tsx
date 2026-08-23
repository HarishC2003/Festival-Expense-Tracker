import React from 'react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  className
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-4 animate-fade-in", className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-primary/70" strokeWidth={1.5} />
        </div>
      )}
      
      <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-8">
          {description}
        </p>
      )}
      
      {action && actionLabel && (
        <button 
          onClick={action}
          className="inline-flex items-center justify-center px-4 py-2 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-glow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
