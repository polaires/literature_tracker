// PaperIdeaGraphPanel Component
// Dedicated side panel for viewing a paper's knowledge graph (findings + connections)

import { useState, useCallback, memo } from 'react';
import {
  X,
  List,
  Network,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Check,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { FindingsGraphView, FINDING_TYPE_COLORS } from '../pdf/FindingsGraphView';
import type { ExtractedFinding } from '../../types/paperGraph';

interface PaperIdeaGraphPanelProps {
  paperId: string;
  onClose: () => void;
  onOpenPaper?: (paperId: string) => void;
  className?: string;
}

type ViewMode = 'graph' | 'list';

const FINDING_TYPE_LABELS: Record<string, string> = {
  'central-finding': 'Central Finding',
  'supporting-finding': 'Supporting',
  'methodological': 'Methodology',
  'limitation': 'Limitation',
  'implication': 'Implication',
  'open-question': 'Open Question',
  'background': 'Background',
};

export const PaperIdeaGraphPanel = memo(function PaperIdeaGraphPanel({
  paperId,
  onClose,
  onOpenPaper,
  className = '',
}: PaperIdeaGraphPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());

  // Get paper and graph data from store
  const paper = useAppStore((state) => state.papers.find((p) => p.id === paperId));
  const getPaperGraphForPaper = useAppStore((state) => state.getPaperGraphForPaper);
  const verifyFinding = useAppStore((state) => state.verifyFinding);

  const graph = getPaperGraphForPaper(paperId);

  // Toggle finding expansion
  const toggleFinding = useCallback((findingId: string) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      if (next.has(findingId)) {
        next.delete(findingId);
      } else {
        next.add(findingId);
      }
      return next;
    });
  }, []);

  // Handle verify finding
  const handleVerifyFinding = useCallback(
    (findingId: string, verified: boolean) => {
      if (graph) {
        verifyFinding(graph.id, findingId, verified);
      }
    },
    [graph, verifyFinding]
  );

  if (!paper) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <p className="text-stone-500 dark:text-slate-400">Paper not found</p>
      </div>
    );
  }

  if (!graph || graph.findings.length === 0) {
    return (
      <div
        className={`bg-[#FDFBF7] dark:bg-slate-900 border-l border-stone-200 dark:border-slate-700 flex flex-col ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-slate-700">
          <h3 className="font-semibold text-stone-800 dark:text-white truncate pr-2">
            {paper.title.length > 40 ? paper.title.slice(0, 40) + '...' : paper.title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* No findings message */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-stone-400 dark:text-slate-500">
          <Sparkles className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm text-center mb-2">No knowledge graph extracted yet</p>
          <p className="text-xs text-center">
            Open this paper and use AI extraction to generate findings
          </p>
          {onOpenPaper && (
            <button
              onClick={() => onOpenPaper(paperId)}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Paper
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-[#FDFBF7] dark:bg-slate-900 border-l border-stone-200 dark:border-slate-700 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-slate-700">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-semibold text-stone-800 dark:text-white truncate">
            {paper.title.length > 40 ? paper.title.slice(0, 40) + '...' : paper.title}
          </h3>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
            {graph.findings.length} findings • {graph.intraPaperConnections?.length || 0} connections
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 rounded flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-stone-100 dark:border-slate-800">
        <span className="text-xs font-medium text-stone-500 dark:text-slate-400 uppercase tracking-wide">
          View
        </span>
        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setViewMode('graph')}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
              viewMode === 'graph'
                ? 'bg-white dark:bg-slate-700 text-stone-800 dark:text-white shadow-sm'
                : 'text-stone-500 dark:text-slate-400 hover:text-stone-700'
            }`}
          >
            <Network className="w-3 h-3" />
            Graph
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-stone-800 dark:text-white shadow-sm'
                : 'text-stone-500 dark:text-slate-400 hover:text-stone-700'
            }`}
          >
            <List className="w-3 h-3" />
            List
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'graph' && (
          <FindingsGraphView
            findings={graph.findings}
            connections={graph.intraPaperConnections || []}
            onFindingClick={(findingId) => {
              setExpandedFindings((prev) => new Set(prev).add(findingId));
              setViewMode('list');
            }}
            onFindingVerify={handleVerifyFinding}
            compact={false}
            showTooltip={true}
            className="h-[350px]"
          />
        )}

        {viewMode === 'list' && (
          <div className="space-y-2">
            {graph.findings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                isExpanded={expandedFindings.has(finding.id)}
                onToggle={() => toggleFinding(finding.id)}
                onVerify={(verified) => handleVerifyFinding(finding.id, verified)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary section */}
      {(graph.keyContributions.length > 0 || graph.limitations.length > 0) && (
        <div className="border-t border-stone-200 dark:border-slate-700 p-4 space-y-3 bg-stone-50/50 dark:bg-slate-800/50">
          {graph.keyContributions.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-stone-600 dark:text-slate-300 mb-1">
                Key Contributions
              </h4>
              <ul className="text-xs text-stone-500 dark:text-slate-400 space-y-0.5">
                {graph.keyContributions.slice(0, 3).map((contrib, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">•</span>
                    {contrib}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {graph.limitations.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-stone-600 dark:text-slate-300 mb-1">
                Limitations
              </h4>
              <ul className="text-xs text-stone-500 dark:text-slate-400 space-y-0.5">
                {graph.limitations.slice(0, 3).map((limit, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-orange-500 mt-0.5">•</span>
                    {limit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Finding Card subcomponent
interface FindingCardProps {
  finding: ExtractedFinding;
  isExpanded: boolean;
  onToggle: () => void;
  onVerify: (verified: boolean) => void;
}

const FindingCard = memo(function FindingCard({
  finding,
  isExpanded,
  onToggle,
  onVerify,
}: FindingCardProps) {
  return (
    <div
      className={`border rounded-lg overflow-hidden ${
        finding.userVerified
          ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20'
          : 'border-stone-200 dark:border-slate-700'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-2 p-3 text-left hover:bg-stone-50 dark:hover:bg-slate-800/50"
      >
        <span
          className="px-1.5 py-0.5 text-xs rounded font-medium flex-shrink-0"
          style={{
            backgroundColor: `${FINDING_TYPE_COLORS[finding.findingType]}20`,
            color: FINDING_TYPE_COLORS[finding.findingType],
          }}
        >
          {FINDING_TYPE_LABELS[finding.findingType] || finding.findingType}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-700 dark:text-slate-300">
            {finding.title}
          </p>
          {!isExpanded && (
            <p className="text-xs text-stone-500 dark:text-slate-400 line-clamp-2 mt-0.5">
              {finding.description}
            </p>
          )}
        </div>
        {finding.userVerified && (
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
        )}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-stone-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-stone-100 dark:border-slate-700">
          <p className="text-sm text-stone-600 dark:text-slate-300 mt-3">{finding.description}</p>

          {finding.directQuotes && finding.directQuotes.length > 0 && (
            <div>
              <span className="text-xs font-medium text-stone-500 dark:text-slate-400">
                Evidence:
              </span>
              <blockquote className="mt-1 pl-3 border-l-2 border-stone-300 dark:border-slate-600 text-xs italic text-stone-600 dark:text-slate-400">
                "{finding.directQuotes[0].text}"
              </blockquote>
            </div>
          )}

          {finding.thesisRelevance?.reasoning && (
            <div>
              <span className="text-xs font-medium text-stone-500 dark:text-slate-400">
                Thesis Relevance:
              </span>
              <p className="text-xs text-stone-600 dark:text-slate-400 mt-1">
                {finding.thesisRelevance.reasoning}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVerify(!finding.userVerified);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                finding.userVerified
                  ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {finding.userVerified ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Mark Verified
                </>
              )}
            </button>

            <span className="text-xs text-stone-400 dark:text-slate-500">
              Confidence: {Math.round(finding.confidence * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default PaperIdeaGraphPanel;
