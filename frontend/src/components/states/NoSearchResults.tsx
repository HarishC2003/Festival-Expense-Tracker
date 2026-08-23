import React from 'react';
import { SearchX } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface NoSearchResultsProps {
  query: string;
  onClear: () => void;
  className?: string;
}

export const NoSearchResults: React.FC<NoSearchResultsProps> = ({
  query,
  onClear,
  className
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-4 animate-fade-in", className)}>
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <SearchX className="w-8 h-8 text-primary/70" strokeWidth={1.5} />
      </div>
      
      <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
        No results for "{query}"
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-md mb-8">
        Try a different search term or clear the search to see all items.
      </p>
      
      <button 
        onClick={onClear}
        className="inline-flex items-center justify-center px-4 py-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-foreground text-sm font-medium rounded-lg transition-colors"
      >
        Clear Search
      </button>
    </div>
  );
};
