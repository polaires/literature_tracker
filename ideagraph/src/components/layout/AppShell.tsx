import { memo, useEffect, useCallback, type ReactNode } from 'react';
import { PanelProvider, usePanelContext, Z_INDEX } from '../../contexts/PanelContext';

interface AppShellProps {
  children: ReactNode;
}

// Inner component that uses panel context
function AppShellInner({ children }: AppShellProps) {
  const { handleEscape, fullScreenView } = usePanelContext();

  // Global escape key handler
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleEscape();
    }
  }, [handleEscape]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  // Full screen view takes over everything
  if (fullScreenView) {
    return (
      <div
        className="fixed inset-0 bg-gray-900"
        style={{ zIndex: Z_INDEX.FULLSCREEN }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {children}
    </div>
  );
}

// Main AppShell with provider
export const AppShell = memo(function AppShell({ children }: AppShellProps) {
  return (
    <PanelProvider>
      <AppShellInner>{children}</AppShellInner>
    </PanelProvider>
  );
});

// Layout components for composing the shell
interface AppShellHeaderProps {
  children: ReactNode;
}

export const AppShellHeader = memo(function AppShellHeader({ children }: AppShellHeaderProps) {
  return <>{children}</>;
});

interface AppShellBodyProps {
  children: ReactNode;
}

export const AppShellBody = memo(function AppShellBody({ children }: AppShellBodyProps) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {children}
    </div>
  );
});

interface AppShellMainProps {
  children: ReactNode;
  className?: string;
}

export const AppShellMain = memo(function AppShellMain({ children, className = '' }: AppShellMainProps) {
  return (
    <main className={`flex-1 overflow-hidden ${className}`}>
      {children}
    </main>
  );
});

// Modal backdrop component
interface ModalBackdropProps {
  children: ReactNode;
  onClose: () => void;
}

export const ModalBackdrop = memo(function ModalBackdrop({ children, onClose }: ModalBackdropProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: Z_INDEX.MODAL }}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative">
        {children}
      </div>
    </div>
  );
});

// Export layout index file
export { TopHeader } from './TopHeader';
export { LeftSidebar } from './LeftSidebar';
export { RightPanel, RightPanelContainer } from './RightPanel';
