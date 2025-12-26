import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Lightbulb,
  Search,
  Clock,
  BookOpen,
  Beaker,
  Layers,
  Globe,
  Shuffle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Brain,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { getPlanBasedGapAnalyzer, type GapAnalysisPlan } from '../../services/ai/gap/planBased';
import { DEFAULT_AI_SETTINGS, DEFAULT_TASK_MODELS, type AISettings } from '../../services/ai';
import type { ResearchGap, GapType, GapPriority } from '../../types';
import type { GapSuggestion } from '../../services/ai/types';

// Local storage key for AI settings (same as useAI hook)
const AI_SETTINGS_KEY = 'ideagraph_ai_settings';

function loadAISettings(): AISettings {
  try {
    const stored = localStorage.getItem(AI_SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_AI_SETTINGS,
        ...parsed,
        taskModels: {
          ...DEFAULT_TASK_MODELS,
          ...(parsed.taskModels || {}),
        },
      };
    }
  } catch (e) {
    console.warn('[GapAnalysis] Failed to load AI settings:', e);
  }
  return { ...DEFAULT_AI_SETTINGS };
}

interface GapAnalysisProps {
  thesisId: string;
  onClose: () => void;
}

const GAP_TYPE_CONFIG: Record<GapType, { icon: React.ReactNode; label: string; color: string }> = {
  knowledge: { icon: <BookOpen size={16} />, label: 'Knowledge Gap', color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' },
  methodological: { icon: <Beaker size={16} />, label: 'Methodological', color: 'text-stone-600 bg-stone-100 dark:text-stone-400 dark:bg-stone-900/30' },
  population: { icon: <Layers size={16} />, label: 'Population', color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' },
  theoretical: { icon: <Lightbulb size={16} />, label: 'Theoretical', color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30' },
  temporal: { icon: <Clock size={16} />, label: 'Temporal', color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30' },
  geographic: { icon: <Globe size={16} />, label: 'Geographic', color: 'text-teal-600 bg-teal-100 dark:text-teal-400 dark:bg-teal-900/30' },
  contradictory: { icon: <Shuffle size={16} />, label: 'Conflicting', color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30' },
};

const PRIORITY_CONFIG: Record<GapPriority, { label: string; color: string }> = {
  high: { label: 'High Priority', color: 'bg-red-500' },
  medium: { label: 'Medium Priority', color: 'bg-amber-500' },
  low: { label: 'Low Priority', color: 'bg-gray-400' },
};

export function GapAnalysis({ thesisId, onClose }: GapAnalysisProps) {
  const {
    getGapsForThesis,
    detectGaps,
    createGap,
    updateGap,
    deleteGap,
    getPapersForThesis,
  } = useAppStore();

  // State
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [detectedGaps, setDetectedGaps] = useState<ResearchGap[]>([]);
  const [showAddGap, setShowAddGap] = useState(false);
  const [editingGap, setEditingGap] = useState<ResearchGap | null>(null);
  const [expandedGaps, setExpandedGaps] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<GapType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<GapPriority | 'all'>('all');

  // Plan-based gap analysis state
  const [usePlanBased, setUsePlanBased] = useState(false);
  const [isPlanAnalyzing, setIsPlanAnalyzing] = useState(false);
  const [planProgress, setPlanProgress] = useState<string>('');
  const [currentPlan, setCurrentPlan] = useState<GapAnalysisPlan | null>(null);
  const [aiGapSuggestions, setAiGapSuggestions] = useState<GapSuggestion[]>([]);
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'knowledge' as GapType,
    priority: 'medium' as GapPriority,
    futureResearchNote: '',
    relatedPaperIds: [] as string[],
  });

  const papers = getPapersForThesis(thesisId).filter((p) => p.screeningDecision === 'include');
  const { theses, getConnectionsForThesis } = useAppStore();
  const thesis = theses.find(t => t.id === thesisId);
  const connections = getConnectionsForThesis(thesisId);

  // Load gaps on mount
  useEffect(() => {
    setGaps(getGapsForThesis(thesisId));
  }, [thesisId, getGapsForThesis]);

  // Detect gaps (basic rule-based)
  const handleDetectGaps = () => {
    const detected = detectGaps(thesisId);
    setDetectedGaps(detected);
  };

  // Plan-based AI gap analysis
  const handlePlanBasedAnalysis = async () => {
    if (!thesis || papers.length === 0) {
      console.warn('[GapAnalysis] Cannot run plan-based analysis: missing thesis or papers');
      return;
    }

    setIsPlanAnalyzing(true);
    setPlanProgress('Initializing...');
    setCurrentPlan(null);
    setAiGapSuggestions([]);

    try {
      const settings = loadAISettings();
      const analyzer = getPlanBasedGapAnalyzer(settings);

      const result = await analyzer.analyze({
        thesis,
        papers,
        connections,
        onProgress: (step, progress) => {
          setPlanProgress(`${step} (${Math.round(progress * 100)}%)`);
        },
      });

      setCurrentPlan(result.plan);
      setAiGapSuggestions(result.gaps);
    } catch (error) {
      console.error('[GapAnalysis] Plan-based analysis failed:', error);
    } finally {
      setIsPlanAnalyzing(false);
      setPlanProgress('');
    }
  };

  // Save detected gap
  const handleSaveDetectedGap = (gap: ResearchGap) => {
    createGap({
      thesisId: gap.thesisId,
      title: gap.title,
      description: gap.description,
      type: gap.type,
      priority: gap.priority,
      evidenceSource: gap.evidenceSource,
      relatedPaperIds: gap.relatedPaperIds,
      futureResearchNote: gap.futureResearchNote,
    });
    setDetectedGaps((prev) => prev.filter((g) => g.id !== gap.id));
    setGaps(getGapsForThesis(thesisId));
  };

  // Save AI-suggested gap
  const handleSaveAiGap = (suggestion: GapSuggestion) => {
    createGap({
      thesisId,
      title: suggestion.title,
      description: suggestion.description,
      type: suggestion.type,
      priority: suggestion.priority,
      evidenceSource: 'inferred',
      relatedPaperIds: suggestion.relatedPaperIds,
      futureResearchNote: suggestion.futureResearchQuestion || null,
    });
    setAiGapSuggestions((prev) => prev.filter((g) => g.id !== suggestion.id));
    setGaps(getGapsForThesis(thesisId));
  };

  // Dismiss AI-suggested gap
  const handleDismissAiGap = (suggestionId: string) => {
    setAiGapSuggestions((prev) => prev.filter((g) => g.id !== suggestionId));
  };

  // Dismiss detected gap
  const handleDismissDetectedGap = (gapId: string) => {
    setDetectedGaps((prev) => prev.filter((g) => g.id !== gapId));
  };

  // Add new gap
  const handleAddGap = () => {
    if (!formData.title.trim() || !formData.description.trim()) return;

    createGap({
      thesisId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      priority: formData.priority,
      evidenceSource: 'user',
      relatedPaperIds: formData.relatedPaperIds,
      futureResearchNote: formData.futureResearchNote.trim() || null,
    });

    setFormData({
      title: '',
      description: '',
      type: 'knowledge',
      priority: 'medium',
      futureResearchNote: '',
      relatedPaperIds: [],
    });
    setShowAddGap(false);
    setGaps(getGapsForThesis(thesisId));
  };

  // Update gap
  const handleUpdateGap = () => {
    if (!editingGap) return;

    updateGap(editingGap.id, {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      priority: formData.priority,
      futureResearchNote: formData.futureResearchNote || null,
      relatedPaperIds: formData.relatedPaperIds,
    });

    setEditingGap(null);
    setGaps(getGapsForThesis(thesisId));
  };

  // Delete gap
  const handleDeleteGap = (gapId: string) => {
    if (!confirm('Delete this research gap?')) return;
    deleteGap(gapId);
    setGaps(getGapsForThesis(thesisId));
  };

  // Start editing
  const startEditing = (gap: ResearchGap) => {
    setFormData({
      title: gap.title,
      description: gap.description,
      type: gap.type,
      priority: gap.priority,
      futureResearchNote: gap.futureResearchNote || '',
      relatedPaperIds: gap.relatedPaperIds,
    });
    setEditingGap(gap);
  };

  // Toggle expand
  const toggleExpand = (gapId: string) => {
    const newExpanded = new Set(expandedGaps);
    if (newExpanded.has(gapId)) {
      newExpanded.delete(gapId);
    } else {
      newExpanded.add(gapId);
    }
    setExpandedGaps(newExpanded);
  };

  // Filter gaps
  const filteredGaps = gaps.filter((gap) => {
    if (filterType !== 'all' && gap.type !== filterType) return false;
    if (filterPriority !== 'all' && gap.priority !== filterPriority) return false;
    return true;
  });

  // Stats
  const stats = {
    total: gaps.length,
    byPriority: {
      high: gaps.filter((g) => g.priority === 'high').length,
      medium: gaps.filter((g) => g.priority === 'medium').length,
      low: gaps.filter((g) => g.priority === 'low').length,
    },
    userIdentified: gaps.filter((g) => g.evidenceSource === 'user').length,
    systemDetected: gaps.filter((g) => g.evidenceSource === 'inferred').length,
  };

  return (
    <Modal onClose={onClose} className="max-w-4xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Research Gap Analysis
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Identify and track gaps in the literature
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Stats & Actions */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">{stats.total}</strong> gaps identified
            </span>
            {stats.byPriority.high > 0 && (
              <span className="text-red-600 dark:text-red-400">
                {stats.byPriority.high} high priority
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle between rule-based and AI-based */}
            <label className="flex items-center gap-2 mr-2">
              <input
                type="checkbox"
                checked={usePlanBased}
                onChange={(e) => setUsePlanBased(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-stone-600 focus:ring-stone-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Brain size={14} className="text-stone-500" />
                AI Analysis
              </span>
            </label>

            <Button
              variant="secondary"
              size="sm"
              onClick={usePlanBased ? handlePlanBasedAnalysis : handleDetectGaps}
              disabled={isPlanAnalyzing}
              icon={isPlanAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            >
              {isPlanAnalyzing ? 'Analyzing...' : usePlanBased ? 'AI Gap Analysis' : 'Auto-Detect'}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  type: 'knowledge',
                  priority: 'medium',
                  futureResearchNote: '',
                  relatedPaperIds: [],
                });
                setShowAddGap(true);
              }}
              icon={<Plus size={16} />}
            >
              Add Gap
            </Button>
          </div>
        </div>

        {/* AI Analysis Progress */}
        {isPlanAnalyzing && planProgress && (
          <div className="mt-2 flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <Loader2 size={14} className="animate-spin" />
            {planProgress}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as GapType | 'all')}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            {Object.entries(GAP_TYPE_CONFIG).map(([type, config]) => (
              <option key={type} value={type}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as GapPriority | 'all')}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Plan Details (collapsible) */}
        {currentPlan && currentPlan.observations.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowPlanDetails(!showPlanDetails)}
              className="w-full flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900/20 border border-stone-200 dark:border-stone-800 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-stone-600 dark:text-stone-400" />
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Analysis Plan ({currentPlan.observations.length} observations)
                </span>
              </div>
              {showPlanDetails ? (
                <ChevronDown size={16} className="text-stone-500" />
              ) : (
                <ChevronRight size={16} className="text-stone-500" />
              )}
            </button>

            {showPlanDetails && (
              <div className="mt-2 p-4 bg-stone-50/50 dark:bg-stone-900/10 border border-stone-100 dark:border-stone-800/50 rounded-lg space-y-3">
                {currentPlan.observations.map((obs, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="px-2 py-0.5 text-xs bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded capitalize">
                      {obs.category}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {obs.finding}
                      </p>
                      {obs.supportingPapers.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <FileText size={10} className="inline mr-1" />
                          Based on {obs.supportingPapers.length} paper(s)
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {Math.round(obs.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI-Suggested Gaps */}
        {aiGapSuggestions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
              <Brain size={16} />
              AI-Suggested Gaps (Review & Save)
              <span className="text-xs px-1.5 py-0.5 bg-stone-100 dark:bg-stone-900/30 text-stone-600 dark:text-stone-400 rounded-full">
                {aiGapSuggestions.length} verified
              </span>
            </h3>
            <div className="space-y-3">
              {aiGapSuggestions.map((suggestion) => {
                const typeConfig = GAP_TYPE_CONFIG[suggestion.type];
                const relatedPapersList = papers.filter(p => suggestion.relatedPaperIds.includes(p.id));
                return (
                  <div
                    key={suggestion.id}
                    className="p-4 bg-stone-50 dark:bg-stone-900/20 border border-stone-200 dark:border-stone-800 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className={`p-1.5 rounded ${typeConfig.color}`}>
                          {typeConfig.icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {suggestion.title}
                            </h4>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              suggestion.priority === 'high'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : suggestion.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {suggestion.priority}
                            </span>
                            <span className="text-xs text-gray-400">
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {suggestion.description}
                          </p>
                          {suggestion.futureResearchQuestion && (
                            <p className="text-xs text-green-700 dark:text-green-400 mt-2 italic">
                              Research question: {suggestion.futureResearchQuestion}
                            </p>
                          )}
                          {relatedPapersList.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              Related papers: {relatedPapersList.slice(0, 2).map(p => p.title.substring(0, 30) + '...').join(', ')}
                              {relatedPapersList.length > 2 && ` +${relatedPapersList.length - 2} more`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveAiGap(suggestion)}
                          icon={<CheckCircle2 size={14} />}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDismissAiGap(suggestion.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detected Gaps (unsaved) */}
        {detectedGaps.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
              <Sparkles size={16} />
              Auto-Detected Gaps (Review & Save)
            </h3>
            <div className="space-y-3">
              {detectedGaps.map((gap) => {
                const typeConfig = GAP_TYPE_CONFIG[gap.type];
                return (
                  <div
                    key={gap.id}
                    className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className={`p-1.5 rounded ${typeConfig.color}`}>
                          {typeConfig.icon}
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {gap.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {gap.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveDetectedGap(gap)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDismissDetectedGap(gap.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Gap List */}
        {filteredGaps.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No research gaps documented
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
              Document gaps in the literature to identify future research directions.
              Use auto-detect to find potential gaps based on your papers.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={handleDetectGaps} variant="secondary" icon={<Sparkles size={18} />}>
                Auto-Detect
              </Button>
              <Button
                onClick={() => {
                  setFormData({
                    title: '',
                    description: '',
                    type: 'knowledge',
                    priority: 'medium',
                    futureResearchNote: '',
                    relatedPaperIds: [],
                  });
                  setShowAddGap(true);
                }}
                icon={<Plus size={18} />}
              >
                Add Manually
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGaps.map((gap) => {
              const typeConfig = GAP_TYPE_CONFIG[gap.type];
              const priorityConfig = PRIORITY_CONFIG[gap.priority];
              const isExpanded = expandedGaps.has(gap.id);
              const relatedPapers = papers.filter((p) => gap.relatedPaperIds.includes(p.id));

              return (
                <div
                  key={gap.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Gap Header */}
                  <div
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => toggleExpand(gap.id)}
                  >
                    <button className="p-1 mt-0.5">
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400" />
                      )}
                    </button>

                    <span className={`p-1.5 rounded flex-shrink-0 ${typeConfig.color}`}>
                      {typeConfig.icon}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {gap.title}
                        </h4>
                        <span className={`w-2 h-2 rounded-full ${priorityConfig.color}`} />
                        {gap.evidenceSource === 'inferred' && (
                          <span className="text-xs px-1.5 py-0.5 bg-stone-100 dark:bg-stone-900/30 text-stone-600 dark:text-stone-400 rounded">
                            Auto-detected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {gap.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => startEditing(gap)}
                        className="p-1.5 text-gray-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800/20 rounded"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteGap(gap.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700/50 ml-10">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {gap.description}
                      </p>

                      {gap.futureResearchNote && (
                        <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                            Future Research Direction
                          </p>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            {gap.futureResearchNote}
                          </p>
                        </div>
                      )}

                      {relatedPapers.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Related Papers ({relatedPapers.length})
                          </p>
                          <div className="space-y-1">
                            {relatedPapers.slice(0, 3).map((paper) => (
                              <div
                                key={paper.id}
                                className="text-sm text-gray-600 dark:text-gray-400 truncate"
                              >
                                • {paper.title}
                              </div>
                            ))}
                            {relatedPapers.length > 3 && (
                              <p className="text-xs text-gray-400">
                                +{relatedPapers.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Gap Modal */}
      {(showAddGap || editingGap) && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowAddGap(false);
              setEditingGap(null);
            }}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingGap ? 'Edit Research Gap' : 'Add Research Gap'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief title for the gap"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed explanation of the gap and why it matters..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as GapType })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500"
                  >
                    {Object.entries(GAP_TYPE_CONFIG).map(([type, config]) => (
                      <option key={type} value={type}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as GapPriority })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Future Research Direction
                </label>
                <textarea
                  value={formData.futureResearchNote}
                  onChange={(e) =>
                    setFormData({ ...formData, futureResearchNote: e.target.value })
                  }
                  placeholder="How could this gap be addressed in future research?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Related Papers
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                  {papers.map((paper) => (
                    <label
                      key={paper.id}
                      className="flex items-start gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.relatedPaperIds.includes(paper.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              relatedPaperIds: [...formData.relatedPaperIds, paper.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              relatedPaperIds: formData.relatedPaperIds.filter(
                                (id) => id !== paper.id
                              ),
                            });
                          }
                        }}
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
                        {paper.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddGap(false);
                  setEditingGap(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingGap ? handleUpdateGap : handleAddGap}
                disabled={!formData.title.trim() || !formData.description.trim()}
              >
                {editingGap ? 'Save Changes' : 'Add Gap'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
