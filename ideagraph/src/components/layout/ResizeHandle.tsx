import { useState, useCallback, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizeHandleProps {
  position: 'left' | 'right';
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
  disabled?: boolean;
}

export function ResizeHandle({ position, onResize, onResizeEnd, disabled = false }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const lastXRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    lastXRef.current = e.clientX;
  }, [disabled]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    lastXRef.current = e.touches[0].clientX;
  }, [disabled]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      // For left panel, positive delta increases width
      // For right panel, negative delta increases width
      onResize(position === 'left' ? delta : -delta);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const delta = e.touches[0].clientX - lastXRef.current;
      lastXRef.current = e.touches[0].clientX;
      onResize(position === 'left' ? delta : -delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onResizeEnd?.();
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      onResizeEnd?.();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    // Add cursor style to body while dragging
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, onResize, onResizeEnd, position]);

  if (disabled) return null;

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`absolute top-0 bottom-0 w-3 cursor-col-resize group z-10 touch-manipulation ${
        position === 'left' ? '-right-1.5' : '-left-1.5'
      }`}
    >
      {/* Hover/drag indicator */}
      <div
        className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 transition-colors ${
          isDragging
            ? 'bg-indigo-500'
            : 'bg-transparent group-hover:bg-indigo-400/50'
        }`}
      />

      {/* Visual grip handle - centered */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 ${
          position === 'left' ? '-right-2' : '-left-2'
        } opacity-0 group-hover:opacity-100 transition-opacity ${
          isDragging ? 'opacity-100' : ''
        }`}
      >
        <div className="p-1 bg-white dark:bg-gray-700 rounded-md shadow-md border border-gray-200 dark:border-gray-600">
          <GripVertical size={12} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
}
