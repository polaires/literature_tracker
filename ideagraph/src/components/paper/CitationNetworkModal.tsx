import { useState, useCallback, useEffect } from 'react';
import {
  X,
  ArrowDown,
  ArrowUp,
  Plus,
  Check,
  ExternalLink,
  Loader2,
  BookOpen,
  Calendar,
  Quote,
  Network,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import {
  getCitingPapers,
  getReferencedPapers,
  getRecommendedPapers,
  type SemanticScholarPaper,
} from '../../services/api/semanticScholar';
import { cleanAbstract } from '../../utils/textCleaner';
import type { Paper, ThesisRole } from '../../types';

interface CitationNetworkModalProps {
  thesisId: string;
  paper: Paper;
  onClose: () => void;
}

type NetworkTab = 'citing' | 'references' | 'recommended';

export function CitationNetworkModal({ thesisId, paper, onClose }: CitationNetworkModalProps) {
  const { addPaper, addPapersBatch, hasPaperWithDOI, getPapersForThesis } = useAppStore();
  const existingPapers = getPapersForThesis(thesisId);

  // Tab state
  const [activeTab, setActiveTab] = useState<NetworkTab>('citing');

  // Results state
  const [citingPapers, setCitingPapers] = useState<SemanticScholarPaper[]>([]);
  const [referencedPapers, setReferencedPapers] = useState<SemanticScholarPaper[]>([]);
  const [recommendedPapers, setRecommendedPapers] = useState<SemanticScholarPaper[]>([]);

  // Loading state
  const [loadingCiting, setLoadingCiting] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [loadingRecommended, setLoadingRecommended] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Selection for batch add
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [addingPapers, setAddingPapers] = useState<Set<string>>(new Set());

  // Get current results based on tab
  const currentResults =
    activeTab === 'citing'
      ? citingPapers
      : activeTab === 'references'
      ? referencedPapers
      : recommendedPapers;

  const isLoading =
    activeTab === 'citing'
      ? loadingCiting
      : activeTab === 'references'
      ? loadingReferences
      : loadingRecommended;

  // Get Semantic Scholar ID from paper
  const semanticScholarId = paper.semanticScholarId;

  // Fetch citing papers
  const fetchCiting = useCallback(async () => {
    if (!semanticScholarId || citingPapers.length > 0) return;

    setLoadingCiting(true);
    setError(null);
    try {
      const result = await getCitingPapers(semanticScholarId, { limit: 50 });
      setCitingPapers(result.papers.filter((p) => p && p.paperId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch citing papers');
    } finally {
      setLoadingCiting(false);
    }
  }, [semanticScholarId, citingPapers.length]);

  // Fetch referenced papers
  const fetchReferences = useCallback(async () => {
    if (!semanticScholarId || referencedPapers.length > 0) return;

    setLoadingReferences(true);
    setError(null);
    try {
      const result = await getReferencedPapers(semanticScholarId, { limit: 50 });
      setReferencedPapers(result.papers.filter((p) => p && p.paperId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch references');
    } finally {
      setLoadingReferences(false);
    }
  }, [semanticScholarId, referencedPapers.length]);

  // Fetch recommended papers
  const fetchRecommended = useCallback(async () => {
    if (!semanticScholarId || recommendedPapers.length > 0) return;

    setLoadingRecommended(true);
    setError(null);
    try {
      const papers = await getRecommendedPapers(semanticScholarId, { limit: 20 });
      setRecommendedPapers(papers.filter((p) => p && p.paperId));
    } catch (e) {
      // Recommendations may not be available
      console.warn('Recommendations not available');
      setRecommendedPapers([]);
    } finally {
      setLoadingRecommended(false);
    }
  }, [semanticScholarId, recommendedPapers.length]);

  // Auto-fetch when tab changes
  useEffect(() => {
    if (activeTab === 'citing') {
      fetchCiting();
    } else if (activeTab === 'references') {
      fetchReferences();
    } else if (activeTab === 'recommended') {
      fetchRecommended();
    }
  }, [activeTab, fetchCiting, fetchReferences, fetchRecommended]);

  // Check if paper already exists
  const isPaperAdded = useCallback(
    (p: SemanticScholarPaper): boolean => {
      if (p.externalIds?.DOI) {
        return hasPaperWithDOI(thesisId, p.externalIds.DOI);
      }
      return existingPapers.some(
        (ep) =>
          ep.semanticScholarId === p.paperId ||
          ep.title.toLowerCase() === p.title.toLowerCase()
      );
    },
    [thesisId, hasPaperWithDOI, existingPapers]
  );

  // Convert Semantic Scholar paper to our Paper type
  const convertToPaper = useCallback(
    (
      ssPaper: SemanticScholarPaper,
      role: ThesisRole = 'background'
    ): Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'> => {
      return {
        thesisId,
        doi: ssPaper.externalIds?.DOI || null,
        title: ssPaper.title,
        authors: ssPaper.authors?.map((a) => ({ name: a.name })) || [],
        year: ssPaper.year,
        journal: ssPaper.venue,
        volume: null,
        issue: null,
        pages: null,
        abstract: ssPaper.abstract,
        url: ssPaper.externalIds?.DOI
          ? `https://doi.org/${ssPaper.externalIds.DOI}`
          : null,
        pdfUrl: ssPaper.openAccessPdf?.url || null,
        citationCount: ssPaper.citationCount,
        takeaway: ssPaper.tldr?.text || 'Takeaway to be added after reading',
        arguments: [],
        evidence: [],
        assessment: null,
        thesisRole: role,
        readingStatus: 'screening',
        tags: [],
        readAt: null,
        source: 'search',
        rawBibtex: null,
        screeningDecision: 'pending',
        exclusionReason: null,
        exclusionNote: null,
        screenedAt: null,
        semanticScholarId: ssPaper.paperId,
      };
    },
    [thesisId]
  );

  // Add single paper
  const handleAddPaper = useCallback(
    async (p: SemanticScholarPaper) => {
      setAddingPapers((prev) => new Set(prev).add(p.paperId));
      try {
        addPaper(convertToPaper(p));
      } finally {
        setAddingPapers((prev) => {
          const next = new Set(prev);
          next.delete(p.paperId);
          return next;
        });
      }
    },
    [addPaper, convertToPaper]
  );

  // Add selected papers in batch
  const handleAddSelected = useCallback(() => {
    const papersToAdd = currentResults
      .filter((p) => selectedPapers.has(p.paperId) && !isPaperAdded(p))
      .map((p) => convertToPaper(p));

    if (papersToAdd.length > 0) {
      addPapersBatch(papersToAdd);
      setSelectedPapers(new Set());
    }
  }, [currentResults, selectedPapers, isPaperAdded, convertToPaper, addPapersBatch]);

  // Toggle paper selection
  const toggleSelection = useCallback((paperId: string) => {
    setSelectedPapers((prev) => {
      const next = new Set(prev);
      if (next.has(paperId)) {
        next.delete(paperId);
      } else {
        next.add(paperId);
      }
      return next;
    });
  }, []);

  // Select all visible papers that haven't been added
  const selectAll = useCallback(() => {
    const available = currentResults
      .filter((p) => !isPaperAdded(p))
      .map((p) => p.paperId);
    setSelectedPapers(new Set(available));
  }, [currentResults, isPaperAdded]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedPapers(new Set());
  }, []);

  // No Semantic Scholar ID available
  if (!semanticScholarId) {
    return (
      <Modal onClose={onClose} className="max-w-lg">
        <div className="p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Citation Network Unavailable
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This paper wasn't imported from Semantic Scholar, so we can't explore its
            citation network.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Try searching for this paper in the Search modal to get a version with
            citation data.
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} className="max-w-4xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-3">
            <Network className="w-5 h-5 text-stone-700 dark:text-stone-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Citation Network
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
            {paper.title}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('citing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'citing'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ArrowDown size={16} />
            Papers Citing This
            {citingPapers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-500 rounded-full">
                {citingPapers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('references')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'references'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ArrowUp size={16} />
            References
            {referencedPapers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-500 rounded-full">
                {referencedPapers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'recommended'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <RefreshCw size={16} />
            Similar Papers
            {recommendedPapers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-500 rounded-full">
                {recommendedPapers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Selection Actions */}
      {selectedPapers.size > 0 && (
        <div className="px-6 py-2 bg-stone-100 dark:bg-stone-800/20 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <span className="text-sm text-stone-800 dark:text-stone-300">
            {selectedPapers.size} paper{selectedPapers.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={clearSelection}
              className="text-sm text-stone-700 dark:text-stone-400 hover:underline"
            >
              Clear selection
            </button>
            <Button onClick={handleAddSelected} icon={<Plus size={16} />} size="sm">
              Add Selected
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 mb-4">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="animate-spin mx-auto text-stone-700 mb-4" size={32} />
            <p className="text-gray-500 dark:text-gray-400">
              Loading {activeTab === 'citing' ? 'citing papers' : activeTab === 'references' ? 'references' : 'recommendations'}...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && currentResults.length === 0 && (
          <div className="text-center py-12">
            <Network size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === 'citing'
                ? 'No papers citing this one were found'
                : activeTab === 'references'
                ? 'No references found for this paper'
                : 'No similar papers found'}
            </p>
          </div>
        )}

        {/* Results list */}
        {!isLoading && currentResults.length > 0 && (
          <div className="space-y-3">
            {/* Stats bar */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                {currentResults.length} paper{currentResults.length > 1 ? 's' : ''}
                {activeTab === 'citing'
                  ? ' cite this paper'
                  : activeTab === 'references'
                  ? ' referenced by this paper'
                  : ' similar to this paper'}
              </span>
              {currentResults.filter((p) => !isPaperAdded(p)).length > 0 && (
                <button
                  onClick={selectAll}
                  className="text-stone-700 dark:text-stone-400 hover:underline"
                >
                  Select all available
                </button>
              )}
            </div>

            {/* Paper cards */}
            {currentResults.map((p) => {
              const isAdded = isPaperAdded(p);
              const isSelected = selectedPapers.has(p.paperId);
              const isAdding = addingPapers.has(p.paperId);

              return (
                <div
                  key={p.paperId}
                  className={`p-4 border rounded-lg transition-all ${
                    isAdded
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                      : isSelected
                      ? 'border-stone-500 bg-stone-100 dark:bg-stone-800/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Selection checkbox */}
                    {!isAdded && (
                      <button
                        onClick={() => toggleSelection(p.paperId)}
                        className={`flex-shrink-0 w-5 h-5 mt-1 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-stone-700 bg-stone-700 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-stone-400'
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                        {p.title}
                      </h3>

                      {/* Authors */}
                      {p.authors && p.authors.length > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {p.authors.slice(0, 3).map((a) => a.name).join(', ')}
                          {p.authors.length > 3 && ` +${p.authors.length - 3} more`}
                        </p>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {p.year && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {p.year}
                          </span>
                        )}
                        {p.venue && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <BookOpen size={12} />
                            {p.venue}
                          </span>
                        )}
                        {p.citationCount !== null && (
                          <span className="flex items-center gap-1">
                            <Quote size={12} />
                            {p.citationCount.toLocaleString()} citations
                          </span>
                        )}
                        {p.openAccessPdf && (
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <FileText size={12} />
                            Open Access
                          </span>
                        )}
                      </div>

                      {/* Abstract snippet */}
                      {p.abstract && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {cleanAbstract(p.abstract)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {isAdded ? (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          <Check size={12} />
                          Added
                        </span>
                      ) : (
                        <Button
                          onClick={() => handleAddPaper(p)}
                          disabled={isAdding}
                          size="sm"
                          icon={
                            isAdding ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <Plus size={14} />
                            )
                          }
                        >
                          Add
                        </Button>
                      )}

                      {p.externalIds?.DOI && (
                        <a
                          href={`https://doi.org/${p.externalIds.DOI}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-stone-700 dark:hover:text-stone-400 transition-colors"
                        >
                          <ExternalLink size={12} />
                          DOI
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
