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
      if (minLength && currentLength < minLength) return 'text-red-500';
      if (maxLength && currentLength > maxLength * 0.9) return 'text-amber-500';
      return 'text-gray-400';
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            value={value}
            className={`
              w-full px-3 py-2
              border rounded-lg
              bg-white dark:bg-gray-700
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              transition-colors resize-none
              ${error
                ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
            {...props}
          />
          {showCount && (
            <div className={`absolute bottom-2 right-2 text-xs ${getCountColor()}`}>
              {currentLength}
              {minLength && currentLength < minLength && ` / ${minLength} min`}
              {maxLength && ` / ${maxLength}`}
            </div>
          )}
        </div>
        {error && (
          <p id={`${textareaId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
