import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Network, Plus, Search, X, Keyboard } from 'lucide-react';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import { useAppStore } from '../store/useAppStore';
import { usePanelContext } from '../contexts/PanelContext';
import {
  AppShell,
  AppShellHeader,
  AppShellBody,
  AppShellMain,
  TopHeader,
  LeftSidebar,
  RightPanel,
  type ViewMode,
} from '../components/layout';

// Modals
import { AddPaperModal } from '../components/paper/AddPaperModal';
import { PaperSearchModal } from '../components/paper/PaperSearchModal';
import { BatchImportModal } from '../components/paper/BatchImportModal';
import { DataManager } from '../components/common/DataManager';
import { SynthesisMatrix, GapAnalysis, ReviewOutlineExport } from '../components/synthesis';
import { AISettings } from '../components/settings/AISettings';

// Views
import { GraphView } from '../components/visualization/GraphView';
import { ArgumentMapView } from '../components/visualization/ArgumentMapView';

// Right panel content
import { PaperDetailContent } from '../components/paper/PaperDetailContent';
import { ScreeningContent } from '../components/paper/ScreeningContent';
import { WorkflowContent } from '../components/common/WorkflowContent';

import type { ThesisRole, ReadingStatus, ScreeningDecision } from '../types';
import type { SemanticScholarPaper } from '../services/api/semanticScholar';

type SortField = 'title' | 'year' | 'citationCount' | 'addedAt' | 'readingStatus';
type SortOrder = 'asc' | 'desc';

function ThesisViewContent() {
  const { thesisId } = useParams<{ thesisId: string }>();
  const navigate = useNavigate();
  const {
    theses,
    getPapersForThesis,
    getConnectionsForThesis,
    getConnectionsForPaper,
    getScreeningStats,
    getClustersForThesis,
    createCluster,
    toggleClusterCollapse,
    addPaper,
    selectedPaperId,
    setSelectedPaper,
    setActiveThesis,
  } = useAppStore();

  // Set active thesis when viewing - required for AI features
  useEffect(() => {
    if (thesisId) {
      setActiveThesis(thesisId);
    }
  }, [thesisId, setActiveThesis]);

  const {
    activeModal,
    openModal,
    closeModal,
    rightPanel,
    openRightPanel,
    closeRightPanel,
  } = usePanelContext();

  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('addedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<ThesisRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ReadingStatus | 'all'>('all');
  const [filterScreening, setFilterScreening] = useState<ScreeningDecision | 'all'>('all');

  // Refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);

  const thesis = theses.find((t) => t.id === thesisId);
  const papers = thesisId ? getPapersForThesis(thesisId) : [];
  const connections = thesisId ? getConnectionsForThesis(thesisId) : [];
  const clusters = thesisId ? getClustersForThesis(thesisId) : [];
  const screeningStats = thesisId ? getScreeningStats(thesisId) : { pending: 0, include: 0, exclude: 0, maybe: 0 };

  const selectedPaper = papers.find((p) => p.id === selectedPaperId);
  const selectedPaperConnections = selectedPaperId
    ? getConnectionsForPaper(selectedPaperId)
    : [];

  // When a paper is selected, open detail panel
  useEffect(() => {
    if (selectedPaperId && selectedPaper) {
      openRightPanel('detail', { paperTitle: selectedPaper.title });
    }
  }, [selectedPaperId, selectedPaper, openRightPanel]);

  // Handler for adding discovered papers from GraphView
  const handleAddDiscoveredPaper = useCallback(
    (data: {
      paper: SemanticScholarPaper;
      role: ThesisRole;
      takeaway: string;
      addAsScreening: boolean;
    }) => {
      if (!thesisId) return;

      const newPaper = addPaper({
        thesisId,
        doi: data.paper.externalIds?.DOI || null,
        title: data.paper.title,
        authors: data.paper.authors?.map((a) => ({ name: a.name })) || [],
        year: data.paper.year || null,
        journal: data.paper.venue || null,
        volume: null,
        issue: null,
        pages: null,
        abstract: data.paper.abstract || null,
        url: null,
        pdfUrl: data.paper.openAccessPdf?.url || null,
        citationCount: data.paper.citationCount || null,
        takeaway: data.addAsScreening ? '' : data.takeaway,
        arguments: [],
        evidence: [],
        assessment: null,
        thesisRole: data.role,
        readingStatus: data.addAsScreening ? 'screening' : 'to-read',
        tags: [],
        readAt: null,
        source: 'search',
        rawBibtex: null,
        screeningDecision: 'pending',
        exclusionReason: null,
        exclusionNote: null,
        screenedAt: null,
        semanticScholarId: data.paper.paperId,
      });

      // Auto-select the newly added paper
      if (newPaper) {
        setSelectedPaper(newPaper.id);
      }
    },
    [thesisId, addPaper, setSelectedPaper]
  );

  // Handler for creating clusters from GraphView
  const handleCreateCluster = useCallback(
    (name: string, paperIds: string[]) => {
      if (!thesisId) return;
      createCluster(name, thesisId, paperIds);
    },
    [thesisId, createCluster]
  );

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

    // Apply screening filter
    if (filterScreening !== 'all') {
      filtered = filtered.filter((p) => p.screeningDecision === filterScreening);
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
          const statusOrder = { screening: 0, 'to-read': 1, reading: 2, 'to-revisit': 3, read: 4 };
          comparison = statusOrder[a.readingStatus] - statusOrder[b.readingStatus];
          break;
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [papers, searchQuery, filterRole, filterStatus, filterScreening, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
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
    onNewPaper: () => openModal('addPaper'),
    onSearch: () => searchInputRef.current?.focus(),
    onToggleView: () => {
      setViewMode((prev) => {
        if (prev === 'list') return 'graph';
        if (prev === 'graph') return 'timeline';
        if (prev === 'timeline') return 'arguments';
        return 'list';
      });
    },
    onExport: () => openModal('dataManager'),
    onEscape: () => {
      // Panel context handles escape via global handler
    },
    onNavigateUp: () => handleNavigatePapers('up'),
    onNavigateDown: () => handleNavigatePapers('down'),
    onEnter: () => {},
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
    <>
      {/* Header */}
      <AppShellHeader>
        <TopHeader
          thesis={thesis}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          paperCount={papers.length}
          connectionCount={connections.length}
        />
      </AppShellHeader>

      {/* Body: Left Sidebar + Main + Right Panel */}
      <AppShellBody>
        {/* Left Sidebar */}
        <LeftSidebar
          papers={filteredAndSortedPapers}
          selectedPaperId={selectedPaperId}
          onPaperSelect={(id) => setSelectedPaper(id)}
          screeningStats={screeningStats}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterRole={filterRole}
          onFilterRoleChange={setFilterRole}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          filterScreening={filterScreening}
          onFilterScreeningChange={setFilterScreening}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={handleSort}
        />

        {/* Main Content */}
        <AppShellMain>
          {papers.length === 0 ? (
            /* Empty state */
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 max-w-lg">
                <Network size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No papers yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Add your first paper to start building your knowledge graph.
                </p>
                <button
                  onClick={() => openModal('addPaper')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={20} />
                  Add Your First Paper
                </button>
              </div>
            </div>
          ) : (
            /* View Content */
            <div className="h-full">
              {/* List View */}
              {viewMode === 'list' && (
                <div className="h-full overflow-y-auto p-4 space-y-3">
                  {filteredAndSortedPapers.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <Search size={32} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No papers match your filters
                      </p>
                    </div>
                  ) : (
                    filteredAndSortedPapers.map((paper) => (
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
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Graph View - Maximized */}
              {viewMode === 'graph' && (
                <div className="h-full w-full">
                  <GraphView
                    thesis={thesis}
                    papers={papers}
                    connections={connections}
                    clusters={clusters}
                    onPaperSelect={(id) => setSelectedPaper(id)}
                    onAddPaper={handleAddDiscoveredPaper}
                    onOpenSearch={() => openModal('searchPaper')}
                    onCreateCluster={handleCreateCluster}
                    onToggleClusterCollapse={toggleClusterCollapse}
                  />
                </div>
              )}

              {/* Timeline View */}
              {viewMode === 'timeline' && (
                <div className="h-full overflow-y-auto p-6">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
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
                            <div
                              className={`absolute left-2 w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 ${
                                paper.thesisRole === 'supports'
                                  ? 'bg-green-500'
                                  : paper.thesisRole === 'contradicts'
                                  ? 'bg-red-500'
                                  : paper.thesisRole === 'method'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-400'
                              }`}
                            />
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
                <div className="h-full">
                  <ArgumentMapView
                    thesis={thesis}
                    papers={papers}
                    onPaperSelect={(id) => setSelectedPaper(id)}
                  />
                </div>
              )}
            </div>
          )}
        </AppShellMain>

        {/* Right Panel */}
        {rightPanel === 'detail' && selectedPaper && thesisId && (
          <RightPanel
            title="Paper Details"
            subtitle={selectedPaper.title.slice(0, 50) + (selectedPaper.title.length > 50 ? '...' : '')}
            icon="detail"
            onClose={() => {
              closeRightPanel();
              setSelectedPaper(null);
            }}
          >
            <PaperDetailContent
              paper={selectedPaper}
              connections={selectedPaperConnections}
              allPapers={papers}
              thesisId={thesisId}
            />
          </RightPanel>
        )}

        {rightPanel === 'screening' && thesisId && (
          <RightPanel
            title="Screening"
            subtitle={`${screeningStats.pending + screeningStats.maybe} papers to screen`}
            icon="screening"
          >
            <ScreeningContent thesisId={thesisId} />
          </RightPanel>
        )}

        {rightPanel === 'workflow' && thesisId && (
          <RightPanel title="Research Workflow" icon="workflow">
            <WorkflowContent thesisId={thesisId} />
          </RightPanel>
        )}
      </AppShellBody>

      {/* Modals */}
      {activeModal === 'addPaper' && thesisId && (
        <AddPaperModal thesisId={thesisId} onClose={closeModal} />
      )}

      {activeModal === 'searchPaper' && thesisId && (
        <PaperSearchModal thesisId={thesisId} onClose={closeModal} />
      )}

      {activeModal === 'batchImport' && thesisId && (
        <BatchImportModal thesisId={thesisId} onClose={closeModal} />
      )}

      {activeModal === 'dataManager' && thesisId && (
        <DataManager thesisId={thesisId} onClose={closeModal} />
      )}

      {activeModal === 'synthesisMatrix' && thesisId && (
        <SynthesisMatrix thesisId={thesisId} onClose={closeModal} />
      )}

      {activeModal === 'gapAnalysis' && thesisId && (
        <GapAnalysis thesisId={thesisId} onClose={closeModal} />
      )}

      {activeModal === 'exportOutline' && thesisId && (
        <ReviewOutlineExport thesisId={thesisId} onClose={closeModal} />
      )}

      {activeModal === 'aiSettings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Settings
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <AISettings />
            </div>
          </div>
        </div>
      )}

      {activeModal === 'keyboardHelp' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
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
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                          <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Wrapper with AppShell provider
export function ThesisViewNew() {
  return (
    <AppShell>
      <ThesisViewContent />
    </AppShell>
  );
}
