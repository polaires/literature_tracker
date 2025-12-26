import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Archive, ArchiveRestore, Trash2, MoreVertical, Search, ChevronRight, Upload, Grid3X3, List, Filter } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { loadEnhancedSampleData, workflowSummary } from '../utils/enhancedSampleData';
import { loadCrisprReviewSampleData, crisprWorkflowSummary } from '../utils/crisprReviewPart5';
import { DataManager } from '../components/common/DataManager';
import { UserMenu } from '../components/auth';

// Material Symbol Icon Component
function MaterialIcon({ icon, className = '' }: { icon: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
      {icon}
    </span>
  );
}

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
    createTheme,
    createGap,
    createSection,
    createEvidenceSynthesis,
    createCluster,
  } = useAppStore();
  const [showNewThesisForm, setShowNewThesisForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [showDataManager, setShowDataManager] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeView, setActiveView] = useState<'all' | 'drafts' | 'archived'>('all');

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

  const handleLoadEnhancedDemo = () => {
    const result = loadEnhancedSampleData(
      createThesis,
      addPaper,
      createConnection,
      createTheme,
      createGap,
      createSection,
      createEvidenceSynthesis
    );
    setActiveThesis(result.thesisId);
    navigate(`/thesis/${result.thesisId}`);
  };

  const handleLoadCrisprDemo = () => {
    const createClusterWrapper = (cluster: { name: string; thesisId: string; paperIds: string[] }) => {
      return createCluster(cluster.name, cluster.thesisId, cluster.paperIds);
    };

    const result = loadCrisprReviewSampleData(
      createThesis,
      addPaper,
      createConnection,
      createTheme,
      createGap,
      createSection,
      createEvidenceSynthesis,
      createClusterWrapper
    );
    setActiveThesis(result.thesisId);
    navigate(`/thesis/${result.thesisId}`);
  };

  // Get unique tags from theses (could be extended later)
  const tags = [
    { name: 'Full Demo', color: 'bg-orange-400' },
    { name: 'CRISPR', color: 'bg-emerald-400' },
    { name: 'Simple', color: 'bg-blue-400' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] antialiased">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-stone-800 rounded-sm flex items-center justify-center shadow-sm">
                <MaterialIcon icon="hub" className="text-white text-[18px]" />
              </div>
              <span className="font-semibold text-stone-800 tracking-tight text-lg">IdeaGraph</span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-500">
              <a className="text-stone-800" href="#">Dashboard</a>
              <a className="hover:text-stone-800 transition-colors relative after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-stone-800 hover:after:w-full after:transition-all" href="#">Knowledge Graph</a>
              <button
                onClick={() => setShowDataManager(true)}
                className="hover:text-stone-800 transition-colors relative after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-stone-800 hover:after:w-full after:transition-all"
              >
                Settings
              </button>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <button className="p-1.5 text-stone-400 hover:text-stone-600 rounded-md hover:bg-stone-100 transition-colors">
                <Search size={20} />
              </button>
              <div className="h-4 w-px bg-stone-300 mx-1"></div>
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-stone-400 text-xs font-medium mb-2 uppercase tracking-wider">
              <span>Workspace</span>
              <ChevronRight size={10} />
              <span>Research</span>
            </div>
            <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Overview</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-md text-sm font-medium hover:bg-stone-50 transition-colors shadow-sm flex items-center gap-2">
              <Upload size={18} />
              Import
            </button>
            <button
              onClick={() => setShowNewThesisForm(true)}
              className="px-4 py-2 bg-stone-800 text-white rounded-md text-sm font-medium hover:bg-stone-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus size={18} />
              New Thesis
            </button>
          </div>
        </div>

        {/* AI Analyze Paper Section */}
        <div className="mb-12 group">
          <div className="relative bg-white rounded-xl border border-stone-200 p-1 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)]">
            <button
              onClick={() => navigate('/reader')}
              className="w-full relative rounded-lg border border-dashed border-stone-300 bg-stone-50/50 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 group-hover:bg-stone-50 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-white border border-stone-200 flex items-center justify-center shadow-sm text-stone-600 group-hover:scale-105 transition-transform duration-300">
                <MaterialIcon icon="smart_toy" className="text-[24px]" />
              </div>
              <div className="flex-grow text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="font-semibold text-stone-800">Analyze Paper with AI</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-600 uppercase tracking-wide">Beta</span>
                </div>
                <p className="text-sm text-stone-500 max-w-xl">Drop a PDF here to instantly generate a knowledge graph node, extract methodology, and find related concepts.</p>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-stone-500 bg-white border border-stone-200 px-3 py-1.5 rounded shadow-sm group-hover:text-stone-800 group-hover:border-stone-300 transition-all">
                Select File
                <ChevronRight size={14} />
              </div>
            </button>
          </div>
        </div>

        {/* Your Research Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-800">Your Research</h2>
          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-md p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'text-stone-800 bg-stone-100' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'text-stone-800 bg-stone-100' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8 pb-4 border-b border-stone-200">
          <span className="text-xs font-medium text-stone-400 mr-2">VIEWS</span>
          <button
            onClick={() => setActiveView('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${activeView === 'all' ? 'bg-stone-200 text-stone-700' : 'hover:bg-stone-100 text-stone-500'}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveView('drafts')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${activeView === 'drafts' ? 'bg-stone-200 text-stone-700' : 'hover:bg-stone-100 text-stone-500'}`}
          >
            Drafts
          </button>
          <button
            onClick={() => setActiveView('archived')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${activeView === 'archived' ? 'bg-stone-200 text-stone-700' : 'hover:bg-stone-100 text-stone-500'}`}
          >
            Archived
          </button>

          <div className="w-px h-4 bg-stone-300 mx-2"></div>

          <span className="text-xs font-medium text-stone-400 mr-2">TAGS</span>
          {tags.map((tag) => (
            <button
              key={tag.name}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-stone-200 hover:border-stone-300 transition-colors group"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tag.color}`}></span>
              <span className="text-xs font-medium text-stone-600 group-hover:text-stone-800">{tag.name}</span>
            </button>
          ))}

          <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-stone-100 text-stone-400 transition-colors ml-auto">
            <Filter size={16} />
          </button>
        </div>

        {/* New Thesis Form */}
        {showNewThesisForm && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-stone-200">
            <h3 className="text-lg font-semibold mb-4 text-stone-800">
              Create New Thesis
            </h3>
            <form onSubmit={handleCreateThesis}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Research Question / Hypothesis
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., What are the limitations of AlphaFold for drug discovery?"
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg bg-white text-stone-800 focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="A longer explanation of your research focus..."
                  rows={3}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg bg-white text-stone-800 focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 font-medium transition-colors"
                >
                  Create Thesis
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewThesisForm(false)}
                  className="px-5 py-2.5 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty State / Thesis List */}
        {activeTheses.length === 0 && !showNewThesisForm ? (
          <div className="relative bg-white border border-stone-200 rounded-xl min-h-[400px] flex flex-col items-center justify-center overflow-hidden">
            {/* Dot Pattern Background */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(#44403C 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            ></div>

            <div className="relative z-10 flex flex-col items-center max-w-md text-center px-6">
              <div className="w-16 h-16 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm rotate-3 transform transition-transform hover:rotate-6 duration-500">
                <MaterialIcon icon="library_add" className="text-[32px] text-stone-400" />
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">Start your research journey</h3>
              <p className="text-stone-500 mb-8 text-sm leading-relaxed">
                You haven't created any theses yet. Begin by defining a research question or exploring our template library to see how the knowledge graph works.
              </p>
              <div className="w-full space-y-3">
                <button
                  onClick={() => setShowNewThesisForm(true)}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-sm font-medium transition-all shadow-md group"
                >
                  <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                  Create New Thesis
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleLoadEnhancedDemo}
                    className="flex flex-col items-start gap-1 p-3 border border-stone-200 rounded-lg hover:border-stone-300 hover:bg-stone-50 transition-all text-left group"
                  >
                    <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                      <MaterialIcon icon="article" className="text-[14px] text-orange-500" />
                      LLM Code Review
                    </span>
                    <span className="text-[10px] text-stone-400 group-hover:text-stone-500">{workflowSummary.totalPapers} papers • 4 clusters</span>
                  </button>
                  <button
                    onClick={handleLoadCrisprDemo}
                    className="flex flex-col items-start gap-1 p-3 border border-stone-200 rounded-lg hover:border-stone-300 hover:bg-stone-50 transition-all text-left group"
                  >
                    <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                      <MaterialIcon icon="science" className="text-[14px] text-emerald-500" />
                      CRISPR Study
                    </span>
                    <span className="text-[10px] text-stone-400 group-hover:text-stone-500">{crisprWorkflowSummary.totalPapers} papers • {crisprWorkflowSummary.totalClusters} clusters</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTheses.map((thesis) => {
              const thesisPapers = getPapersForThesis(thesis.id);
              const daysAgo = Math.floor(
                (Date.now() - new Date(thesis.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={thesis.id}
                  className="p-6 bg-white rounded-xl shadow-sm border border-stone-200 hover:shadow-lg hover:border-stone-300 transition-all cursor-pointer group"
                  onClick={() => handleOpenThesis(thesis.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-stone-800 mb-1 group-hover:text-stone-700 transition-colors">
                        {thesis.title}
                      </h3>
                      {thesis.description && (
                        <p className="text-stone-500 text-sm mb-3 line-clamp-2">
                          {thesis.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg font-medium">
                          {thesisPapers.length} papers
                        </span>
                        <span className="text-stone-400">
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
                        className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
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
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveThesis(thesis.id, true);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-stone-50 text-stone-700 transition-colors"
                            >
                              <Archive size={15} />
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
                              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-red-50 text-red-600 transition-colors"
                            >
                              <Trash2 size={15} />
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
        {archivedTheses.length > 0 && activeView === 'archived' && (
          <div className="mt-12">
            <h3 className="flex items-center gap-2 text-lg font-medium text-stone-500 mb-4">
              <Archive size={20} />
              Archived ({archivedTheses.length})
            </h3>
            <div className="space-y-2">
              {archivedTheses.map((thesis) => {
                const thesisPapers = getPapersForThesis(thesis.id);
                return (
                  <div
                    key={thesis.id}
                    className="group p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleOpenThesis(thesis.id)}
                      >
                        <h4 className="font-medium text-stone-700">
                          {thesis.title}
                        </h4>
                        <p className="text-xs text-stone-500 mt-1">
                          {thesisPapers.length} papers
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveThesis(thesis.id, false);
                          }}
                          className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors"
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
                          className="p-2 text-stone-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-xs text-stone-400">
          <p>&copy; 2023 IdeaGraph Inc. <span className="mx-2">&bull;</span> Privacy <span className="mx-2">&bull;</span> Terms</p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <a className="hover:text-stone-600 transition-colors flex items-center gap-1" href="#">
              <MaterialIcon icon="help" className="text-[14px]" /> Help Center
            </a>
          </div>
        </div>
      </footer>

      {/* Data Manager Modal */}
      {showDataManager && (
        <DataManager onClose={() => setShowDataManager(false)} />
      )}
    </div>
  );
}
