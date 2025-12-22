import { useState, useCallback, useMemo } from 'react';
import {
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  ExternalLink,
  Loader2,
  BookOpen,
  Calendar,
  Quote,
  Sparkles,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import {
  searchPapers,
  extractKeywords,
  type SemanticScholarPaper,
  type SearchFilters,
} from '../../services/api/semanticScholar';
import type { Paper, ThesisRole } from '../../types';

interface PaperSearchModalProps {
  thesisId: string;
  onClose: () => void;
  initialQuery?: string;
}

// Publication type options
const PUBLICATION_TYPES = [
  { value: 'Review', label: 'Review' },
  { value: 'JournalArticle', label: 'Journal Article' },
  { value: 'Conference', label: 'Conference' },
  { value: 'Book', label: 'Book' },
  { value: 'BookSection', label: 'Book Chapter' },
  { value: 'Dataset', label: 'Dataset' },
];

// Field of study options (common ones)
const FIELDS_OF_STUDY = [
  'Computer Science',
  'Medicine',
  'Biology',
  'Chemistry',
  'Physics',
  'Engineering',
  'Materials Science',
  'Environmental Science',
  'Psychology',
  'Economics',
  'Mathematics',
  'Sociology',
];

export function PaperSearchModal({ thesisId, onClose, initialQuery = '' }: PaperSearchModalProps) {
  const { addPaper, addPapersBatch, hasPaperWithDOI, getPapersForThesis } = useAppStore();
  const existingPapers = getPapersForThesis(thesisId);

  // Search state
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SemanticScholarPaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const RESULTS_PER_PAGE = 20;

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [minCitations, setMinCitations] = useState('');
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // Selection for batch add
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [addingPapers, setAddingPapers] = useState<Set<string>>(new Set());

  // Keyword suggestions from existing papers
  const suggestedKeywords = useMemo(() => {
    const allText = existingPapers
      .map((p) => [p.title, p.abstract, p.takeaway].filter(Boolean).join(' '))
      .join(' ');
    return extractKeywords(allText, 8);
  }, [existingPapers]);

  // Build filters object
  const buildFilters = useCallback((): SearchFilters => {
    const f: SearchFilters = {};

    if (yearFrom || yearTo) {
      const from = yearFrom || '1900';
      const to = yearTo || new Date().getFullYear().toString();
      f.year = `${from}-${to}`;
    }

    if (minCitations) {
      f.minCitationCount = parseInt(minCitations, 10);
    }

    if (openAccessOnly) {
      f.openAccessOnly = true;
    }

    if (selectedTypes.length > 0) {
      f.publicationTypes = selectedTypes;
    }

    if (selectedFields.length > 0) {
      f.fieldsOfStudy = selectedFields;
    }

    return f;
  }, [yearFrom, yearTo, minCitations, openAccessOnly, selectedTypes, selectedFields]);

  // Perform search
  const handleSearch = useCallback(async (newSearch = true) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const searchOffset = newSearch ? 0 : offset + RESULTS_PER_PAGE;
      const result = await searchPapers(query, {
        limit: RESULTS_PER_PAGE,
        offset: searchOffset,
        filters: buildFilters(),
      });

      if (newSearch) {
        setResults(result.papers);
        setOffset(0);
      } else {
        setResults((prev) => [...prev, ...result.papers]);
        setOffset(searchOffset);
      }

      setTotal(result.total);
      setHasMore(result.next !== undefined);
      setHasSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [query, offset, buildFilters]);

  // Check if paper already exists
  const isPaperAdded = useCallback((paper: SemanticScholarPaper): boolean => {
    if (paper.externalIds?.DOI) {
      return hasPaperWithDOI(thesisId, paper.externalIds.DOI);
    }
    return existingPapers.some(
      (p) => p.semanticScholarId === paper.paperId || p.title.toLowerCase() === paper.title.toLowerCase()
    );
  }, [thesisId, hasPaperWithDOI, existingPapers]);

  // Convert Semantic Scholar paper to our Paper type
  const convertToPaper = useCallback((
    ssPaper: SemanticScholarPaper,
    role: ThesisRole = 'background'
  ): Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'> => {
    return {
      thesisId,
      doi: ssPaper.externalIds?.DOI || null,
      title: ssPaper.title,
      authors: ssPaper.authors.map((a) => ({ name: a.name })),
      year: ssPaper.year,
      journal: ssPaper.venue,
      volume: null,
      issue: null,
      pages: null,
      abstract: ssPaper.abstract,
      url: ssPaper.externalIds?.DOI ? `https://doi.org/${ssPaper.externalIds.DOI}` : null,
      pdfUrl: ssPaper.openAccessPdf?.url || null,
      citationCount: ssPaper.citationCount,
      takeaway: ssPaper.tldr?.text || 'Takeaway to be added after reading',
      arguments: [],
      evidence: [],
      assessment: null,
      thesisRole: role,
      readingStatus: 'screening',
      tags: ssPaper.fieldsOfStudy || [],
      readAt: null,
      source: 'search',
      rawBibtex: null,
      screeningDecision: 'pending',
      exclusionReason: null,
      exclusionNote: null,
      screenedAt: null,
      semanticScholarId: ssPaper.paperId,
    };
  }, [thesisId]);

  // Add single paper
  const handleAddPaper = useCallback(async (paper: SemanticScholarPaper) => {
    setAddingPapers((prev) => new Set(prev).add(paper.paperId));
    try {
      addPaper(convertToPaper(paper));
    } finally {
      setAddingPapers((prev) => {
        const next = new Set(prev);
        next.delete(paper.paperId);
        return next;
      });
    }
  }, [addPaper, convertToPaper]);

  // Add selected papers in batch
  const handleAddSelected = useCallback(() => {
    const papersToAdd = results
      .filter((p) => selectedPapers.has(p.paperId) && !isPaperAdded(p))
      .map((p) => convertToPaper(p));

    if (papersToAdd.length > 0) {
      addPapersBatch(papersToAdd);
      setSelectedPapers(new Set());
    }
  }, [results, selectedPapers, isPaperAdded, convertToPaper, addPapersBatch]);

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
    const available = results.filter((p) => !isPaperAdded(p)).map((p) => p.paperId);
    setSelectedPapers(new Set(available));
  }, [results, isPaperAdded]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedPapers(new Set());
  }, []);

  // Handle keyword click
  const handleKeywordClick = useCallback((keyword: string) => {
    setQuery((prev) => (prev ? `${prev} ${keyword}` : keyword));
  }, []);

  // Handle enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch(true);
    }
  }, [handleSearch]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setYearFrom('');
    setYearTo('');
    setMinCitations('');
    setOpenAccessOnly(false);
    setSelectedTypes([]);
    setSelectedFields([]);
  }, []);

  const activeFilterCount = [
    yearFrom || yearTo,
    minCitations,
    openAccessOnly,
    selectedTypes.length > 0,
    selectedFields.length > 0,
  ].filter(Boolean).length;

  return (
    <Modal onClose={onClose} className="max-w-4xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search Papers
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by title, author, keywords..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <Button
            onClick={() => handleSearch(true)}
            disabled={isLoading || !query.trim()}
            icon={isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          >
            Search
          </Button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter size={18} />
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 text-xs bg-indigo-600 text-white rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Keyword suggestions */}
        {suggestedKeywords.length > 0 && !hasSearched && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Sparkles size={12} />
              Suggested:
            </span>
            {suggestedKeywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => handleKeywordClick(keyword)}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Year Range */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Year From
                </label>
                <input
                  type="number"
                  value={yearFrom}
                  onChange={(e) => setYearFrom(e.target.value)}
                  placeholder="e.g., 2020"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Year To
                </label>
                <input
                  type="number"
                  value={yearTo}
                  onChange={(e) => setYearTo(e.target.value)}
                  placeholder="e.g., 2024"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Min Citations */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Min Citations
                </label>
                <input
                  type="number"
                  value={minCitations}
                  onChange={(e) => setMinCitations(e.target.value)}
                  placeholder="e.g., 10"
                  min="0"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Open Access */}
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openAccessOnly}
                    onChange={(e) => setOpenAccessOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Open Access Only</span>
                </label>
              </div>
            </div>

            {/* Publication Types */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Publication Type
              </label>
              <div className="flex flex-wrap gap-2">
                {PUBLICATION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setSelectedTypes((prev) =>
                        prev.includes(type.value)
                          ? prev.filter((t) => t !== type.value)
                          : [...prev, type.value]
                      );
                    }}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      selectedTypes.includes(type.value)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fields of Study */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Field of Study
              </label>
              <div className="flex flex-wrap gap-2">
                {FIELDS_OF_STUDY.map((field) => (
                  <button
                    key={field}
                    onClick={() => {
                      setSelectedFields((prev) =>
                        prev.includes(field)
                          ? prev.filter((f) => f !== field)
                          : [...prev, field]
                      );
                    }}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      selectedFields.includes(field)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selection Actions */}
      {selectedPapers.size > 0 && (
        <div className="px-6 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
          <span className="text-sm text-indigo-700 dark:text-indigo-300">
            {selectedPapers.size} paper{selectedPapers.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={clearSelection}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
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
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!hasSearched && !isLoading && (
          <div className="text-center py-12">
            <Search size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Search Semantic Scholar to find papers
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Results are matched against title and abstract
            </p>
          </div>
        )}

        {/* No results */}
        {hasSearched && !isLoading && results.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No papers found matching your search
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Try different keywords or adjust filters
            </p>
          </div>
        )}

        {/* Results list */}
        {results.length > 0 && (
          <div className="space-y-3">
            {/* Stats bar */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                Showing {results.length} of {total.toLocaleString()} results
              </span>
              {results.filter((p) => !isPaperAdded(p)).length > 0 && (
                <button
                  onClick={selectAll}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Select all available
                </button>
              )}
            </div>

            {/* Paper cards */}
            {results.map((paper) => {
              const isAdded = isPaperAdded(paper);
              const isSelected = selectedPapers.has(paper.paperId);
              const isAdding = addingPapers.has(paper.paperId);

              return (
                <div
                  key={paper.paperId}
                  className={`p-4 border rounded-lg transition-all ${
                    isAdded
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                      : isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Selection checkbox */}
                    {!isAdded && (
                      <button
                        onClick={() => toggleSelection(paper.paperId)}
                        className={`flex-shrink-0 w-5 h-5 mt-1 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                        {paper.title}
                      </h3>

                      {/* Authors */}
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {paper.authors.slice(0, 3).map((a) => a.name).join(', ')}
                        {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                      </p>

                      {/* Meta info */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {paper.year && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {paper.year}
                          </span>
                        )}
                        {paper.venue && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <BookOpen size={12} />
                            {paper.venue}
                          </span>
                        )}
                        {paper.citationCount !== null && (
                          <span className="flex items-center gap-1">
                            <Quote size={12} />
                            {paper.citationCount.toLocaleString()} citations
                          </span>
                        )}
                        {paper.openAccessPdf && (
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <FileText size={12} />
                            Open Access
                          </span>
                        )}
                      </div>

                      {/* TLDR */}
                      {paper.tldr?.text && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 italic">
                          "{paper.tldr.text}"
                        </p>
                      )}

                      {/* Abstract snippet */}
                      {!paper.tldr?.text && paper.abstract && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {paper.abstract}
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
                          onClick={() => handleAddPaper(paper)}
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

                      {paper.externalIds?.DOI && (
                        <a
                          href={`https://doi.org/${paper.externalIds.DOI}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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

            {/* Load more */}
            {hasMore && !isLoading && (
              <div className="text-center pt-4">
                <Button
                  onClick={() => handleSearch(false)}
                  variant="secondary"
                  icon={<ChevronDown size={16} />}
                >
                  Load more results
                </Button>
              </div>
            )}

            {/* Loading more */}
            {isLoading && results.length > 0 && (
              <div className="text-center py-4">
                <Loader2 className="animate-spin mx-auto text-indigo-600" size={24} />
              </div>
            )}
          </div>
        )}

        {/* Initial loading */}
        {isLoading && results.length === 0 && (
          <div className="text-center py-12">
            <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={32} />
            <p className="text-gray-500 dark:text-gray-400">Searching...</p>
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
