import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, List, Network, Calendar } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

type ViewMode = 'list' | 'graph' | 'timeline';

export function ThesisView() {
  const { thesisId } = useParams<{ thesisId: string }>();
  const navigate = useNavigate();
  const { theses, getPapersForThesis, getConnectionsForThesis } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const thesis = theses.find((t) => t.id === thesisId);
  const papers = thesisId ? getPapersForThesis(thesisId) : [];
  const connections = thesisId ? getConnectionsForThesis(thesisId) : [];

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

          {/* Add Paper Button */}
          <button
            onClick={() => alert('Add paper modal coming soon!')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            Add Paper
          </button>
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
              onClick={() => alert('Add paper modal coming soon!')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} />
              Add Your First Paper
            </button>
          </div>
        ) : (
          <div>
            {viewMode === 'list' && (
              <div className="space-y-4">
                {papers.map((paper) => (
                  <div
                    key={paper.id}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {paper.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {paper.authors.map((a) => a.name).join(', ')} ({paper.year})
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
                        {paper.readingStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'graph' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="graph-container h-[600px] flex items-center justify-center text-gray-500">
                  Graph visualization coming soon...
                  <br />
                  ({papers.length} papers, {connections.length} connections)
                </div>
              </div>
            )}

            {viewMode === 'timeline' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-center py-12 text-gray-500">
                  Timeline view coming soon...
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
