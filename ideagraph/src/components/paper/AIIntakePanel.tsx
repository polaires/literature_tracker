// AIIntakePanel - Displays unified AI paper analysis results
// Shows suggested thesis role, takeaway, arguments, and relevance score

import { useState, useMemo } from 'react';
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Lightbulb,
  Link2,
  Target,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import type { PaperIntakeAnalysis } from '../../hooks/useAI';
import type { ThesisRole } from '../../types';
import { THESIS_ROLE_COLORS } from '../../constants/colors';
import { getFeedbackLearner } from '../../services/ai/feedback/learner';

interface AIIntakePanelProps {
  analysis: PaperIntakeAnalysis | null;
  isLoading: boolean;
  error: Error | null;
  onAnalyze: () => void;
  onApplyRole: (role: ThesisRole) => void;
  onApplyTakeaway: (takeaway: string) => void;
  onApplyArguments?: (args: PaperIntakeAnalysis['arguments']) => void;
  currentRole: ThesisRole;
  currentTakeaway: string;
  canAnalyze: boolean;
  thesisId?: string; // For feedback learning indicators
}

export function AIIntakePanel({
  analysis,
  isLoading,
  error,
  onAnalyze,
  onApplyRole,
  onApplyTakeaway,
  onApplyArguments,
  currentRole,
  currentTakeaway,
  canAnalyze,
  thesisId,
}: AIIntakePanelProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showConnections, setShowConnections] = useState(false);

  // Get feedback learning info for this thesis
  const feedbackInfo = useMemo(() => {
    if (!thesisId) return null;
    try {
      const learner = getFeedbackLearner();
      const prefs = learner.learnThesisPreferences(thesisId);
      return {
        hasLearned: prefs.totalFeedback > 0,
        totalFeedback: prefs.totalFeedback,
        acceptanceRate: prefs.acceptanceRate,
        preferredRoles: prefs.preferredRoles.slice(0, 2),
      };
    } catch {
      return null;
    }
  }, [thesisId]);

  // Get relevance label info
  const getRelevanceInfo = (score: number) => {
    if (score >= 90) return { label: 'Essential', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (score >= 70) return { label: 'Highly Relevant', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
    if (score >= 50) return { label: 'Relevant', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' };
    if (score >= 30) return { label: 'Marginal', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    return { label: 'Low Relevance', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  // Show analyze button when no analysis yet
  if (!analysis && !isLoading && !error) {
    return (
      <div className="p-4 bg-gradient-to-r from-stone-50 to-amber-50 dark:from-stone-900/20 dark:to-amber-900/20 rounded-lg border border-stone-200 dark:border-stone-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
            <Sparkles className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-stone-900 dark:text-stone-100">
              AI-Powered Analysis
            </h4>
            <p className="text-sm text-stone-700 dark:text-stone-300 mt-1">
              Get AI suggestions for thesis role, takeaway, and relevance score based on your research context.
            </p>
            <button
              onClick={onAnalyze}
              disabled={!canAnalyze}
              className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                canAnalyze
                  ? 'bg-stone-600 hover:bg-stone-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Sparkles size={16} />
              Analyze Paper
            </button>
            {!canAnalyze && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                Configure AI settings to enable analysis
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 bg-stone-50 dark:bg-stone-900/20 rounded-lg border border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-stone-600 dark:text-stone-400 animate-spin" />
          <div>
            <p className="font-medium text-stone-900 dark:text-stone-100">
              Analyzing paper...
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Evaluating relevance to your thesis
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-red-900 dark:text-red-100">
              Analysis failed
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error.message}
            </p>
            <button
              onClick={onAnalyze}
              className="mt-2 text-sm text-red-700 dark:text-red-300 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Analysis results
  if (!analysis) return null;

  const relevanceInfo = getRelevanceInfo(analysis.relevanceScore);
  const roleColors = THESIS_ROLE_COLORS[analysis.thesisRole];
  const isRoleApplied = currentRole === analysis.thesisRole;
  const isTakeawayApplied = currentTakeaway === analysis.takeaway;

  return (
    <div className="space-y-4 p-4 bg-gradient-to-r from-stone-50 to-amber-50 dark:from-stone-900/20 dark:to-amber-900/20 rounded-lg border border-stone-200 dark:border-stone-800">
      {/* Header with relevance score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          <span className="font-medium text-stone-900 dark:text-stone-100">
            AI Analysis
          </span>
          {/* Feedback learning indicator */}
          {feedbackInfo?.hasLearned && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full" title={`Learning from ${feedbackInfo.totalFeedback} past decisions (${Math.round(feedbackInfo.acceptanceRate * 100)}% acceptance)`}>
              <GraduationCap size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs text-emerald-700 dark:text-emerald-300">
                Personalized
              </span>
            </div>
          )}
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${relevanceInfo.bg}`}>
          <Target size={14} className={relevanceInfo.color} />
          <span className={`text-sm font-medium ${relevanceInfo.color}`}>
            {analysis.relevanceScore}% - {relevanceInfo.label}
          </span>
        </div>
      </div>

      {/* Learning context indicator */}
      {feedbackInfo?.hasLearned && feedbackInfo.preferredRoles.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 rounded-lg px-3 py-2">
          <TrendingUp size={12} className="text-emerald-500" />
          <span>
            Based on your preferences: typically assigns{' '}
            {feedbackInfo.preferredRoles.map((r: ThesisRole) => THESIS_ROLE_COLORS[r]?.label || r).join(', ')} roles
          </span>
        </div>
      )}

      {/* Relevance reasoning */}
      {analysis.relevanceReasoning && (
        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
          "{analysis.relevanceReasoning}"
        </p>
      )}

      {/* Suggested Thesis Role */}
      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Suggested Role:
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors.bg} ${roleColors.text}`}>
              {roleColors.label}
            </span>
            <span className="text-xs text-gray-500">
              ({Math.round(analysis.roleConfidence * 100)}% confident)
            </span>
          </div>
          <button
            onClick={() => onApplyRole(analysis.thesisRole)}
            disabled={isRoleApplied}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              isRoleApplied
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-stone-100 dark:bg-stone-900/30 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800/50'
            }`}
          >
            {isRoleApplied ? <Check size={12} /> : null}
            {isRoleApplied ? 'Applied' : 'Apply'}
          </button>
        </div>
        {analysis.roleReasoning && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {analysis.roleReasoning}
          </p>
        )}
      </div>

      {/* Suggested Takeaway */}
      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-amber-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Suggested Takeaway
            </span>
            <span className="text-xs text-gray-500">
              ({Math.round(analysis.takeawayConfidence * 100)}% confident)
            </span>
          </div>
          <button
            onClick={() => onApplyTakeaway(analysis.takeaway)}
            disabled={isTakeawayApplied}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              isTakeawayApplied
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-stone-100 dark:bg-stone-900/30 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800/50'
            }`}
          >
            {isTakeawayApplied ? <Check size={12} /> : null}
            {isTakeawayApplied ? 'Applied' : 'Apply'}
          </button>
        </div>
        <p className="text-sm text-gray-800 dark:text-gray-200">
          {analysis.takeaway}
        </p>

        {/* Alternative takeaways */}
        {analysis.alternativeTakeaways.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400 hover:underline"
            >
              {showAlternatives ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {analysis.alternativeTakeaways.length} alternative{analysis.alternativeTakeaways.length > 1 ? 's' : ''}
            </button>
            {showAlternatives && (
              <div className="mt-2 space-y-2">
                {analysis.alternativeTakeaways.map((alt, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs"
                  >
                    <span className="text-gray-600 dark:text-gray-300">{alt}</span>
                    <button
                      onClick={() => onApplyTakeaway(alt)}
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

      {/* Extracted Arguments */}
      {analysis.arguments.length > 0 && onApplyArguments && (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Key Arguments ({analysis.arguments.length})
            </span>
            <button
              onClick={() => onApplyArguments(analysis.arguments)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-stone-100 dark:bg-stone-900/30 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800/50 transition-colors"
            >
              Apply All
            </button>
          </div>
          <ul className="space-y-2">
            {analysis.arguments.map((arg, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  arg.strength === 'strong' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  arg.strength === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {arg.strength}
                </span>
                <span className="text-gray-600 dark:text-gray-300 flex-1">
                  {arg.claim}
                </span>
                <span className="text-gray-400 text-[10px]">
                  {arg.evidenceType}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Potential Connections */}
      {analysis.potentialConnections.length > 0 && (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setShowConnections(!showConnections)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <Link2 size={14} className="text-stone-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Potential Connections ({analysis.potentialConnections.length})
              </span>
            </div>
            {showConnections ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showConnections && (
            <ul className="mt-2 space-y-2">
              {analysis.potentialConnections.map((conn, i) => (
                <li key={i} className="text-xs p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800/30 text-stone-700 dark:text-stone-400 text-[10px]">
                      {conn.connectionType}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 truncate">
                      {conn.paperId}
                    </span>
                  </div>
                  {conn.reasoning && (
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {conn.reasoning}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Re-analyze button */}
      <div className="flex justify-end">
        <button
          onClick={onAnalyze}
          className="text-xs text-stone-600 dark:text-stone-400 hover:underline"
        >
          Re-analyze
        </button>
      </div>
    </div>
  );
}

export default AIIntakePanel;
