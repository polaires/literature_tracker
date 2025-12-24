import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  minLength?: number;
  maxLength?: number;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, hint, showCount, minLength, maxLength, id, value, className = '', ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const currentLength = typeof value === 'string' ? value.length : 0;

    const getCountColor = () => {
      if (minLength && currentLength < minLength) return 'text-rose-400 dark:text-rose-500';
      if (maxLength && currentLength > maxLength * 0.9) return 'text-amber-500 dark:text-amber-400';
      return 'text-stone-400 dark:text-zinc-500';
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-stone-600 dark:text-zinc-400 mb-1.5"
          >
            {label}
            {hint && (
              <span className="font-normal text-stone-400 dark:text-zinc-500 ml-1">
                ({hint})
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            value={value}
            className={`
              w-full px-3.5 py-2.5
              border rounded-lg
              bg-white dark:bg-zinc-800
              text-stone-800 dark:text-zinc-100
              placeholder:text-stone-400 dark:placeholder:text-zinc-500
              transition-all resize-none
              ${error
                ? 'border-rose-300 dark:border-rose-800/50 focus:outline-none focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-500/20 focus:border-rose-400 dark:focus:border-rose-500/50'
                : 'border-stone-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 focus:border-indigo-200 dark:focus:border-indigo-500/40'
              }
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stone-50 dark:disabled:bg-zinc-900
              ${showCount ? 'pb-7' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${textareaId}-error` : undefined}
            {...props}
          />
          {showCount && (
            <div className={`absolute bottom-2 right-3 text-[11px] font-medium ${getCountColor()}`}>
              {currentLength}
              {minLength && currentLength < minLength && ` / ${minLength} min`}
              {maxLength && ` / ${maxLength}`}
            </div>
          )}
        </div>
        {error && (
          <p id={`${textareaId}-error`} className="mt-1.5 text-xs text-rose-500 dark:text-rose-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
