import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Archive, ArchiveRestore, Trash2, Beaker, MoreVertical, Settings } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { loadSampleData } from '../utils/sampleData';
import { DataManager } from '../components/common/DataManager';

export function Home() {
  const navigate = useNavigate();
  const {
    theses,
    createThesis,
    updateThesis,
    deleteThesis,
    setActiveThesis,
    getPapersForThesis,
    addPaper,
    createConnection,
  } = useAppStore();
  const [showNewThesisForm, setShowNewThesisForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showDataManager, setShowDataManager] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleArchiveThesis = (id: string, archive: boolean) => {
    updateThesis(id, { isArchived: archive });
    setActiveMenuId(null);
  };

  const activeTheses = theses.filter((t) => !t.isArchived);
  const archivedTheses = theses.filter((t) => t.isArchived);

  const handleCreateThesis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const thesis = createThesis({
      title: newTitle.trim(),
      description: newDescription.trim(),
      isArchived: false,
    });

    setNewTitle('');
    setNewDescription('');
    setShowNewThesisForm(false);
    setActiveThesis(thesis.id);
    navigate(`/thesis/${thesis.id}`);
  };

  const handleOpenThesis = (id: string) => {
    setActiveThesis(id);
    navigate(`/thesis/${id}`);
  };

  const handleLoadSampleData = () => {
    const thesisId = loadSampleData(createThesis, addPaper, createConnection);
    setActiveThesis(thesisId);
    navigate(`/thesis/${thesisId}`);
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-12">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              IdeaGraph
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Catalog ideas, not just papers. Build your knowledge graph.
            </p>
          </div>
          <button
            onClick={() => setShowDataManager(true)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Settings & Data"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Your Research
          </h2>
          <div className="flex items-center gap-2">
            {activeTheses.length === 0 && (
              <button
                onClick={handleLoadSampleData}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                title="Load sample data to explore the app"
              >
                <Beaker size={20} />
                Load Demo
              </button>
            )}
            <button
              onClick={() => setShowNewThesisForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} />
              New Thesis
            </button>
          </div>
        </div>

        {/* New Thesis Form */}
        {showNewThesisForm && (
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Create New Thesis
            </h3>
            <form onSubmit={handleCreateThesis}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Research Question / Hypothesis
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., What are the limitations of AlphaFold for drug discovery?"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="A longer explanation of your research focus..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Create Thesis
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewThesisForm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Thesis List */}
        {activeTheses.length === 0 && !showNewThesisForm ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No research theses yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first thesis to start building your knowledge graph.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowNewThesisForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={20} />
                Create Your First Thesis
              </button>
              <button
                onClick={handleLoadSampleData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                <Beaker size={20} />
                Load Demo Data
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTheses.map((thesis) => {
              const papers = getPapersForThesis(thesis.id);
              const daysAgo = Math.floor(
                (Date.now() - new Date(thesis.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={thesis.id}
                  className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleOpenThesis(thesis.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {thesis.title}
                      </h3>
                      {thesis.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                          {thesis.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{papers.length} papers</span>
                        <span>
                          {daysAgo === 0
                            ? 'Updated today'
                            : daysAgo === 1
                            ? 'Updated yesterday'
                            : `Updated ${daysAgo} days ago`}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === thesis.id ? null : thesis.id);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === thesis.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                            }}
                          />
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveThesis(thesis.id, true);
                              }}
                              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              <Archive size={14} />
                              Archive
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete this thesis and all its papers?')) {
                                  deleteThesis(thesis.id);
                                }
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Archived Theses */}
        {archivedTheses.length > 0 && (
          <div className="mt-12">
            <h3 className="flex items-center gap-2 text-lg font-medium text-gray-500 dark:text-gray-400 mb-4">
              <Archive size={20} />
              Archived ({archivedTheses.length})
            </h3>
            <div className="space-y-2">
              {archivedTheses.map((thesis) => {
                const papers = getPapersForThesis(thesis.id);
                return (
                  <div
                    key={thesis.id}
                    className="group p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleOpenThesis(thesis.id)}
                      >
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">
                          {thesis.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {papers.length} papers
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveThesis(thesis.id, false);
                          }}
                          className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          title="Restore"
                        >
                          <ArchiveRestore size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Permanently delete this thesis and all its papers?')) {
                              deleteThesis(thesis.id);
                            }
                          }}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete permanently"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Data Manager Modal */}
      {showDataManager && (
        <DataManager onClose={() => setShowDataManager(false)} />
      )}
    </div>
  );
}
