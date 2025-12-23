import { useState, useCallback, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizeHandleProps {
  position: 'left' | 'right';
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
}

export function ResizeHandle({ position, onResize, onResizeEnd }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const lastXRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    lastXRef.current = e.clientX;
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      // For left panel, positive delta increases width
      // For right panel, negative delta increases width
      onResize(position === 'left' ? delta : -delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onResizeEnd?.();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Add cursor style to body while dragging
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, onResize, onResizeEnd, position]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute top-0 bottom-0 w-1 cursor-col-resize group z-10 ${
        position === 'left' ? '-right-0.5' : '-left-0.5'
      }`}
    >
      {/* Hover/drag indicator */}
      <div
        className={`absolute inset-0 transition-colors ${
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
