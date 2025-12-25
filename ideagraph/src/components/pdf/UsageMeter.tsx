// Usage Meter Component
// Displays AI credit usage as a percentage bar

import { memo } from 'react';
import type { UsageDisplay } from '../../services/usage';

interface UsageMeterProps {
  usage: UsageDisplay;
  variant?: 'compact' | 'full';
  showLabel?: boolean;
  className?: string;
}

/**
 * Usage meter showing credit remaining as percentage
 */
export const UsageMeter = memo(function UsageMeter({
  usage,
  variant = 'compact',
  showLabel = true,
  className = '',
}: UsageMeterProps) {
  // Determine color based on remaining percentage
  const getBarColor = () => {
    if (usage.isExhausted) return 'bg-red-500';
    if (usage.isCritical) return 'bg-red-400';
    if (usage.isLow) return 'bg-amber-400';
    return 'bg-emerald-500';
  };

  const getTextColor = () => {
    if (usage.isExhausted) return 'text-red-600 dark:text-red-400';
    if (usage.isCritical) return 'text-red-500 dark:text-red-400';
    if (usage.isLow) return 'text-amber-600 dark:text-amber-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getBarColor()} transition-all duration-300`}
            style={{ width: `${usage.percentageRemaining}%` }}
          />
        </div>
        {showLabel && (
          <span className={`text-xs font-medium whitespace-nowrap ${getTextColor()}`}>
            {usage.percentageRemaining}%
          </span>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          AI Credits
        </span>
        <span className={`text-xs font-medium ${getTextColor()}`}>
          {usage.formattedRemaining}
        </span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor()} transition-all duration-300`}
          style={{ width: `${usage.percentageRemaining}%` }}
        />
      </div>
      {usage.isLow && !usage.isExhausted && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Running low on credits
        </p>
      )}
      {usage.isExhausted && (
        <p className="text-xs text-red-600 dark:text-red-400">
          No credits remaining
        </p>
      )}
    </div>
  );
});
