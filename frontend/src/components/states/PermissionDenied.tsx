import React from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface PermissionDeniedProps {
  description?: string;
  className?: string;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  description = "You don't have the necessary roles or privileges to view this content.",
  className
}) => {
  const navigate = useNavigate();

  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-20 px-4 animate-fade-in", className)}>
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-red-500" strokeWidth={1.5} />
      </div>
      
      <h3 className="text-2xl font-serif font-bold text-foreground mb-3">
        You don't have permission to do this.
      </h3>
      
      <p className="text-base text-muted-foreground max-w-md mb-8">
        {description}
      </p>
      
      <button 
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center justify-center px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors shadow-sm"
      >
        Back to Dashboard
      </button>
    </div>
  );
};
