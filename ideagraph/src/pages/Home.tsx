import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Archive, ArchiveRestore, Trash2, Beaker, MoreVertical, Settings, Clock, AlertCircle, ChevronRight, BarChart3, FileText, Brain } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { loadSampleData } from '../utils/sampleData';
import { loadEnhancedSampleData, workflowSummary } from '../utils/enhancedSampleData';
import { loadCrisprReviewSampleData, crisprWorkflowSummary } from '../utils/crisprReviewPart5';
import { DataManager } from '../components/common/DataManager';
import { UserMenu } from '../components/auth';
import type { Paper } from '../types';

// Brand Logo Component
function BrandLogo({ size = 48 }: { size?: number }) {
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
        <linearGradient id="homeBrandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#78716c" />
          <stop offset="50%" stopColor="#57534e" />
          <stop offset="100%" stopColor="#44403c" />
        </linearGradient>
        <linearGradient id="homeNodeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d6d3d1" />
          <stop offset="100%" stopColor="#a8a29e" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#homeBrandGradient)" />
      <circle cx="24" cy="24" r="5" fill="white" />
      <circle cx="14" cy="16" r="3" fill="url(#homeNodeGlow)" />
      <circle cx="34" cy="16" r="3" fill="url(#homeNodeGlow)" />
      <circle cx="12" cy="30" r="3" fill="url(#homeNodeGlow)" />
      <circle cx="36" cy="30" r="3" fill="url(#homeNodeGlow)" />
      <circle cx="24" cy="38" r="3" fill="url(#homeNodeGlow)" />
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

export function Home() {
  const navigate = useNavigate();
  const {
    theses,
    papers,
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
  const [showStats, setShowStats] = useState(false);

  // Calculate forgotten papers (not accessed in 14+ days)
  const forgottenPapers = useMemo(() => {
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const activeThesisIds = theses.filter((t) => !t.isArchived).map((t) => t.id);

    return papers
      .filter((p) => {
        const lastAccessed = new Date(p.lastAccessedAt).getTime();
        return (
          activeThesisIds.includes(p.thesisId) &&
          lastAccessed < fourteenDaysAgo &&
          p.readingStatus !== 'read' // Don't remind about fully read papers
        );
      })
      .sort(
        (a, b) =>
          new Date(a.lastAccessedAt).getTime() - new Date(b.lastAccessedAt).getTime()
      )
      .slice(0, 5); // Show max 5
  }, [papers, theses]);

  // Reading statistics
  const readingStats = useMemo(() => {
    const activeThesisIds = theses.filter((t) => !t.isArchived).map((t) => t.id);
    const activePapers = papers.filter((p) => activeThesisIds.includes(p.thesisId));

    const byStatus = {
      'to-read': activePapers.filter((p) => p.readingStatus === 'to-read').length,
      reading: activePapers.filter((p) => p.readingStatus === 'reading').length,
      read: activePapers.filter((p) => p.readingStatus === 'read').length,
      'to-revisit': activePapers.filter((p) => p.readingStatus === 'to-revisit').length,
    };

    const byRole = {
      supports: activePapers.filter((p) => p.thesisRole === 'supports').length,
      contradicts: activePapers.filter((p) => p.thesisRole === 'contradicts').length,
      method: activePapers.filter((p) => p.thesisRole === 'method').length,
      background: activePapers.filter((p) => p.thesisRole === 'background').length,
      other: activePapers.filter((p) => p.thesisRole === 'other').length,
    };

    // Papers added in last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentlyAdded = activePapers.filter(
      (p) => new Date(p.addedAt).getTime() > sevenDaysAgo
    ).length;

    return {
      total: activePapers.length,
      byStatus,
      byRole,
      recentlyAdded,
    };
  }, [papers, theses]);

  const getDaysAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleOpenPaper = (paper: Paper) => {
    const thesis = theses.find((t) => t.id === paper.thesisId);
    if (thesis) {
      setActiveThesis(thesis.id);
      navigate(`/thesis/${thesis.id}`);
    }
  };

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
    // Wrapper for createCluster to match expected signature
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

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-[#FDFBF7] via-white to-stone-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-stone-950/20">
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-12">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo size={56} />
            <div>
              <h1 className="text-4xl font-bold text-brand-gradient">
                IdeaGraph
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                Catalog ideas, not just papers. Build your knowledge graph.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDataManager(true)}
              className="p-2.5 text-gray-500 hover:text-stone-700 dark:text-gray-400 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900/20 rounded-xl transition-colors"
              title="Settings & Data"
            >
              <Settings size={22} />
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        {/* Quick Actions - PDF Reader */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/reader')}
            className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-600 via-stone-700 to-stone-800 p-[2px] shadow-lg hover:shadow-xl transition-all"
          >
            <div className="relative flex items-center gap-6 rounded-2xl bg-white dark:bg-gray-900 px-6 py-5 transition-all group-hover:bg-opacity-95 dark:group-hover:bg-opacity-95">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800/50 dark:to-stone-700/50 flex items-center justify-center">
                <FileText className="w-7 h-7 text-stone-700 dark:text-stone-400" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Read a PDF with AI
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-stone-100 dark:bg-stone-800/50 text-stone-700 dark:text-stone-400">
                    New
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Upload any paper and get AI-powered summaries, key findings, and methodology extraction
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2 text-stone-700 dark:text-stone-400">
                <Brain className="w-5 h-5" />
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* Forgotten Papers Alert */}
        {forgottenPapers.length > 0 && (
          <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-800/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                  Papers you might have forgotten
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300/80 mb-3">
                  These papers haven't been accessed in over 2 weeks.
                </p>
                <div className="space-y-2">
                  {forgottenPapers.map((paper) => {
                    const thesis = theses.find((t) => t.id === paper.thesisId);
                    const daysAgo = getDaysAgo(paper.lastAccessedAt);
                    return (
                      <div
                        key={paper.id}
                        onClick={() => handleOpenPaper(paper)}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl cursor-pointer hover:shadow-md transition-all group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {paper.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {thesis?.title} · Last accessed {daysAgo} days ago
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-stone-600 dark:group-hover:text-stone-400 flex-shrink-0 ml-2 transition-colors" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reading Statistics */}
        {readingStats.total > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-stone-700 dark:hover:text-stone-400 transition-colors mb-3"
            >
              <BarChart3 size={16} />
              {showStats ? 'Hide' : 'Show'} Reading Statistics
            </button>

            {showStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="text-center p-3 bg-stone-100 dark:bg-stone-800/20 rounded-xl">
                  <p className="text-3xl font-bold text-stone-700 dark:text-stone-400">
                    {readingStats.total}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Papers</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {readingStats.byStatus.read}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Read</p>
                </div>
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {readingStats.byStatus.reading}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reading</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                    {readingStats.byStatus['to-read']}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">To Read</p>
                </div>

                {/* Role breakdown */}
                <div className="col-span-2 md:col-span-4 pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">By Role:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {readingStats.byRole.supports} supporting
                    </span>
                    <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                      {readingStats.byRole.contradicts} contradicting
                    </span>
                    <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {readingStats.byRole.method} methods
                    </span>
                    <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                      {readingStats.byRole.background} background
                    </span>
                  </div>
                </div>

                {readingStats.recentlyAdded > 0 && (
                  <div className="col-span-2 md:col-span-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock size={12} />
                    {readingStats.recentlyAdded} papers added in the last 7 days
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Your Research
          </h2>
          <div className="flex items-center gap-2">
            {activeTheses.length === 0 && (
              <>
                <button
                  onClick={handleLoadSampleData}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium shadow-sm"
                  title="Load simple demo (5 papers)"
                >
                  <Beaker size={18} />
                  Simple Demo
                </button>
                <button
                  onClick={handleLoadEnhancedDemo}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium shadow-sm"
                  title={`Load comprehensive demo (${workflowSummary.totalPapers} papers with themes, gaps, and sections)`}
                >
                  <Beaker size={18} />
                  Full Demo
                </button>
                <button
                  onClick={handleLoadCrisprDemo}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium shadow-sm"
                  title={`CRISPR Review Demo (${crisprWorkflowSummary.totalPapers} papers - mimics writing a biological review)`}
                >
                  <Beaker size={18} />
                  CRISPR Review ({crisprWorkflowSummary.totalPapers})
                </button>
              </>
            )}
            <button
              onClick={() => setShowNewThesisForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 btn-brand rounded-xl font-medium"
            >
              <Plus size={18} />
              New Thesis
            </button>
          </div>
        </div>

        {/* New Thesis Form */}
        {showNewThesisForm && (
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Create New Thesis
            </h3>
            <form onSubmit={handleCreateThesis}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Research Question / Hypothesis
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., What are the limitations of AlphaFold for drug discovery?"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="A longer explanation of your research focus..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 btn-brand rounded-xl font-medium"
                >
                  Create Thesis
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewThesisForm(false)}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Thesis List */}
        {activeTheses.length === 0 && !showNewThesisForm ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 dark:bg-stone-800/30 flex items-center justify-center">
              <BookOpen size={32} className="text-stone-600 dark:text-stone-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No research theses yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Create your first thesis to start building your knowledge graph of connected ideas.
            </p>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setShowNewThesisForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 btn-brand rounded-xl font-medium"
              >
                <Plus size={18} />
                Create Your First Thesis
              </button>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <button
                  onClick={handleLoadSampleData}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium shadow-sm text-sm"
                >
                  <Beaker size={16} />
                  Simple (5)
                </button>
                <button
                  onClick={handleLoadEnhancedDemo}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium shadow-sm text-sm"
                >
                  <Beaker size={16} />
                  LLM Code ({workflowSummary.totalPapers})
                </button>
                <button
                  onClick={handleLoadCrisprDemo}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium shadow-sm text-sm"
                >
                  <Beaker size={16} />
                  CRISPR Review ({crisprWorkflowSummary.totalPapers})
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                CRISPR demo has {crisprWorkflowSummary.totalPapers} papers with {crisprWorkflowSummary.totalClusters} clusters - mimics writing a biological review
              </p>
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
                  className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-stone-300 dark:hover:border-stone-700 transition-all cursor-pointer group"
                  onClick={() => handleOpenThesis(thesis.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-stone-700 dark:group-hover:text-stone-400 transition-colors">
                        {thesis.title}
                      </h3>
                      {thesis.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                          {thesis.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 dark:bg-stone-800/20 text-stone-700 dark:text-stone-400 rounded-lg font-medium">
                          {thesisPapers.length} papers
                        </span>
                        <span className="text-gray-400 dark:text-gray-500">
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
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1.5 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveThesis(thesis.id, true);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
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
                              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
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
        {archivedTheses.length > 0 && (
          <div className="mt-12">
            <h3 className="flex items-center gap-2 text-lg font-medium text-gray-500 dark:text-gray-400 mb-4">
              <Archive size={20} />
              Archived ({archivedTheses.length})
            </h3>
            <div className="space-y-2">
              {archivedTheses.map((thesis) => {
                const thesisPapers = getPapersForThesis(thesis.id);
                return (
                  <div
                    key={thesis.id}
                    className="group p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
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
                          {thesisPapers.length} papers
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveThesis(thesis.id, false);
                          }}
                          className="p-2 text-gray-500 hover:text-stone-700 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/20 rounded-lg transition-colors"
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
