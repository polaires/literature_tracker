import { memo, useState, useMemo } from 'react';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ChevronDown,
  ChevronRight,
  X,
  FileText,
  Bot,
  Settings,
  Keyboard,
  ClipboardCheck,
  Grid3X3,
  AlertTriangle,
  PanelLeftClose,
  Sparkles,
} from 'lucide-react';
import { usePanelContext, PANEL_DEFAULTS } from '../../contexts/PanelContext';
import { ResizeHandle } from './ResizeHandle';
import { MobileDrawer } from '../ui/MobileDrawer';
import { useIsMobile } from '../../hooks/useMediaQuery';
import type { Paper, ThesisRole, ReadingStatus, ScreeningDecision } from '../../types';

type SortField = 'title' | 'year' | 'citationCount' | 'addedAt' | 'readingStatus';
type SortOrder = 'asc' | 'desc';

interface LeftSidebarProps {
  papers: Paper[];
  selectedPaperId: string | null;
  onPaperSelect: (paperId: string) => void;
  screeningStats: { pending: number; include: number; exclude: number; maybe: number };
  // Filter state lifted up
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterRole: ThesisRole | 'all';
  onFilterRoleChange: (role: ThesisRole | 'all') => void;
  filterStatus: ReadingStatus | 'all';
  onFilterStatusChange: (status: ReadingStatus | 'all') => void;
  filterScreening: ScreeningDecision | 'all';
  onFilterScreeningChange: (screening: ScreeningDecision | 'all') => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField) => void;
}

const ROLE_OPTIONS: { value: ThesisRole | 'all'; label: string; color?: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'supports', label: 'Supports', color: 'bg-green-500' },
  { value: 'contradicts', label: 'Contradicts', color: 'bg-red-500' },
  { value: 'method', label: 'Method', color: 'bg-blue-500' },
  { value: 'background', label: 'Background', color: 'bg-gray-500' },
  { value: 'other', label: 'Other', color: 'bg-stone-500' },
];

const STATUS_OPTIONS: { value: ReadingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'screening', label: 'Screening' },
  { value: 'to-read', label: 'To Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'read', label: 'Read' },
  { value: 'to-revisit', label: 'Revisit' },
];

const SCREENING_OPTIONS: { value: ScreeningDecision | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'include', label: 'Include' },
  { value: 'exclude', label: 'Exclude' },
  { value: 'maybe', label: 'Maybe' },
];

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'addedAt', label: 'Date Added' },
  { field: 'title', label: 'Title' },
  { field: 'year', label: 'Year' },
  { field: 'citationCount', label: 'Citations' },
  { field: 'readingStatus', label: 'Reading Status' },
];

export const LeftSidebar = memo(function LeftSidebar({
  papers,
  selectedPaperId,
  onPaperSelect,
  screeningStats,
  searchQuery,
  onSearchChange,
  filterRole,
  onFilterRoleChange,
  filterStatus,
  onFilterStatusChange,
  filterScreening,
  onFilterScreeningChange,
  sortField,
  sortOrder,
  onSortChange,
}: LeftSidebarProps) {
  const { leftCollapsed, setLeftCollapsed, leftWidth, resizeLeftPanel, openRightPanel, openModal } = usePanelContext();
  const isMobile = useIsMobile();

  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showTools, setShowTools] = useState(false);

  const papersNeedingScreening = screeningStats.pending + screeningStats.maybe;

  const activeFiltersCount = useMemo(() => {
    return [
      filterRole !== 'all',
      filterStatus !== 'all',
      filterScreening !== 'all',
    ].filter(Boolean).length;
  }, [filterRole, filterStatus, filterScreening]);

  const clearFilters = () => {
    onSearchChange('');
    onFilterRoleChange('all');
    onFilterStatusChange('all');
    onFilterScreeningChange('all');
  };

  // On mobile, when collapsed, don't render anything - access via MobileNav
  if (leftCollapsed && isMobile) {
    return null;
  }

  // Desktop collapsed state - show only icons
  if (leftCollapsed && !isMobile) {
    return (
      <aside
        className="bg-[#FDFBF7] dark:bg-gray-800 border-r border-stone-200 dark:border-gray-700 flex flex-col items-center py-3 gap-2 flex-shrink-0"
        style={{ width: PANEL_DEFAULTS.leftCollapsedWidth }}
      >
        <button
          onClick={() => setLeftCollapsed(false)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>

        <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />

        <button
          onClick={() => { setLeftCollapsed(false); setShowFilters(true); }}
          className={`p-2 rounded-lg transition-colors ${
            activeFiltersCount > 0
              ? 'text-stone-700 bg-stone-100 dark:bg-stone-900/30'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title="Filters"
        >
          <Filter size={18} />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-stone-800 text-white rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {papersNeedingScreening > 0 && (
          <button
            onClick={() => openRightPanel('screening')}
            className="relative p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
            title="Screening"
          >
            <ClipboardCheck size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-amber-500 text-white rounded-full flex items-center justify-center">
              {papersNeedingScreening}
            </span>
          </button>
        )}

        <button
          onClick={() => openModal('aiSettings')}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="AI Settings"
        >
          <Bot size={18} />
        </button>
      </aside>
    );
  }

  // On mobile, show as overlay drawer when expanded
  if (isMobile) {
    return (
      <MobileDrawer
        isOpen={!leftCollapsed}
        onClose={() => setLeftCollapsed(true)}
        position="left"
        title={`Papers (${papers.length})`}
      >
        {/* Search */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search papers..."
              className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-stone-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filter & Sort - larger touch targets */}
        <div className="px-3 py-2 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { setShowFilters(!showFilters); setShowSort(false); }}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors touch-manipulation ${
              showFilters || activeFiltersCount > 0
                ? 'bg-stone-200 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Filter size={14} />
            Filter
            {activeFiltersCount > 0 && (
              <span className="ml-1 w-5 h-5 text-xs bg-stone-800 text-white rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setShowSort(!showSort); setShowFilters(false); }}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors touch-manipulation ${
              showSort
                ? 'bg-stone-200 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
            Sort
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-stone-700 dark:text-stone-400 hover:underline ml-auto px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Panel - mobile sized */}
        {showFilters && (
          <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 space-y-3 bg-gray-50 dark:bg-gray-800/50">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ROLE_OPTIONS.map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => onFilterRoleChange(value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors touch-manipulation ${
                      filterRole === value
                        ? 'bg-stone-800 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {color && <span className={`w-2.5 h-2.5 rounded-full ${color}`} />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onFilterStatusChange(value)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors touch-manipulation ${
                      filterStatus === value
                        ? 'bg-stone-800 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Screening
              </label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SCREENING_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onFilterScreeningChange(value)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors touch-manipulation ${
                      filterScreening === value
                        ? 'bg-stone-800 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sort Panel - mobile sized */}
        {showSort && (
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {SORT_OPTIONS.map(({ field, label }) => (
              <button
                key={field}
                onClick={() => onSortChange(field)}
                className={`w-full px-3 py-2.5 text-left text-sm flex items-center justify-between rounded-lg touch-manipulation ${
                  sortField === field ? 'text-stone-700 dark:text-stone-400 font-medium bg-white dark:bg-gray-700' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {label}
                {sortField === field && (
                  <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Paper List - mobile optimized */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {papers.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No papers match filters
            </div>
          ) : (
            <div className="py-1">
              {papers.map((paper) => (
                <button
                  key={paper.id}
                  onClick={() => {
                    onPaperSelect(paper.id);
                    setLeftCollapsed(true); // Close drawer on selection
                  }}
                  className={`w-full px-3 py-3 text-left transition-colors touch-manipulation ${
                    selectedPaperId === paper.id
                      ? 'bg-stone-100 dark:bg-stone-900/30 border-l-3 border-stone-500'
                      : 'active:bg-gray-100 dark:active:bg-gray-700/50 border-l-3 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                        paper.thesisRole === 'supports' ? 'bg-green-500' :
                        paper.thesisRole === 'contradicts' ? 'bg-red-500' :
                        paper.thesisRole === 'method' ? 'bg-blue-500' :
                        paper.thesisRole === 'background' ? 'bg-gray-400' :
                        'bg-stone-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {paper.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {paper.year || 'No year'} · {paper.readingStatus.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </MobileDrawer>
    );
  }

  // Desktop view
  return (
    <aside
      className="relative bg-[#FDFBF7] dark:bg-gray-800 border-r border-stone-200 dark:border-gray-700 flex flex-col flex-shrink-0 overflow-hidden"
      style={{ width: leftWidth }}
    >
      {/* Resize handle */}
      <ResizeHandle position="left" onResize={resizeLeftPanel} />

      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Papers ({papers.length})
        </span>
        <button
          onClick={() => setLeftCollapsed(true)}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors hidden lg:block"
          title="Collapse sidebar"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search papers..."
            className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-stone-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter & Sort Toggles */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => { setShowFilters(!showFilters); setShowSort(false); }}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors ${
            showFilters || activeFiltersCount > 0
              ? 'bg-stone-200 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Filter size={12} />
          Filter
          {activeFiltersCount > 0 && (
            <span className="ml-1 w-4 h-4 text-[10px] bg-stone-800 text-white rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setShowSort(!showSort); setShowFilters(false); }}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors ${
            showSort
              ? 'bg-stone-200 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />}
          Sort
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-stone-700 dark:text-stone-400 hover:underline ml-auto"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 space-y-2 bg-gray-50 dark:bg-gray-800/50">
          {/* Role Filter */}
          <div>
            <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Role
            </label>
            <div className="flex flex-wrap gap-1 mt-1">
              {ROLE_OPTIONS.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => onFilterRoleChange(value)}
                  className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors ${
                    filterRole === value
                      ? 'bg-stone-800 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-stone-300'
                  }`}
                >
                  {color && <span className={`w-2 h-2 rounded-full ${color}`} />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </label>
            <div className="flex flex-wrap gap-1 mt-1">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onFilterStatusChange(value)}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    filterStatus === value
                      ? 'bg-stone-800 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-stone-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Screening Filter */}
          <div>
            <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Screening
            </label>
            <div className="flex flex-wrap gap-1 mt-1">
              {SCREENING_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onFilterScreeningChange(value)}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    filterScreening === value
                      ? 'bg-stone-800 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-stone-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sort Panel */}
      {showSort && (
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {SORT_OPTIONS.map(({ field, label }) => (
            <button
              key={field}
              onClick={() => onSortChange(field)}
              className={`w-full px-2 py-1.5 text-left text-xs flex items-center justify-between rounded hover:bg-white dark:hover:bg-gray-700 ${
                sortField === field ? 'text-stone-700 dark:text-stone-400 font-medium' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {label}
              {sortField === field && (
                <span className="text-gray-400">{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Paper List */}
      <div className="flex-1 overflow-y-auto">
        {papers.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No papers match filters
          </div>
        ) : (
          <div className="py-1">
            {papers.map((paper) => (
              <button
                key={paper.id}
                onClick={() => onPaperSelect(paper.id)}
                className={`w-full px-3 py-2 text-left transition-colors ${
                  selectedPaperId === paper.id
                    ? 'bg-stone-100 dark:bg-stone-900/30 border-l-2 border-stone-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      paper.thesisRole === 'supports' ? 'bg-green-500' :
                      paper.thesisRole === 'contradicts' ? 'bg-red-500' :
                      paper.thesisRole === 'method' ? 'bg-blue-500' :
                      paper.thesisRole === 'background' ? 'bg-gray-400' :
                      'bg-stone-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {paper.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {paper.year || 'No year'} · {paper.readingStatus.replace('-', ' ')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tools Section */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowTools(!showTools)}
          className="w-full px-3 py-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        >
          <span>Tools</span>
          {showTools ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {showTools && (
          <div className="px-2 pb-2 space-y-1">
            {/* Screening */}
            {papersNeedingScreening > 0 && (
              <button
                onClick={() => openRightPanel('screening')}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                <ClipboardCheck size={16} />
                Screen Papers
                <span className="ml-auto px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                  {papersNeedingScreening}
                </span>
              </button>
            )}

            {/* Synthesis Tools */}
            <button
              onClick={() => openModal('synthesisMatrix')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Grid3X3 size={16} />
              Synthesis Matrix
            </button>

            <button
              onClick={() => openModal('gapAnalysis')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <AlertTriangle size={16} />
              Gap Analysis
            </button>

            <button
              onClick={() => openModal('exportOutline')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FileText size={16} />
              Export Outline
            </button>

            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

            {/* AI & Settings */}
            <button
              onClick={() => openModal('aiSettings')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900/20 rounded-lg"
            >
              <Sparkles size={16} />
              AI Settings
            </button>

            <button
              onClick={() => openModal('dataManager')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Settings size={16} />
              Data & Export
            </button>

            <button
              onClick={() => openModal('keyboardHelp')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Keyboard size={16} />
              Keyboard Shortcuts
            </button>
          </div>
        )}
      </div>
    </aside>
  );
});
