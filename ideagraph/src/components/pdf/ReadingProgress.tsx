// Reading Progress Component
// Displays PDF reading progress as current page / total pages

import { memo } from 'react';
import { BookOpen } from 'lucide-react';

interface ReadingProgressProps {
  currentPage: number;
  totalPages: number;
  variant?: 'compact' | 'full';
  className?: string;
}

/**
 * Reading progress showing current page and percentage
 */
export const ReadingProgress = memo(function ReadingProgress({
  currentPage,
  totalPages,
  variant = 'compact',
  className = '',
}: ReadingProgressProps) {
  const percentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <BookOpen size={14} className="text-stone-400" />
        <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden min-w-[60px]">
          <div
            className="h-full bg-stone-600 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-medium text-stone-500 whitespace-nowrap">
          {currentPage}/{totalPages}
        </span>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-500 flex items-center gap-1">
          <BookOpen size={12} />
          Reading Progress
        </span>
        <span className="text-xs font-medium text-stone-600">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-stone-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-stone-400 text-center">
        {percentage}% complete
      </p>
    </div>
  );
});
