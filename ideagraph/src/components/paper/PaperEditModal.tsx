import { useState } from 'react';
import { X, Plus, Trash2, GripVertical, Sparkles, Loader2, CircleDot, Circle, CircleDashed, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAI } from '../../hooks/useAI';
import type { Paper, ThesisRole, ReadingStatus, Argument, Evidence } from '../../types';
import { FormInput, FormTextarea, Button } from '../ui';
import { THESIS_ROLE_COLORS, READING_STATUS_COLORS, ARGUMENT_STRENGTH_COLORS, ARGUMENT_ASSESSMENT_COLORS } from '../../constants/colors';

// Icon mapping for argument strength
const STRENGTH_ICONS = {
  strong: CircleDot,
  moderate: Circle,
  weak: CircleDashed,
} as const;

// Icon mapping for argument assessment
const ASSESSMENT_ICONS = {
  agree: ThumbsUp,
  disagree: ThumbsDown,
  uncertain: HelpCircle,
} as const;

interface PaperEditModalProps {
  paper: Paper;
  onClose: () => void;
  onSuccess?: () => void;
}

const EVIDENCE_TYPES = ['experimental', 'computational', 'theoretical', 'meta-analysis', 'other'] as const;

export function PaperEditModal({ paper, onClose, onSuccess }: PaperEditModalProps) {
  const { updatePaper } = useAppStore();
  const { suggestTakeaway, isConfigured: isAIConfigured, settings: aiSettings } = useAI();

  // Form state
  const [title, setTitle] = useState(paper.title);
  const [isSuggestingTakeaway, setIsSuggestingTakeaway] = useState(false);
  const [takeaway, setTakeaway] = useState(paper.takeaway);
  const [thesisRole, setThesisRole] = useState<ThesisRole>(paper.thesisRole);
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>(paper.readingStatus);
  const [assessment, setAssessment] = useState(paper.assessment || '');
  const [arguments_, setArguments] = useState<Argument[]>(paper.arguments);
  const [evidence, setEvidence] = useState<Evidence[]>(paper.evidence);
  const [tags, setTags] = useState(paper.tags.join(', '));

  // Argument management
  const addArgument = () => {
    setArguments([
      ...arguments_,
      {
        id: crypto.randomUUID(),
        claim: '',
        strength: null,
        yourAssessment: null,
      },
    ]);
  };

  const updateArgument = (id: string, updates: Partial<Argument>) => {
    setArguments(arguments_.map((arg) => (arg.id === id ? { ...arg, ...updates } : arg)));
  };

  const removeArgument = (id: string) => {
    setArguments(arguments_.filter((arg) => arg.id !== id));
  };

  // Evidence management
  const addEvidence = () => {
    setEvidence([
      ...evidence,
      {
        id: crypto.randomUUID(),
        description: '',
        type: 'other',
        linkedArgumentId: null,
      },
    ]);
  };

  const updateEvidence = (id: string, updates: Partial<Evidence>) => {
    setEvidence(evidence.map((ev) => (ev.id === id ? { ...ev, ...updates } : ev)));
  };

  const removeEvidence = (id: string) => {
    setEvidence(evidence.filter((ev) => ev.id !== id));
  };

  const handleSave = () => {
    if (!title.trim() || takeaway.trim().length < 10) return;

    const validArguments = arguments_.filter((arg) => arg.claim.trim());
    const validEvidence = evidence.filter((ev) => ev.description.trim());

    updatePaper(paper.id, {
      title: title.trim(),
      takeaway: takeaway.trim(),
      thesisRole,
      readingStatus,
      assessment: assessment.trim() || null,
      arguments: validArguments,
      evidence: validEvidence,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      readAt: readingStatus === 'read' && !paper.readAt ? new Date().toISOString() : paper.readAt,
    });

    onSuccess?.();
    onClose();
  };

  const isValid = title.trim() && takeaway.trim().length >= 10;

  // AI takeaway suggestion
  const canSuggestTakeaway = isAIConfigured && aiSettings.enableTakeawaySuggestions;

  const handleSuggestTakeaway = async () => {
    if (!canSuggestTakeaway || isSuggestingTakeaway) return;

    setIsSuggestingTakeaway(true);
    try {
      const suggestion = await suggestTakeaway({
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors,
        year: paper.year,
      });
      if (suggestion?.suggestion) {
        setTakeaway(suggestion.suggestion);
      }
    } catch (err) {
      console.error('[PaperEditModal] Failed to suggest takeaway:', err);
    } finally {
      setIsSuggestingTakeaway(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Edit Paper</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Takeaway */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Takeaway *
                <span className="font-normal text-slate-500 ml-1">(Key insight, min 10 chars)</span>
              </label>
              {canSuggestTakeaway && (
                <button
                  type="button"
                  onClick={handleSuggestTakeaway}
                  disabled={isSuggestingTakeaway}
                  className={`flex items-center gap-1 px-2 py-1 text-sm rounded-lg transition-all ${
                    isSuggestingTakeaway
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 cursor-wait'
                      : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                  }`}
                  title="Suggest takeaway with AI"
                >
                  {isSuggestingTakeaway ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>{isSuggestingTakeaway ? 'Suggesting...' : 'AI Suggest'}</span>
                </button>
              )}
            </div>
            <FormTextarea
              value={takeaway}
              onChange={(e) => setTakeaway(e.target.value)}
              rows={2}
              showCount
              minLength={10}
              maxLength={500}
              error={takeaway.length > 0 && takeaway.length < 10 ? 'Takeaway must be at least 10 characters' : undefined}
            />
          </div>

          {/* Thesis Role & Reading Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Thesis Role */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Thesis Role
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(THESIS_ROLE_COLORS) as ThesisRole[]).map((role) => {
                  const colors = THESIS_ROLE_COLORS[role];
                  return (
                    <button
                      key={role}
                      onClick={() => setThesisRole(role)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        thesisRole === role
                          ? `${colors.bg} ${colors.text} ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800`
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {colors.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reading Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Reading Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(READING_STATUS_COLORS) as ReadingStatus[]).map((status) => {
                  const colors = READING_STATUS_COLORS[status];
                  return (
                    <button
                      key={status}
                      onClick={() => setReadingStatus(status)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        readingStatus === status
                          ? `${colors.bg} ${colors.text} ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800`
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {colors.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Arguments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Arguments
                <span className="font-normal text-slate-500 ml-1">(Claims the paper makes)</span>
              </label>
              <button
                onClick={addArgument}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 px-2 py-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <Plus size={16} />
                Add Argument
              </button>
            </div>
            <div className="space-y-4">
              {arguments_.map((arg, index) => (
                <div
                  key={arg.id}
                  className="group relative p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <GripVertical size={16} className="text-slate-400 mt-3 flex-shrink-0 cursor-grab" />
                    <div className="flex-1 space-y-4">
                      {/* Claim input */}
                      <input
                        type="text"
                        value={arg.claim}
                        onChange={(e) => updateArgument(arg.id, { claim: e.target.value })}
                        placeholder={`Argument ${index + 1}: What claim does the paper make?`}
                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />

                      {/* Strength section */}
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                          Argument Strength
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(ARGUMENT_STRENGTH_COLORS) as (keyof typeof ARGUMENT_STRENGTH_COLORS)[]).map((strength) => {
                            const colors = ARGUMENT_STRENGTH_COLORS[strength];
                            const IconComponent = STRENGTH_ICONS[strength];
                            const isSelected = arg.strength === strength;
                            return (
                              <button
                                key={strength}
                                onClick={() =>
                                  updateArgument(arg.id, {
                                    strength: isSelected ? null : strength,
                                  })
                                }
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                                  isSelected
                                    ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-current dark:ring-offset-slate-700`
                                    : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-500'
                                }`}
                              >
                                <IconComponent size={14} />
                                {colors.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Assessment section */}
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                          Your Assessment
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(ARGUMENT_ASSESSMENT_COLORS) as (keyof typeof ARGUMENT_ASSESSMENT_COLORS)[]).map((assessment) => {
                            const colors = ARGUMENT_ASSESSMENT_COLORS[assessment];
                            const IconComponent = ASSESSMENT_ICONS[assessment];
                            const isSelected = arg.yourAssessment === assessment;
                            return (
                              <button
                                key={assessment}
                                onClick={() =>
                                  updateArgument(arg.id, {
                                    yourAssessment: isSelected ? null : assessment,
                                  })
                                }
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                                  isSelected
                                    ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-current dark:ring-offset-slate-700`
                                    : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-500'
                                }`}
                              >
                                <IconComponent size={14} />
                                {colors.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeArgument(arg.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove argument"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {arguments_.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No arguments added yet.
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Click "Add Argument" to capture claims this paper makes.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Evidence */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Evidence
                <span className="font-normal text-slate-500 ml-1">(Supporting data or reasoning)</span>
              </label>
              <button
                onClick={addEvidence}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus size={16} />
                Add Evidence
              </button>
            </div>
            <div className="space-y-3">
              {evidence.map((ev, index) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                >
                  <GripVertical size={16} className="text-slate-400 mt-3 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={ev.description}
                      onChange={(e) => updateEvidence(ev.id, { description: e.target.value })}
                      placeholder={`Evidence ${index + 1}...`}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Type:</span>
                      <div className="flex flex-wrap gap-1">
                        {EVIDENCE_TYPES.map((type) => (
                          <button
                            key={type}
                            onClick={() => updateEvidence(ev.id, { type })}
                            className={`px-2 py-0.5 text-xs rounded transition-colors ${
                              ev.type === type
                                ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
                                : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-500'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeEvidence(ev.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {evidence.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic py-3">
                  No evidence added yet. Click "Add Evidence" to capture supporting data.
                </p>
              )}
            </div>
          </div>

          {/* Assessment */}
          <FormTextarea
            label="Your Assessment"
            hint="Critical evaluation of this paper"
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            placeholder="Your critical evaluation of this paper..."
            rows={3}
          />

          {/* Tags */}
          <FormInput
            label="Tags"
            hint="Comma-separated"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., machine-learning, protein-folding, review"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
