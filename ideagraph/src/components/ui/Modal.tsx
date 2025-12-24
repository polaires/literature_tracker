import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string; // For custom sizing
}

// Slightly wider defaults for a more spacious feel
const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
  full: 'max-w-4xl',
};

export function Modal({
  isOpen = true,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Store currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the modal
    modalRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      // Restore focus
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop - softer, less harsh */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content - softer shadows and borders */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative bg-white dark:bg-zinc-900
          rounded-2xl shadow-xl
          border border-stone-200/60 dark:border-zinc-800
          w-full ${className || sizeClasses[size]}
          max-h-[90vh] overflow-hidden
          flex flex-col
          animate-in fade-in zoom-in-95 duration-200
        `}
      >
        {/* Header - cleaner, more minimal */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-zinc-800">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-stone-800 dark:text-zinc-100"
            >
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={title ? "flex-1 overflow-y-auto" : ""}>
          {children}
        </div>
      </div>
    </div>
  );
}
