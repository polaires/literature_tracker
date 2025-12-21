import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, List, Network, Calendar } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AddPaperModal } from '../components/paper/AddPaperModal';
import { PaperDetail } from '../components/paper/PaperDetail';
import { GraphView } from '../components/visualization/GraphView';

type ViewMode = 'list' | 'graph' | 'timeline';

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

  const thesis = theses.find((t) => t.id === thesisId);
  const papers = thesisId ? getPapersForThesis(thesisId) : [];
  const connections = thesisId ? getConnectionsForThesis(thesisId) : [];

  const selectedPaper = papers.find((p) => p.id === selectedPaperId);
  const selectedPaperConnections = selectedPaperId
    ? getConnectionsForPaper(selectedPaperId)
    : [];

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
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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
          </div>

          {/* Stats & Add Paper Button */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {papers.length} papers · {connections.length} connections
            </span>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} />
              Add Paper
            </button>
          </div>
        </div>
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
                {papers.map((paper) => (
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
      {selectedPaper && (
        <PaperDetail
          paper={selectedPaper}
          connections={selectedPaperConnections}
          allPapers={papers}
          onClose={() => setSelectedPaper(null)}
          onAddConnection={() => alert('Connection editor coming soon!')}
        />
      )}
    </div>
  );
}
