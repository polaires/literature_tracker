// ExtractionPanel Component
// Panel for extracting and displaying Paper IdeaGraph knowledge from PDFs

import { useState, useCallback, useEffect, useRef, memo } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Beaker,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  Play,
  Square,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { usePaperExtraction } from '../../hooks/usePaperExtraction';
import type { Paper, Thesis } from '../../types';
import type {
  ExtractedFinding,
  FindingType,
  ExtractionProgress,
} from '../../types/paperGraph';
import { getConfidenceColor } from '../../types/paperGraph';
import { pdfStorage } from '../../services/pdfStorage';
import { extractPDFText } from '../../services/pdf';

// =============================================================================
// Types
// =============================================================================

interface ExtractionPanelProps {
  paper: Paper;
  thesis?: Thesis;
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
  className?: string;
}

// =============================================================================
// Finding Type Icons
// =============================================================================

const FINDING_TYPE_ICONS: Record<FindingType, React.ReactNode> = {
  'central-finding': <Sparkles className="w-4 h-4 text-amber-500" />,
  'supporting-finding': <CheckCircle2 className="w-4 h-4 text-green-500" />,
  'methodological': <Beaker className="w-4 h-4 text-blue-500" />,
  'limitation': <AlertTriangle className="w-4 h-4 text-orange-500" />,
  'implication': <Lightbulb className="w-4 h-4 text-purple-500" />,
  'open-question': <HelpCircle className="w-4 h-4 text-cyan-500" />,
  'background': <BookOpen className="w-4 h-4 text-stone-500" />,
};

const FINDING_TYPE_LABELS: Record<FindingType, string> = {
  'central-finding': 'Central Finding',
  'supporting-finding': 'Supporting',
  'methodological': 'Method',
  'limitation': 'Limitation',
  'implication': 'Implication',
  'open-question': 'Open Question',
  'background': 'Background',
};

// =============================================================================
// FindingCard Component
// =============================================================================

interface FindingCardProps {
  finding: ExtractedFinding;
  onVerify: (verified: boolean) => void;
  onExpand: () => void;
  isExpanded: boolean;
}

const FindingCard = memo(function FindingCard({
  finding,
  onVerify,
  onExpand,
  isExpanded,
}: FindingCardProps) {
  return (
    <div
      className={`border rounded-lg transition-all ${
        finding.userVerified
          ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20'
          : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800'
      }`}
    >
      {/* Header */}
      <div
        className="flex items-start gap-2 p-3 cursor-pointer"
        onClick={onExpand}
      >
        <div className="flex-shrink-0 mt-0.5">
          {FINDING_TYPE_ICONS[finding.findingType]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-500 dark:text-slate-400">
              {FINDING_TYPE_LABELS[finding.findingType]}
            </span>
            {finding.userVerified && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Check className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium text-stone-800 dark:text-white mt-0.5 line-clamp-2">
            {finding.title}
          </h4>
        </div>
        <button className="flex-shrink-0 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-stone-100 dark:border-slate-700 pt-3">
          {/* Description */}
          <p className="text-sm text-stone-600 dark:text-slate-300">
            {finding.description}
          </p>

          {/* Quotes */}
          {finding.directQuotes.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-stone-500 dark:text-slate-400">
                Evidence:
              </span>
              {finding.directQuotes.map((quote) => (
                <blockquote
                  key={quote.id}
                  className="pl-3 border-l-2 border-stone-300 dark:border-slate-600 text-sm italic text-stone-600 dark:text-slate-400"
                >
                  "{quote.text}"
                  {quote.pageLabel && (
                    <span className="text-xs not-italic ml-2 text-stone-400">
                      ({quote.pageLabel})
                    </span>
                  )}
                </blockquote>
              ))}
            </div>
          )}

          {/* Confidence */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 dark:text-slate-400">
                AI Confidence:
              </span>
              <span
                className={`text-xs font-medium ${getConfidenceColor(
                  finding.confidence
                )}`}
              >
                {Math.round(finding.confidence * 100)}%
              </span>
            </div>

            {/* Verify button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVerify(!finding.userVerified);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                finding.userVerified
                  ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {finding.userVerified ? 'Verified' : 'Mark Verified'}
            </button>
          </div>

          {/* Thesis relevance (if available) */}
          {finding.thesisRelevance && (
            <div className="p-2 bg-stone-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-stone-500 dark:text-slate-400">
                  Thesis Relevance:
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-xs ${
                        star <= finding.thesisRelevance!.score
                          ? 'text-amber-500'
                          : 'text-stone-300 dark:text-slate-600'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-stone-600 dark:text-slate-400">
                {finding.thesisRelevance.reasoning}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// =============================================================================
// Progress Indicator
// =============================================================================

interface ProgressIndicatorProps {
  progress: ExtractionProgress;
}

const ProgressIndicator = memo(function ProgressIndicator({
  progress,
}: ProgressIndicatorProps) {
  const stages = [
    { stage: 1, label: 'Classify' },
    { stage: 2, label: 'Extract' },
    { stage: 3, label: 'Integrate' },
  ];

  return (
    <div className="space-y-3">
      {/* Stage indicators */}
      <div className="flex items-center gap-2">
        {stages.map((s, i) => (
          <div key={s.stage} className="flex items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                progress.currentStage > s.stage
                  ? 'bg-green-500 text-white'
                  : progress.currentStage === s.stage
                  ? 'bg-stone-800 text-white animate-pulse'
                  : 'bg-stone-200 dark:bg-slate-700 text-stone-500'
              }`}
            >
              {progress.currentStage > s.stage ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                s.stage
              )}
            </div>
            {i < stages.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  progress.currentStage > s.stage
                    ? 'bg-green-500'
                    : 'bg-stone-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current stage description */}
      <p className="text-sm text-stone-600 dark:text-slate-400">
        {progress.stageDescription}
      </p>

      {/* Progress bar */}
      <div className="h-1.5 bg-stone-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-stone-800 dark:bg-stone-400 transition-all duration-300"
          style={{ width: `${progress.overallProgress}%` }}
        />
      </div>
    </div>
  );
});

// =============================================================================
// Main ExtractionPanel Component
// =============================================================================

export const ExtractionPanel = memo(function ExtractionPanel({
  paper,
  thesis: _thesis, // Reserved for future use with thesis-specific extraction
  isOpen,
  onToggle,
  onClose,
  className = '',
}: ExtractionPanelProps) {
  const {
    isExtracting,
    progress,
    error,
    extractPaper,
    cancelExtraction,
    getGraphForPaper,
    verifyFinding,
    clearError,
    isConfigured,
  } = usePaperExtraction();

  // Local state
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  // Refs for race condition prevention
  const currentPaperIdRef = useRef<string>(paper.id);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get existing graph for this paper
  const existingGraph = getGraphForPaper(paper.id);

  // Calculate verified count for status bar
  const verifiedCount = existingGraph?.findings.filter((f) => f.userVerified).length ?? 0;
  const totalFindings = existingGraph?.findings.length ?? 0;

  // Load PDF text with race condition prevention
  useEffect(() => {
    // Update current paper ID ref
    currentPaperIdRef.current = paper.id;

    // Reset state when paper changes
    setPdfText(null);
    setPdfLoadError(null);

    async function loadPdfText() {
      if (!isOpen) return;

      // Cancel any previous loading
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoadingPdf(true);
      setPdfLoadError(null);

      try {
        const pdf = await pdfStorage.getPDFByPaperId(paper.id);

        // Check if paper changed during loading (race condition prevention)
        if (currentPaperIdRef.current !== paper.id) {
          return;
        }

        if (!pdf) {
          setPdfLoadError('No PDF found for this paper. Please upload a PDF first.');
          return;
        }

        const extraction = await extractPDFText(pdf.data);

        // Check again after extraction
        if (currentPaperIdRef.current !== paper.id) {
          return;
        }

        if (extraction.success && extraction.fullText) {
          setPdfText(extraction.fullText);
        } else {
          setPdfLoadError(extraction.error || 'Failed to extract text from PDF.');
        }
      } catch (err) {
        // Check if it was intentionally aborted
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        // Check if paper changed
        if (currentPaperIdRef.current !== paper.id) {
          return;
        }
        console.error('Failed to load PDF text:', err);
        setPdfLoadError(
          err instanceof Error ? err.message : 'Failed to load PDF. Please try again.'
        );
      } finally {
        // Only update loading state if we're still on the same paper
        if (currentPaperIdRef.current === paper.id) {
          setLoadingPdf(false);
        }
      }
    }

    loadPdfText();

    // Cleanup on unmount or paper change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, paper.id]);

  // Retry PDF loading
  const retryPdfLoad = useCallback(() => {
    setPdfText(null);
    setPdfLoadError(null);
    // Trigger reload by updating a dependency - we use a state toggle here
    // The useEffect will re-run when pdfLoadError becomes null
  }, []);

  // Handle extraction
  const handleExtract = useCallback(async () => {
    if (!pdfText) {
      console.error('No PDF text available');
      return;
    }

    await extractPaper({
      id: paper.id,
      title: paper.title,
      authors: paper.authors.map((a) => a.name),
      year: paper.year,
      journal: paper.journal,
      abstract: paper.abstract,
      pdfText,
    });
  }, [paper, pdfText, extractPaper]);

  // Handle finding verification
  const handleVerifyFinding = useCallback(
    (findingId: string, verified: boolean) => {
      if (existingGraph) {
        verifyFinding(existingGraph.id, findingId, verified);
      }
    },
    [existingGraph, verifyFinding]
  );

  // Toggle finding expansion
  const toggleFinding = useCallback((findingId: string) => {
    setExpandedFindingId((prev) => (prev === findingId ? null : findingId));
  }, []);

  // Collapsed state - just show toggle button
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={`fixed right-0 top-1/3 -translate-y-1/2 z-40 flex items-center gap-2 px-3 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-l-lg shadow-lg transition-all ${className}`}
        title="Open Knowledge Extractor"
        aria-label="Open Knowledge Extractor panel"
        aria-expanded="false"
      >
        <Sparkles className="w-5 h-5" aria-hidden="true" />
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label="Knowledge Extractor"
      className={`fixed right-0 top-0 h-full w-full sm:w-80 md:w-96 bg-[#FDFBF7]/95 dark:bg-slate-900/95 backdrop-blur-sm border-l border-stone-200 dark:border-slate-700 shadow-xl z-40 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-stone-800 dark:text-white">
            Knowledge Extractor
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 rounded"
            title="Collapse"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 rounded"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status bar */}
      {existingGraph && (
        <div className="px-4 py-2 border-b border-stone-100 dark:border-slate-800 bg-stone-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600 dark:text-slate-400">
              {totalFindings} findings extracted
            </span>
            <span
              className={`font-medium ${
                existingGraph.reviewStatus === 'reviewed'
                  ? 'text-green-600 dark:text-green-400'
                  : existingGraph.reviewStatus === 'partial'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-stone-500 dark:text-slate-500'
              }`}
            >
              {existingGraph.reviewStatus === 'reviewed'
                ? 'All verified'
                : existingGraph.reviewStatus === 'partial'
                ? `${verifiedCount} of ${totalFindings} verified`
                : 'Unreviewed'}
            </span>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Extraction error display */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm mb-4" role="alert">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p>{error}</p>
              <button
                onClick={clearError}
                className="text-xs underline mt-1 opacity-70 hover:opacity-100"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* PDF load error display */}
        {pdfLoadError && !loadingPdf && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm mb-4" role="alert">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium mb-1">PDF Loading Failed</p>
              <p className="text-xs opacity-90">{pdfLoadError}</p>
              <button
                onClick={retryPdfLoad}
                className="flex items-center gap-1.5 text-xs underline mt-2 opacity-70 hover:opacity-100"
                aria-label="Retry loading PDF"
              >
                <RefreshCw className="w-3 h-3" aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Not configured warning */}
        {!isConfigured && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm mb-4" role="alert">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p>AI is not configured. Please sign in and check your settings.</p>
          </div>
        )}

        {/* Loading PDF text */}
        {loadingPdf && (
          <div className="flex flex-col items-center justify-center py-8 text-stone-500 dark:text-slate-400" role="status" aria-label="Loading PDF text">
            <Loader2 className="w-8 h-8 animate-spin mb-3" aria-hidden="true" />
            <p className="text-sm">Loading PDF text...</p>
          </div>
        )}

        {/* Extraction in progress */}
        {isExtracting && progress && (
          <div className="space-y-4">
            <ProgressIndicator progress={progress} />
            <button
              onClick={cancelExtraction}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" />
              Cancel Extraction
            </button>
          </div>
        )}

        {/* No extraction yet */}
        {!isExtracting && !existingGraph && pdfText && !pdfLoadError && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-amber-400 opacity-50" aria-hidden="true" />
            <h4 className="font-medium text-stone-800 dark:text-white mb-2">
              Ready to Extract Knowledge
            </h4>
            <p className="text-sm text-stone-500 dark:text-slate-400 mb-6">
              AI will analyze this paper to extract key findings, methodology,
              and connections to your thesis.
            </p>
            <button
              onClick={handleExtract}
              disabled={!isConfigured || loadingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              aria-label="Start knowledge extraction"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              Start Extraction
            </button>
          </div>
        )}

        {/* Existing graph - show findings */}
        {!isExtracting && existingGraph && (
          <div className="space-y-4">
            {/* Classification summary */}
            {existingGraph.classification && (
              <div className="p-3 bg-stone-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-stone-500" />
                  <span className="text-sm font-medium text-stone-700 dark:text-slate-300">
                    {existingGraph.classification.paperType
                      .replace('-', ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>
                {existingGraph.experimentalSystem && (
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    System: {existingGraph.experimentalSystem}
                  </p>
                )}
              </div>
            )}

            {/* Key contributions */}
            {existingGraph.keyContributions.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-stone-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Key Contributions
                </h4>
                <ul className="space-y-1">
                  {existingGraph.keyContributions.map((contribution, i) => (
                    <li
                      key={i}
                      className="text-sm text-stone-600 dark:text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-amber-500 mt-0.5">•</span>
                      {contribution}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Thesis relevance */}
            {existingGraph.thesisRelevance && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Thesis Relevance
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${
                          star <= existingGraph.thesisRelevance!.overallScore
                            ? 'text-amber-500'
                            : 'text-amber-200 dark:text-amber-800'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300/80">
                  {existingGraph.thesisRelevance.thesisFramedTakeaway}
                </p>
              </div>
            )}

            {/* Findings list */}
            <div>
              <h4 className="text-xs font-medium text-stone-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Extracted Findings ({existingGraph.findings.length})
              </h4>
              <div className="space-y-2">
                {existingGraph.findings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    onVerify={(verified) =>
                      handleVerifyFinding(finding.id, verified)
                    }
                    onExpand={() => toggleFinding(finding.id)}
                    isExpanded={expandedFindingId === finding.id}
                  />
                ))}
              </div>
            </div>

            {/* Re-extract button */}
            <button
              onClick={handleExtract}
              disabled={!isConfigured || isExtracting || loadingPdf || !pdfText}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Re-extract knowledge from paper"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Re-extract
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/50">
        <p className="text-xs text-stone-500 dark:text-slate-400 text-center">
          Review and verify findings for accuracy
        </p>
      </div>
    </div>
  );
});
