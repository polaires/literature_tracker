import { memo } from 'react';
import {
  Menu,
  X,
  List,
  Network,
  Calendar,
  GitBranch,
  Plus,
  FileText,
  Filter,
  Settings,
} from 'lucide-react';
import { usePanelContext } from '../../contexts/PanelContext';
import type { ViewMode } from './TopHeader';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  paperCount: number;
  connectionCount: number;
  thesisTitle: string;
}

const viewModes: { mode: ViewMode; icon: typeof List; label: string }[] = [
  { mode: 'list', icon: List, label: 'List View' },
  { mode: 'graph', icon: Network, label: 'Graph View' },
  { mode: 'timeline', icon: Calendar, label: 'Timeline' },
  { mode: 'arguments', icon: GitBranch, label: 'Arguments' },
];

export const MobileNav = memo(function MobileNav({
  isOpen,
  onClose,
  viewMode,
  onViewModeChange,
  paperCount,
  connectionCount,
  thesisTitle,
}: MobileNavProps) {
  const { openModal, openRightPanel } = usePanelContext();

  if (!isOpen) return null;

  const handleViewChange = (mode: ViewMode) => {
    onViewModeChange(mode);
    onClose();
  };

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="absolute inset-y-0 right-0 w-72 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl animate-slide-in-right safe-area-inset flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Menu</span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Thesis Info */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Current Thesis
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
            {thesisTitle}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <FileText size={12} />
              {paperCount} papers
            </span>
            <span className="flex items-center gap-1">
              <Network size={12} />
              {connectionCount} connections
            </span>
          </div>
        </div>

        {/* View Modes */}
        <div className="px-2 py-3 border-b border-gray-200 dark:border-gray-700">
          <p className="px-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            View Mode
          </p>
          <div className="space-y-1">
            {viewModes.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => handleViewChange(mode)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-2 py-3 flex-1">
          <p className="px-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Quick Actions
          </p>
          <div className="space-y-1">
            <button
              onClick={() => handleAction(() => openModal('addPaper'))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Plus size={18} className="text-indigo-500" />
              Add Paper
            </button>
            <button
              onClick={() => handleAction(() => openRightPanel('screening'))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Filter size={18} className="text-amber-500" />
              Screening
            </button>
            <button
              onClick={() => handleAction(() => openModal('aiSettings'))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings size={18} className="text-gray-500" />
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Mobile menu trigger button
interface MobileMenuButtonProps {
  onClick: () => void;
}

export const MobileMenuButton = memo(function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
      aria-label="Open menu"
    >
      <Menu size={20} />
    </button>
  );
});
