import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  List,
  Network,
  Calendar,
  GitBranch,
  Plus,
  ChevronDown,
  Globe,
  Upload,
  PanelLeftClose,
  PanelLeft,
  Menu,
} from 'lucide-react';
import { usePanelContext } from '../../contexts/PanelContext';
import { Button } from '../ui';
import { UserMenu } from '../auth';
import { MobileNav } from './MobileNav';

export type ViewMode = 'list' | 'graph' | 'timeline' | 'arguments';

interface TopHeaderProps {
  thesis: { id: string; title: string; description?: string };
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  paperCount: number;
  connectionCount: number;
}

// Brand Logo Component
function BrandLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient id="headerBrandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="headerNodeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#headerBrandGradient)" />
      <circle cx="24" cy="24" r="5" fill="white" />
      <circle cx="14" cy="16" r="3" fill="url(#headerNodeGlow)" />
      <circle cx="34" cy="16" r="3" fill="url(#headerNodeGlow)" />
      <circle cx="12" cy="30" r="3" fill="url(#headerNodeGlow)" />
      <circle cx="36" cy="30" r="3" fill="url(#headerNodeGlow)" />
      <circle cx="24" cy="38" r="3" fill="url(#headerNodeGlow)" />
      <line x1="24" y1="24" x2="14" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="24" y1="24" x2="34" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="24" y1="24" x2="12" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="24" y1="24" x2="36" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="24" y1="24" x2="24" y2="38" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="14" y1="16" x2="34" y2="16" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" strokeDasharray="2 2" />
      <line x1="12" y1="30" x2="24" y2="38" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" strokeDasharray="2 2" />
    </svg>
  );
}

export const TopHeader = memo(function TopHeader({
  thesis,
  viewMode,
  onViewModeChange,
  paperCount,
  connectionCount,
}: TopHeaderProps) {
  const navigate = useNavigate();
  const { leftCollapsed, toggleLeftSidebar, openModal } = usePanelContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const viewModes: { mode: ViewMode; icon: typeof List; label: string }[] = [
    { mode: 'list', icon: List, label: 'List' },
    { mode: 'graph', icon: Network, label: 'Graph' },
    { mode: 'timeline', icon: Calendar, label: 'Timeline' },
    { mode: 'arguments', icon: GitBranch, label: 'Arguments' },
  ];

  return (
    <>
      <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-3 sm:px-4 gap-2 sm:gap-4 flex-shrink-0 relative z-10 safe-area-top">
        {/* Left: Logo & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Logo - clickable to go home */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity touch-manipulation"
            title="Back to IdeaGraph home"
          >
            <BrandLogo size={28} />
            <span className="text-brand-gradient font-semibold text-lg hidden lg:inline">
              IdeaGraph
            </span>
          </button>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700" />

          {/* Back button on small screens */}
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors sm:hidden touch-manipulation"
            title="Back to theses"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Sidebar toggle (tablet only - hidden on mobile, hidden on desktop) */}
          <button
            onClick={toggleLeftSidebar}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden sm:flex lg:hidden touch-manipulation"
            title={leftCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {leftCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Thesis title */}
          <div className="min-w-0 hidden sm:block">
            <h1 className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate max-w-[150px] md:max-w-[200px] lg:max-w-[300px]">
              {thesis.title}
            </h1>
          </div>
        </div>

        {/* Center: View Mode Tabs - hidden on mobile, shown via MobileNav instead */}
        <div className="flex-1 hidden sm:flex justify-center">
          <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
            {viewModes.map(({ mode, icon: Icon, label }) => {
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode)}
                  className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                    isActive
                      ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-600/50'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden md:inline">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile: Current view indicator (touch to open menu) */}
        <div className="flex-1 sm:hidden flex justify-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
            {(() => {
              const current = viewModes.find(v => v.mode === viewMode);
              const Icon = current?.icon || List;
              return (
                <>
                  <Icon size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {current?.label}
                  </span>
                </>
              );
            })()}
          </div>
        </div>

        {/* Right: Stats & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Stats badge (hidden on mobile and tablet) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {paperCount}
            </span>
            <span className="text-xs text-gray-400">papers</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
              {connectionCount}
            </span>
            <span className="text-xs text-gray-400">links</span>
          </div>

          {/* Add Paper Dropdown - hidden on mobile */}
          <div className="relative group hidden sm:block">
            <Button
              onClick={() => openModal('addPaper')}
              icon={<Plus size={18} />}
              shortcut="N"
              title="Add Paper"
              className="btn-brand"
            >
              <span className="hidden md:inline">Add</span>
              <ChevronDown size={14} className="ml-1 hidden md:block" />
            </Button>

            <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
              <button
                onClick={() => openModal('addPaper')}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-3 transition-colors"
              >
                <Plus size={16} />
                Add by DOI
              </button>
              <button
                onClick={() => openModal('searchPaper')}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-3 transition-colors"
              >
                <Globe size={16} />
                Search Semantic Scholar
              </button>
              <button
                onClick={() => openModal('batchImport')}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-3 transition-colors"
              >
                <Upload size={16} />
                Batch Import DOIs
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="sm:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        paperCount={paperCount}
        connectionCount={connectionCount}
        thesisTitle={thesis.title}
      />
    </>
  );
});
