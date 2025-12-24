import { forwardRef, type InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
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
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3.5 py-2.5
            border rounded-lg
            bg-white dark:bg-zinc-800
            text-stone-800 dark:text-zinc-100
            placeholder:text-stone-400 dark:placeholder:text-zinc-500
            transition-all
            ${error
              ? 'border-rose-300 dark:border-rose-800/50 focus:outline-none focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-500/20 focus:border-rose-400 dark:focus:border-rose-500/50'
              : 'border-stone-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 focus:border-indigo-200 dark:focus:border-indigo-500/40'
            }
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stone-50 dark:disabled:bg-zinc-900
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-500 dark:text-rose-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
