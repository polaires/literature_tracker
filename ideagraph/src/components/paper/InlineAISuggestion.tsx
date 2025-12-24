// InlineAISuggestion - Inline AI assistance for form fields
// Shows AI suggestions directly next to form fields for a more integrated experience

import { useState } from 'react';
import {
  Sparkles,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Info,
} from 'lucide-react';
import type { ThesisRole } from '../../types';
import { THESIS_ROLE_COLORS } from '../../constants/colors';

interface InlineRoleSuggestionProps {
  suggestedRole: ThesisRole | null;
  confidence: number;
  reasoning: string | null;
  isLoading: boolean;
  disabled: boolean;
  coldStartMessage: string | null;
  onApply: (role: ThesisRole) => void;
  onAnalyze: () => void;
  currentRole: ThesisRole;
}

/**
 * Inline suggestion for thesis role
 */
export function InlineRoleSuggestion({
  suggestedRole,
  confidence,
  reasoning,
  isLoading,
  disabled,
  coldStartMessage,
  onApply,
  onAnalyze,
  currentRole,
}: InlineRoleSuggestionProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  // Cold start state
  if (coldStartMessage) {
    return (
      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
        <Info size={12} />
        <span>{coldStartMessage}</span>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 mt-1 text-xs text-stone-600 dark:text-stone-400">
        <Loader2 size={12} className="animate-spin" />
        <span>Analyzing role...</span>
      </div>
    );
  }

  // No suggestion yet
  if (!suggestedRole) {
    if (disabled) return null;
    return (
      <button
        onClick={onAnalyze}
        className="flex items-center gap-1 mt-1 text-xs text-stone-600 dark:text-stone-400 hover:underline"
      >
        <Sparkles size={12} />
        <span>Get AI suggestion</span>
      </button>
    );
  }

  // Has suggestion
  const isApplied = currentRole === suggestedRole;
  const roleColors = THESIS_ROLE_COLORS[suggestedRole];

  return (
    <div className="mt-2 p-2 bg-stone-50 dark:bg-stone-900/20 rounded-lg border border-stone-200 dark:border-stone-800">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Sparkles size={12} className="text-stone-600 dark:text-stone-400 flex-shrink-0" />
          <span className="text-xs text-gray-600 dark:text-gray-300">Suggested:</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors.bg} ${roleColors.text}`}>
            {roleColors.label}
          </span>
          <span className="text-xs text-gray-400">
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isApplied ? (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Check size={12} />
              Applied
            </span>
          ) : (
            <button
              onClick={() => onApply(suggestedRole)}
              className="px-2 py-0.5 text-xs bg-stone-600 text-white rounded hover:bg-stone-700 transition-colors"
            >
              Apply
            </button>
          )}
        </div>
      </div>

      {reasoning && (
        <div className="mt-1">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400 hover:underline"
          >
            {showReasoning ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {showReasoning ? 'Hide' : 'Show'} reasoning
          </button>
          {showReasoning && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
              {reasoning}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface InlineTakeawaySuggestionProps {
  suggestedTakeaway: string | null;
  alternatives: string[];
  confidence: number;
  isLoading: boolean;
  disabled: boolean;
  onApply: (takeaway: string) => void;
  onAnalyze: () => void;
  currentTakeaway: string;
}

/**
 * Inline suggestion for takeaway
 */
export function InlineTakeawaySuggestion({
  suggestedTakeaway,
  alternatives,
  confidence,
  isLoading,
  disabled,
  onApply,
  onAnalyze,
  currentTakeaway,
}: InlineTakeawaySuggestionProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 mt-1 text-xs text-stone-600 dark:text-stone-400">
        <Loader2 size={12} className="animate-spin" />
        <span>Generating takeaway suggestion...</span>
      </div>
    );
  }

  // No suggestion yet
  if (!suggestedTakeaway) {
    if (disabled) return null;
    return (
      <button
        onClick={onAnalyze}
        className="flex items-center gap-1 mt-1 text-xs text-stone-600 dark:text-stone-400 hover:underline"
      >
        <Sparkles size={12} />
        <span>Generate takeaway with AI</span>
      </button>
    );
  }

  // Has suggestion
  const isApplied = currentTakeaway.trim() === suggestedTakeaway.trim();

  return (
    <div className="mt-2 p-3 bg-stone-50 dark:bg-stone-900/20 rounded-lg border border-stone-200 dark:border-stone-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={12} className="text-stone-600 dark:text-stone-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              AI Suggestion
            </span>
            <span className="text-xs text-gray-400">
              ({Math.round(confidence * 100)}%)
            </span>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200">
            {suggestedTakeaway}
          </p>
        </div>
        <div className="flex-shrink-0">
          {isApplied ? (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Check size={12} />
            </span>
          ) : (
            <button
              onClick={() => onApply(suggestedTakeaway)}
              className="px-2 py-1 text-xs bg-stone-600 text-white rounded hover:bg-stone-700 transition-colors"
            >
              Use
            </button>
          )}
        </div>
      </div>

      {alternatives.length > 0 && (
        <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400 hover:underline"
          >
            {showAlternatives ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {alternatives.length} alternative{alternatives.length > 1 ? 's' : ''}
          </button>
          {showAlternatives && (
            <div className="mt-2 space-y-2">
              {alternatives.map((alt, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-2 p-2 bg-white dark:bg-gray-800 rounded text-xs"
                >
                  <span className="text-gray-600 dark:text-gray-300 flex-1">{alt}</span>
                  <button
                    onClick={() => onApply(alt)}
                    className="text-stone-600 dark:text-stone-400 hover:underline flex-shrink-0"
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface InlineRelevanceIndicatorProps {
  score: number | null;
  reasoning: string | null;
  isLoading: boolean;
}

/**
 * Inline relevance score indicator
 */
export function InlineRelevanceIndicator({
  score,
  reasoning,
  isLoading,
}: InlineRelevanceIndicatorProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Loader2 size={12} className="animate-spin" />
        <span>Calculating relevance...</span>
      </div>
    );
  }

  if (score === null) return null;

  const getScoreInfo = (s: number) => {
    if (s >= 90) return { label: 'Essential', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (s >= 70) return { label: 'Highly Relevant', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
    if (s >= 50) return { label: 'Relevant', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' };
    if (s >= 30) return { label: 'Marginal', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    return { label: 'Low Relevance', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  const info = getScoreInfo(score);

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={() => reasoning && setShowReasoning(!showReasoning)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${info.bg} ${info.color} ${reasoning ? 'cursor-pointer hover:opacity-80' : ''}`}
      >
        <span>{score}%</span>
        <span className="hidden sm:inline">-</span>
        <span className="hidden sm:inline">{info.label}</span>
        {reasoning && (showReasoning ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
      </button>
      {showReasoning && reasoning && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic max-w-xs">
          {reasoning}
        </p>
      )}
    </div>
  );
}

interface InlineConnectionPreviewProps {
  connections: Array<{
    paperId: string;
    paperTitle: string;
    connectionType: string;
    reasoning: string;
  }>;
  isLoading: boolean;
  onViewConnections: () => void;
}

/**
 * Preview of suggested connections
 */
export function InlineConnectionPreview({
  connections,
  isLoading,
  onViewConnections,
}: InlineConnectionPreviewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Loader2 size={12} className="animate-spin" />
        <span>Finding connections...</span>
      </div>
    );
  }

  if (connections.length === 0) return null;

  return (
    <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
            {connections.length} potential connection{connections.length > 1 ? 's' : ''} found
          </span>
        </div>
        <button
          onClick={onViewConnections}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View all
        </button>
      </div>
      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
        {connections.slice(0, 2).map((c, i) => (
          <span key={c.paperId}>
            {i > 0 && ', '}
            <span className="font-medium">{c.connectionType}</span>
            {' → '}
            <span className="truncate">{c.paperTitle.slice(0, 30)}...</span>
          </span>
        ))}
        {connections.length > 2 && ` +${connections.length - 2} more`}
      </div>
    </div>
  );
}

interface AIAnalysisStatusProps {
  isAnalyzing: boolean;
  hasAnalysis: boolean;
  error: Error | null;
  onAnalyze: () => void;
  onClear: () => void;
  disabled: boolean;
  tier: 'cold-start' | 'growing' | 'established' | 'large';
}

/**
 * Status indicator for AI analysis
 */
export function AIAnalysisStatus({
  isAnalyzing,
  hasAnalysis,
  error,
  onAnalyze,
  onClear,
  disabled,
  tier,
}: AIAnalysisStatusProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs">
        <AlertCircle size={14} className="text-red-500" />
        <span className="text-red-600 dark:text-red-400 flex-1">{error.message}</span>
        <button
          onClick={onAnalyze}
          className="text-red-600 dark:text-red-400 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-900/20 rounded-lg text-xs">
        <Loader2 size={14} className="text-stone-600 dark:text-stone-400 animate-spin" />
        <span className="text-stone-700 dark:text-stone-300">
          Analyzing paper for your thesis...
        </span>
      </div>
    );
  }

  if (hasAnalysis) {
    return (
      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <Check size={14} className="text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-300">
            AI analysis complete - suggestions shown below
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-500">
        <Info size={14} />
        <span>Configure AI in settings to enable suggestions</span>
      </div>
    );
  }

  // Show analyze button with tier-appropriate messaging
  const getMessage = () => {
    switch (tier) {
      case 'cold-start':
        return 'Get takeaway suggestion (role suggestions available with 3+ papers)';
      case 'large':
        return 'Analyze paper (uses selective context from your large collection)';
      default:
        return 'Analyze paper with AI';
    }
  };

  return (
    <button
      onClick={onAnalyze}
      className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-stone-50 to-amber-50 dark:from-stone-900/20 dark:to-amber-900/20 rounded-lg border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-colors"
    >
      <Sparkles size={16} className="text-stone-600 dark:text-stone-400" />
      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
        {getMessage()}
      </span>
    </button>
  );
}
