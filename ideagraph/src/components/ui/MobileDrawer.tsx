import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position: 'left' | 'right' | 'bottom';
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  className?: string;
}

export function MobileDrawer({
  isOpen,
  onClose,
  position,
  title,
  children,
  showCloseButton = true,
  className = '',
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const startTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startTouchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startTouchRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startTouchRef.current.x;
    const deltaY = touch.clientY - startTouchRef.current.y;

    const threshold = 100; // Minimum swipe distance

    // Swipe left to close left drawer
    if (position === 'left' && deltaX < -threshold && Math.abs(deltaY) < Math.abs(deltaX)) {
      onClose();
    }
    // Swipe right to close right drawer
    if (position === 'right' && deltaX > threshold && Math.abs(deltaY) < Math.abs(deltaX)) {
      onClose();
    }
    // Swipe down to close bottom drawer
    if (position === 'bottom' && deltaY > threshold && Math.abs(deltaY) > Math.abs(deltaX)) {
      onClose();
    }

    startTouchRef.current = null;
  };

  if (!isOpen) return null;

  const positionClasses = {
    left: 'inset-y-0 left-0 w-[85vw] max-w-sm animate-slide-in-left',
    right: 'inset-y-0 right-0 w-[85vw] max-w-sm animate-slide-in-right',
    bottom: 'inset-x-0 bottom-0 h-[85vh] max-h-[85vh] rounded-t-2xl animate-slide-in-bottom',
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`
          absolute bg-[#FDFBF7] dark:bg-gray-900 shadow-2xl flex flex-col
          safe-area-inset
          ${positionClasses[position]}
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-gray-700 flex-shrink-0">
            {title && (
              <h2
                id="drawer-title"
                className="text-lg font-semibold text-stone-800 dark:text-white"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-stone-500 hover:text-stone-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-stone-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Drag handle for bottom drawer */}
        {position === 'bottom' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
