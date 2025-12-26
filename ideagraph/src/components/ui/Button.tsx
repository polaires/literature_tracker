import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  shortcut?: string;
}

// Cream/Stone theme button styles
const variantClasses = {
  primary: 'bg-stone-800 text-white hover:bg-stone-900 shadow-sm hover:shadow disabled:bg-stone-400 dark:bg-stone-700 dark:hover:bg-stone-600 dark:disabled:bg-stone-800',
  secondary: 'bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-700 border border-stone-200 dark:border-zinc-700',
  ghost: 'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-800 dark:hover:text-zinc-200',
  danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm disabled:bg-rose-300 dark:bg-rose-600 dark:hover:bg-rose-500',
};

const sizeClasses = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      shortcut,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-1.5
          font-medium rounded-lg
          transition-all duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 dark:focus-visible:ring-stone-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900
          disabled:cursor-not-allowed disabled:opacity-50
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Loader2 size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} className="animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
        {shortcut && !loading && (
          <kbd className="hidden md:inline-flex ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-black/10 dark:bg-white/10 rounded">
            {shortcut}
          </kbd>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
