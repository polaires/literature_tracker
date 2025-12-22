import { useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  List,
  Network,
  Calendar,
  GitBranch,
  SortAsc,
  SortDesc,
  Filter,
  Search,
  Settings,
  X,
  ChevronDown,
  Keyboard,
} from 'lucide-react';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import { useAppStore } from '../store/useAppStore';
import { AddPaperModal } from '../components/paper/AddPaperModal';
import { PaperDetail } from '../components/paper/PaperDetail';
import { GraphView } from '../components/visualization/GraphView';
import { ArgumentMapView } from '../components/visualization/ArgumentMapView';
import { DataManager } from '../components/common/DataManager';
import { Button } from '../components/ui';
import type { ThesisRole, ReadingStatus } from '../types';

type ViewMode = 'list' | 'graph' | 'timeline' | 'arguments';
type SortField = 'title' | 'year' | 'citationCount' | 'addedAt' | 'readingStatus';
type SortOrder = 'asc' | 'desc';

export function ThesisView() {
  const { thesisId } = useParams<{ thesisId: string }>();
  const navigate = useNavigate();
  const {
    theses,
    getPapersForThesis,
    getConnectionsForThesis,
    getConnectionsForPaper,
    selectedPaperId,
    setSelectedPaper,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('addedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<ThesisRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ReadingStatus | 'all'>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);

  const thesis = theses.find((t) => t.id === thesisId);
  const papers = thesisId ? getPapersForThesis(thesisId) : [];
  const connections = thesisId ? getConnectionsForThesis(thesisId) : [];

  const selectedPaper = papers.find((p) => p.id === selectedPaperId);
  const selectedPaperConnections = selectedPaperId
    ? getConnectionsForPaper(selectedPaperId)
    : [];

  // Filter and sort papers
  const filteredAndSortedPapers = useMemo(() => {
    let filtered = papers;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.takeaway.toLowerCase().includes(query) ||
          p.authors.some((a) => a.name.toLowerCase().includes(query)) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter((p) => p.thesisRole === filterRole);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.readingStatus === filterStatus);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'year':
          comparison = (a.year || 0) - (b.year || 0);
          break;
        case 'citationCount':
          comparison = (a.citationCount || 0) - (b.citationCount || 0);
          break;
        case 'addedAt':
          comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
        case 'readingStatus': {
          const statusOrder = { 'to-read': 0, reading: 1, 'to-revisit': 2, read: 3 };
          comparison = statusOrder[a.readingStatus] - statusOrder[b.readingStatus];
          break;
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [papers, searchQuery, filterRole, filterStatus, sortField, sortOrder]);

  const activeFiltersCount = [
    filterRole !== 'all',
    filterStatus !== 'all',
    searchQuery.trim() !== '',
  ].filter(Boolean).length;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setShowSortMenu(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterRole('all');
    setFilterStatus('all');
  };

  // Keyboard navigation
  const handleNavigatePapers = useCallback(
    (direction: 'up' | 'down') => {
      if (filteredAndSortedPapers.length === 0) return;

      const currentIndex = selectedPaperId
        ? filteredAndSortedPapers.findIndex((p) => p.id === selectedPaperId)
        : -1;

      let newIndex: number;
      if (direction === 'down') {
        newIndex = currentIndex < filteredAndSortedPapers.length - 1 ? currentIndex + 1 : 0;
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : filteredAndSortedPapers.length - 1;
      }

      setSelectedPaper(filteredAndSortedPapers[newIndex].id);
    },
    [filteredAndSortedPapers, selectedPaperId, setSelectedPaper]
  );

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewPaper: () => setShowAddModal(true),
    onSearch: () => searchInputRef.current?.focus(),
    onToggleView: () => {
      setViewMode((prev) => {
        if (prev === 'list') return 'graph';
        if (prev === 'graph') return 'timeline';
        if (prev === 'timeline') return 'arguments';
        return 'list';
      });
    },
    onExport: () => setShowDataManager(true),
    onEscape: () => {
      if (showAddModal) setShowAddModal(false);
      else if (showDataManager) setShowDataManager(false);
      else if (showKeyboardHelp) setShowKeyboardHelp(false);
      else if (selectedPaperId) setSelectedPaper(null);
      else if (showFilterPanel) setShowFilterPanel(false);
      else if (showSortMenu) setShowSortMenu(false);
    },
    onNavigateUp: () => handleNavigatePapers('up'),
    onNavigateDown: () => handleNavigatePapers('down'),
    onEnter: () => {
      // Paper is already selected and displayed - no additional action needed
    },
  });

  if (!thesis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Thesis not found
          </h2>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {thesis.title}
            </h1>
          </div>
          {thesis.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-12">
              {thesis.description}
            </p>
          )}
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <List size={16} />
              List
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'graph'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Network size={16} />
              Graph
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Calendar size={16} />
              Timeline
            </button>
            <button
              onClick={() => setViewMode('arguments')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'arguments'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <GitBranch size={16} />
              Arguments
            </button>
          </div>

          {/* Search, Filter, Sort (List view only) */}
          {viewMode === 'list' && papers.length > 0 && (
            <div className="flex-1 flex items-center gap-3 max-w-xl">
              {/* Search */}
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search papers... (⌘F)"
                  className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showFilterPanel || activeFiltersCount > 0
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Filter size={14} />
                Filter
                {activeFiltersCount > 0 && (
                  <span className="ml-1 w-5 h-5 text-xs bg-indigo-600 text-white rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Sort Button */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
                  Sort
                  <ChevronDown size={14} />
                </button>

                {showSortMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowSortMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                      {[
                        { field: 'addedAt' as SortField, label: 'Date Added' },
                        { field: 'title' as SortField, label: 'Title' },
                        { field: 'year' as SortField, label: 'Year' },
                        { field: 'citationCount' as SortField, label: 'Citations' },
                        { field: 'readingStatus' as SortField, label: 'Reading Status' },
                      ].map((option) => (
                        <button
                          key={option.field}
                          onClick={() => handleSort(option.field)}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            sortField === option.field
                              ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {option.label}
                          {sortField === option.field && (
                            <span className="text-xs text-gray-500">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Stats & Actions */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
              {filteredAndSortedPapers.length === papers.length
                ? `${papers.length} papers`
                : `${filteredAndSortedPapers.length} of ${papers.length} papers`}
              {' · '}{connections.length} connections
            </span>
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden md:flex"
              title="Keyboard Shortcuts"
            >
              <Keyboard size={18} />
            </button>
            <button
              onClick={() => setShowDataManager(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Data & Export (⌘E)"
            >
              <Settings size={18} />
            </button>
            <Button
              onClick={() => setShowAddModal(true)}
              icon={<Plus size={18} />}
              shortcut="⌘N"
              title="Add Paper (⌘N)"
            >
              <span className="hidden sm:inline">Add Paper</span>
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && viewMode === 'list' && (
          <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-4">
              {/* Role Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Role:
                </span>
                <div className="flex gap-1">
                  {[
                    { value: 'all' as const, label: 'All' },
                    { value: 'supports' as const, label: 'Supports', color: 'bg-green-100 text-green-800' },
                    { value: 'contradicts' as const, label: 'Contradicts', color: 'bg-red-100 text-red-800' },
                    { value: 'method' as const, label: 'Method', color: 'bg-blue-100 text-blue-800' },
                    { value: 'background' as const, label: 'Background', color: 'bg-gray-200 text-gray-800' },
                    { value: 'other' as const, label: 'Other', color: 'bg-purple-100 text-purple-800' },
                  ].map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setFilterRole(role.value)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        filterRole === role.value
                          ? role.value === 'all'
                            ? 'bg-indigo-600 text-white'
                            : `${role.color} ring-2 ring-indigo-500 ring-offset-1`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status:
                </span>
                <div className="flex gap-1">
                  {[
                    { value: 'all' as const, label: 'All' },
                    { value: 'to-read' as const, label: 'To Read' },
                    { value: 'reading' as const, label: 'Reading' },
                    { value: 'read' as const, label: 'Read' },
                    { value: 'to-revisit' as const, label: 'Revisit' },
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setFilterStatus(status.value)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        filterStatus === status.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {papers.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
            <Network size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No papers yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add your first paper to start building your knowledge graph.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} />
              Add Your First Paper
            </button>
          </div>
        ) : (
          <div>
            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredAndSortedPapers.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <Search size={32} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No papers match your filters
                    </p>
                    <button
                      onClick={clearFilters}
                      className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
                {filteredAndSortedPapers.map((paper) => (
                  <div
                    key={paper.id}
                    onClick={() => setSelectedPaper(paper.id)}
                    className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border cursor-pointer transition-all ${
                      selectedPaperId === paper.id
                        ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {paper.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {paper.authors.map((a) => a.name).join(', ')}
                      {paper.year && ` (${paper.year})`}
                    </p>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                      Takeaway: {paper.takeaway}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          paper.thesisRole === 'supports'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : paper.thesisRole === 'contradicts'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : paper.thesisRole === 'method'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {paper.thesisRole}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {paper.readingStatus.replace('-', ' ')}
                      </span>
                      {paper.citationCount !== null && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          · {paper.citationCount} citations
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Graph View */}
            {viewMode === 'graph' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="h-[600px]">
                  <GraphView
                    thesis={thesis}
                    papers={papers}
                    connections={connections}
                    onPaperSelect={(id) => setSelectedPaper(id)}
                  />
                </div>
              </div>
            )}

            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                  {/* Papers sorted by year */}
                  <div className="space-y-6">
                    {papers
                      .filter((p) => p.year)
                      .sort((a, b) => (b.year || 0) - (a.year || 0))
                      .map((paper) => (
                        <div
                          key={paper.id}
                          onClick={() => setSelectedPaper(paper.id)}
                          className="relative pl-10 cursor-pointer"
                        >
                          {/* Year dot */}
                          <div
                            className={`absolute left-2 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 ${
                              paper.thesisRole === 'supports'
                                ? 'bg-green-500'
                                : paper.thesisRole === 'contradicts'
                                ? 'bg-red-500'
                                : paper.thesisRole === 'method'
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                            }`}
                          />

                          {/* Content */}
                          <div
                            className={`p-3 rounded-lg transition-all ${
                              selectedPaperId === paper.id
                                ? 'bg-indigo-50 dark:bg-indigo-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                          >
                            <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              {paper.year}
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white mt-1">
                              {paper.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {paper.takeaway}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Arguments Map View */}
            {viewMode === 'arguments' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="h-[calc(100vh-300px)] min-h-[500px]">
                  <ArgumentMapView
                    thesis={thesis}
                    papers={papers}
                    onPaperSelect={(id) => setSelectedPaper(id)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Paper Modal */}
      {showAddModal && thesisId && (
        <AddPaperModal
          thesisId={thesisId}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Paper Detail Panel */}
      {selectedPaper && thesisId && (
        <PaperDetail
          paper={selectedPaper}
          connections={selectedPaperConnections}
          allPapers={papers}
          thesisId={thesisId}
          onClose={() => setSelectedPaper(null)}
        />
      )}

      {/* Data Manager Modal */}
      {showDataManager && thesisId && (
        <DataManager
          thesisId={thesisId}
          onClose={() => setShowDataManager(false)}
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowKeyboardHelp(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Keyboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {shortcut.action}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <span key={j}>
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-600">
                            {key}
                          </kbd>
                          {j < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-gray-400">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
                Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> to close this dialog
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
