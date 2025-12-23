import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// Panel types
export type RightPanelType = 'detail' | 'screening' | 'workflow' | null;
export type ModalType = 'addPaper' | 'searchPaper' | 'batchImport' | 'dataManager' | 'synthesisMatrix' | 'gapAnalysis' | 'exportOutline' | 'aiSettings' | 'keyboardHelp' | 'citationNetwork' | null;
export type FullScreenType = 'pdf' | null;

interface PanelState {
  // Left sidebar
  leftCollapsed: boolean;
  leftSection: 'papers' | 'filters' | 'ai';

  // Right panel
  rightPanel: RightPanelType;
  rightPanelData: Record<string, unknown>;

  // Modal layer
  activeModal: ModalType;
  modalData: Record<string, unknown>;

  // Full screen overlay
  fullScreenView: FullScreenType;
  fullScreenData: Record<string, unknown>;
}

interface PanelContextValue extends PanelState {
  // Left sidebar actions
  toggleLeftSidebar: () => void;
  setLeftCollapsed: (collapsed: boolean) => void;
  setLeftSection: (section: 'papers' | 'filters' | 'ai') => void;

  // Right panel actions
  openRightPanel: (panel: RightPanelType, data?: Record<string, unknown>) => void;
  closeRightPanel: () => void;

  // Modal actions
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Full screen actions
  openFullScreen: (view: FullScreenType, data?: Record<string, unknown>) => void;
  closeFullScreen: () => void;

  // Escape key handler - closes topmost layer
  handleEscape: () => boolean;
}

const PanelContext = createContext<PanelContextValue | null>(null);

interface PanelProviderProps {
  children: ReactNode;
}

export function PanelProvider({ children }: PanelProviderProps) {
  const [state, setState] = useState<PanelState>({
    leftCollapsed: false,
    leftSection: 'papers',
    rightPanel: null,
    rightPanelData: {},
    activeModal: null,
    modalData: {},
    fullScreenView: null,
    fullScreenData: {},
  });

  // Left sidebar actions
  const toggleLeftSidebar = useCallback(() => {
    setState(prev => ({ ...prev, leftCollapsed: !prev.leftCollapsed }));
  }, []);

  const setLeftCollapsed = useCallback((collapsed: boolean) => {
    setState(prev => ({ ...prev, leftCollapsed: collapsed }));
  }, []);

  const setLeftSection = useCallback((section: 'papers' | 'filters' | 'ai') => {
    setState(prev => ({ ...prev, leftSection: section, leftCollapsed: false }));
  }, []);

  // Right panel actions
  const openRightPanel = useCallback((panel: RightPanelType, data: Record<string, unknown> = {}) => {
    setState(prev => ({ ...prev, rightPanel: panel, rightPanelData: data }));
  }, []);

  const closeRightPanel = useCallback(() => {
    setState(prev => ({ ...prev, rightPanel: null, rightPanelData: {} }));
  }, []);

  // Modal actions
  const openModal = useCallback((modal: ModalType, data: Record<string, unknown> = {}) => {
    setState(prev => ({ ...prev, activeModal: modal, modalData: data }));
  }, []);

  const closeModal = useCallback(() => {
    setState(prev => ({ ...prev, activeModal: null, modalData: {} }));
  }, []);

  // Full screen actions
  const openFullScreen = useCallback((view: FullScreenType, data: Record<string, unknown> = {}) => {
    setState(prev => ({ ...prev, fullScreenView: view, fullScreenData: data }));
  }, []);

  const closeFullScreen = useCallback(() => {
    setState(prev => ({ ...prev, fullScreenView: null, fullScreenData: {} }));
  }, []);

  // Escape key handler - closes topmost layer in order
  const handleEscape = useCallback((): boolean => {
    // Priority: Full screen > Modal > Right panel
    if (state.fullScreenView) {
      closeFullScreen();
      return true;
    }
    if (state.activeModal) {
      closeModal();
      return true;
    }
    if (state.rightPanel) {
      closeRightPanel();
      return true;
    }
    return false;
  }, [state.fullScreenView, state.activeModal, state.rightPanel, closeFullScreen, closeModal, closeRightPanel]);

  const value: PanelContextValue = {
    ...state,
    toggleLeftSidebar,
    setLeftCollapsed,
    setLeftSection,
    openRightPanel,
    closeRightPanel,
    openModal,
    closeModal,
    openFullScreen,
    closeFullScreen,
    handleEscape,
  };

  return (
    <PanelContext.Provider value={value}>
      {children}
    </PanelContext.Provider>
  );
}

export function usePanelContext() {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanelContext must be used within a PanelProvider');
  }
  return context;
}

// Z-index constants for consistent layering
export const Z_INDEX = {
  BASE: 10,        // Base UI elements
  TOOLTIP: 20,     // Floating tooltips, dropdowns
  RIGHT_PANEL: 30, // Right panel (detail, screening)
  MODAL: 40,       // Modal overlays
  DIALOG: 50,      // Critical dialogs
  FULLSCREEN: 60,  // PDF viewer, full-screen takeover
} as const;
