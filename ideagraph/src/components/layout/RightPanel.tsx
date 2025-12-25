import { memo, useEffect, useRef } from 'react';
import { X, FileText, ClipboardCheck, Compass } from 'lucide-react';
import { usePanelContext, Z_INDEX } from '../../contexts/PanelContext';
import { ResizeHandle } from './ResizeHandle';
import { MobileDrawer } from '../ui/MobileDrawer';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface RightPanelProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: 'detail' | 'screening' | 'workflow';
  onClose?: () => void;
}

const ICON_MAP = {
  detail: FileText,
  screening: ClipboardCheck,
  workflow: Compass,
};

export const RightPanel = memo(function RightPanel({
  children,
  title,
  subtitle,
  icon = 'detail',
  onClose,
}: RightPanelProps) {
  const { rightPanel, closeRightPanel, rightWidth, resizeRightPanel } = usePanelContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handleClose = onClose || closeRightPanel;
  const Icon = ICON_MAP[icon];

  // Focus panel when opened
  useEffect(() => {
    if (rightPanel && panelRef.current) {
      panelRef.current.focus();
    }
  }, [rightPanel]);

  if (!rightPanel) return null;

  // Mobile view - use bottom drawer for better UX
  if (isMobile) {
    return (
      <MobileDrawer
        isOpen={!!rightPanel}
        onClose={handleClose}
        position="bottom"
        title={title}
        showCloseButton={true}
      >
        {subtitle && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Icon size={16} className="text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </MobileDrawer>
    );
  }

  // Desktop view
  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      className="relative bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 overflow-hidden animate-in slide-in-from-right duration-200"
      style={{ zIndex: Z_INDEX.RIGHT_PANEL, width: rightWidth }}
    >
      {/* Resize handle */}
      <ResizeHandle position="right" onResize={resizeRightPanel} />
      {/* Header */}
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon size={18} className="text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </aside>
  );
});

// Wrapper component that shows the right panel based on context
interface RightPanelContainerProps {
  detailContent: React.ReactNode | null;
  screeningContent: React.ReactNode | null;
  workflowContent: React.ReactNode | null;
}

export const RightPanelContainer = memo(function RightPanelContainer({
  detailContent,
  screeningContent,
  workflowContent,
}: RightPanelContainerProps) {
  const { rightPanel, rightPanelData } = usePanelContext();

  if (!rightPanel) return null;

  switch (rightPanel) {
    case 'detail':
      return (
        <RightPanel
          title="Paper Details"
          subtitle={rightPanelData.paperTitle as string}
          icon="detail"
        >
          {detailContent}
        </RightPanel>
      );
    case 'screening':
      return (
        <RightPanel
          title="Screening"
          subtitle={`${rightPanelData.remaining || 0} papers to screen`}
          icon="screening"
        >
          {screeningContent}
        </RightPanel>
      );
    case 'workflow':
      return (
        <RightPanel
          title="Research Workflow"
          icon="workflow"
        >
          {workflowContent}
        </RightPanel>
      );
    default:
      return null;
  }
});
