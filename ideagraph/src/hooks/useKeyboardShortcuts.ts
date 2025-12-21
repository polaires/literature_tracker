import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onNewPaper?: () => void;
  onSearch?: () => void;
  onToggleView?: () => void;
  onExport?: () => void;
  onEscape?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onEnter?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only allow Escape in inputs
        if (event.key === 'Escape' && handlers.onEscape) {
          handlers.onEscape();
          return;
        }
        return;
      }

      const isMod = event.metaKey || event.ctrlKey;

      // Cmd/Ctrl + N - New paper
      if (isMod && event.key === 'n') {
        event.preventDefault();
        handlers.onNewPaper?.();
        return;
      }

      // Cmd/Ctrl + F - Focus search
      if (isMod && event.key === 'f') {
        event.preventDefault();
        handlers.onSearch?.();
        return;
      }

      // Cmd/Ctrl + G - Toggle graph/list view
      if (isMod && event.key === 'g') {
        event.preventDefault();
        handlers.onToggleView?.();
        return;
      }

      // Cmd/Ctrl + E - Export
      if (isMod && event.key === 'e') {
        event.preventDefault();
        handlers.onExport?.();
        return;
      }

      // Escape - Close modals/panels
      if (event.key === 'Escape') {
        handlers.onEscape?.();
        return;
      }

      // Arrow keys for navigation
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        handlers.onNavigateUp?.();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        handlers.onNavigateDown?.();
        return;
      }

      // Enter to open selected
      if (event.key === 'Enter') {
        handlers.onEnter?.();
        return;
      }
    },
    [handlers]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Keyboard shortcuts help text
export const KEYBOARD_SHORTCUTS = [
  { keys: ['Cmd/Ctrl', 'N'], action: 'Add new paper' },
  { keys: ['Cmd/Ctrl', 'F'], action: 'Focus search' },
  { keys: ['Cmd/Ctrl', 'G'], action: 'Toggle graph/list view' },
  { keys: ['Cmd/Ctrl', 'E'], action: 'Export data' },
  { keys: ['Escape'], action: 'Close modal/panel' },
  { keys: ['↑', '↓'], action: 'Navigate papers' },
  { keys: ['Enter'], action: 'Open selected paper' },
] as const;
