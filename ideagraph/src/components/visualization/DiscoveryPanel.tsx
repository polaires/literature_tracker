import { X, Plus, Search, FileText, Loader2, Brain, Target, Sparkles } from 'lucide-react';
import type { SemanticScholarPaper } from '../../services/api/semanticScholar';

interface SimilarityInfo {
  embeddingScore?: number;
  keywordScore?: number;
  combinedScore?: number;
  source?: 'keyword' | 'embedding' | 'both';
}

interface DiscoveryPanelProps {
  papers: SemanticScholarPaper[];
  loading: boolean;
  error: string | null;
  existingPaperIds: Set<string>;
  onPaperClick: (paper: SemanticScholarPaper) => void;
  onSearchMore: () => void;
  onClose: () => void;
  // Optional similarity info for each paper
  similarityMap?: Map<string, SimilarityInfo>;
  // Show this is semantic-based discovery
  isSemanticSearch?: boolean;
}

export function DiscoveryPanel({
  papers,
  loading,
  error,
  existingPaperIds,
  onPaperClick,
  onSearchMore,
  onClose,
  similarityMap,
  isSemanticSearch = false,
}: DiscoveryPanelProps) {
  if (loading) {
    return (
      <div className="absolute top-4 right-16 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200">
        <div className="p-6 flex flex-col items-center justify-center">
          <Loader2 size={24} className="text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Finding similar papers...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute top-4 right-16 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Discovery
            </h4>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={14} className="text-slate-400" />
            </button>
          </div>
          <p className="text-sm text-rose-500">{error}</p>
        </div>
      </div>
    );
  }

  if (papers.length === 0) {
    return null;
  }

  // Filter out papers that are already in the thesis
  const newPapers = papers.filter((p) => !existingPaperIds.has(p.paperId));

  return (
    <div className="absolute top-4 right-16 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSemanticSearch ? (
              <Brain size={14} className="text-stone-500" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-stone-500 animate-pulse" />
            )}
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {isSemanticSearch ? 'Semantically Similar' : 'Similar Papers'}
            </h4>
            {isSemanticSearch && (
              <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 dark:bg-stone-900/30 text-stone-600 dark:text-stone-400 rounded-full">
                AI
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={14} className="text-slate-400" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {newPapers.length} new papers found
          {papers.length !== newPapers.length && (
            <span className="text-slate-300"> ({papers.length - newPapers.length} already in thesis)</span>
          )}
        </p>
      </div>

      {/* Paper List */}
      <div className="max-h-96 overflow-y-auto">
        {newPapers.map((paper) => {
          const similarity = similarityMap?.get(paper.paperId);
          return (
            <button
              key={paper.paperId}
              onClick={() => onPaperClick(paper)}
              className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors group"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  {/* Similarity score badge */}
                  {similarity && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-stone-100 dark:bg-stone-900/30 rounded text-[10px] text-stone-700 dark:text-stone-300">
                        <Target size={10} />
                        {Math.round((similarity.combinedScore || similarity.embeddingScore || 0) * 100)}%
                      </div>
                      {similarity.source === 'both' && (
                        <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-[10px] text-green-700 dark:text-green-300 flex items-center gap-0.5">
                          <Sparkles size={8} />
                          Both
                        </span>
                      )}
                      {similarity.source === 'embedding' && (
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-[10px] text-blue-700 dark:text-blue-300 flex items-center gap-0.5">
                          <Brain size={8} />
                          Semantic
                        </span>
                      )}
                    </div>
                  )}
                  <h5 className="text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {paper.title}
                  </h5>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    {paper.authors?.slice(0, 2).map((a) => a.name).join(', ')}
                    {paper.authors && paper.authors.length > 2 && ' et al.'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {paper.year && (
                      <span className="text-xs text-slate-400">{paper.year}</span>
                    )}
                    {paper.citationCount !== null && paper.citationCount > 0 && (
                      <span className="text-xs text-slate-400">
                        {paper.citationCount.toLocaleString()} cites
                      </span>
                    )}
                    {paper.openAccessPdf && (
                      <FileText size={12} className="text-emerald-500" />
                    )}
                  </div>
                </div>
                <Plus
                  size={16}
                  className="text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-0.5"
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <button
          onClick={onSearchMore}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
        >
          <Search size={14} />
          Search for more...
        </button>
      </div>
    </div>
  );
}
