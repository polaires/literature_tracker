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
      {/* Backdrop - softer, less harsh */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal - softer shadows and borders */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-stone-200/60 dark:border-zinc-800">
        {/* Header - cleaner, more minimal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-zinc-100">Edit Paper</h2>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-stone-600 dark:text-zinc-400 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-stone-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-stone-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-500/30 focus:border-indigo-300 dark:focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Takeaway */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-stone-600 dark:text-zinc-400">
                Takeaway *
                <span className="font-normal text-stone-400 dark:text-zinc-500 ml-1">(Key insight, min 10 chars)</span>
              </label>
              {canSuggestTakeaway && (
                <button
                  type="button"
                  onClick={handleSuggestTakeaway}
                  disabled={isSuggestingTakeaway}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    isSuggestingTakeaway
                      ? 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 cursor-wait'
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                  }`}
                  title="Suggest takeaway with AI"
                >
                  {isSuggestingTakeaway ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Thesis Role */}
            <div>
              <label className="block text-sm font-medium text-stone-600 dark:text-zinc-400 mb-2">
                Thesis Role
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(THESIS_ROLE_COLORS) as ThesisRole[]).map((role) => {
                  const colors = THESIS_ROLE_COLORS[role];
                  return (
                    <button
                      key={role}
                      onClick={() => setThesisRole(role)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        thesisRole === role
                          ? `${colors.bg} ${colors.text} ring-1 ring-current/30`
                          : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
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
              <label className="block text-sm font-medium text-stone-600 dark:text-zinc-400 mb-2">
                Reading Status
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(READING_STATUS_COLORS) as ReadingStatus[]).map((status) => {
                  const colors = READING_STATUS_COLORS[status];
                  return (
                    <button
                      key={status}
                      onClick={() => setReadingStatus(status)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        readingStatus === status
                          ? `${colors.bg} ${colors.text} ring-1 ring-current/30`
                          : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {colors.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Arguments - Redesigned with softer, Linear/Notion inspired style */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-stone-600 dark:text-zinc-400">
                Arguments
                <span className="font-normal text-stone-400 dark:text-zinc-500 ml-1">(Claims the paper makes)</span>
              </label>
              <button
                onClick={addArgument}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 px-2.5 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
              >
                <Plus size={14} />
                Add Argument
              </button>
            </div>
            <div className="space-y-3">
              {arguments_.map((arg, index) => (
                <div
                  key={arg.id}
                  className="group relative bg-stone-50/80 dark:bg-zinc-800/50 rounded-xl border border-stone-200/80 dark:border-zinc-700/50 hover:border-stone-300 dark:hover:border-zinc-600 transition-all"
                >
                  {/* Argument Card Content */}
                  <div className="p-4">
                    <div className="flex items-start gap-2.5">
                      <GripVertical size={14} className="text-stone-300 dark:text-zinc-600 mt-2.5 flex-shrink-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 space-y-3">
                        {/* Claim input */}
                        <input
                          type="text"
                          value={arg.claim}
                          onChange={(e) => updateArgument(arg.id, { claim: e.target.value })}
                          placeholder={`Argument ${index + 1}: What claim does the paper make?`}
                          className="w-full px-3 py-2 border border-stone-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 text-sm placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 focus:border-indigo-200 dark:focus:border-indigo-500/40 transition-all"
                        />

                        {/* Strength & Assessment Row - More compact, pill-based design */}
                        <div className="flex flex-wrap items-center gap-4">
                          {/* Strength section */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-stone-400 dark:text-zinc-500 uppercase tracking-wider">
                              Strength
                            </span>
                            <div className="flex gap-1">
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
                                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium transition-all ${
                                      isSelected
                                        ? `${colors.bg} ${colors.text} border ${colors.border}`
                                        : 'bg-white dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-700 hover:border-stone-300 dark:hover:border-zinc-600'
                                    }`}
                                  >
                                    <IconComponent size={12} />
                                    {colors.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-4 w-px bg-stone-200 dark:bg-zinc-700 hidden sm:block" />

                          {/* Assessment section */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-stone-400 dark:text-zinc-500 uppercase tracking-wider">
                              Your View
                            </span>
                            <div className="flex gap-1">
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
                                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium transition-all ${
                                      isSelected
                                        ? `${colors.bg} ${colors.text} border ${colors.border}`
                                        : 'bg-white dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-700 hover:border-stone-300 dark:hover:border-zinc-600'
                                    }`}
                                  >
                                    <IconComponent size={12} />
                                    {colors.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => removeArgument(arg.id)}
                        className="p-1.5 text-stone-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                        title="Remove argument"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {arguments_.length === 0 && (
                <div className="text-center py-8 border border-dashed border-stone-200 dark:border-zinc-700 rounded-xl bg-stone-50/50 dark:bg-zinc-800/30">
                  <p className="text-sm text-stone-500 dark:text-zinc-400">
                    No arguments added yet
                  </p>
                  <p className="text-xs text-stone-400 dark:text-zinc-500 mt-1">
                    Click "Add Argument" to capture claims this paper makes
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Evidence - Softer styling */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-stone-600 dark:text-zinc-400">
                Evidence
                <span className="font-normal text-stone-400 dark:text-zinc-500 ml-1">(Supporting data or reasoning)</span>
              </label>
              <button
                onClick={addEvidence}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 px-2.5 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
              >
                <Plus size={14} />
                Add Evidence
              </button>
            </div>
            <div className="space-y-2.5">
              {evidence.map((ev, index) => (
                <div
                  key={ev.id}
                  className="group flex items-start gap-2.5 p-3 bg-stone-50/80 dark:bg-zinc-800/50 rounded-lg border border-stone-200/80 dark:border-zinc-700/50 hover:border-stone-300 dark:hover:border-zinc-600 transition-all"
                >
                  <GripVertical size={14} className="text-stone-300 dark:text-zinc-600 mt-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={ev.description}
                      onChange={(e) => updateEvidence(ev.id, { description: e.target.value })}
                      placeholder={`Evidence ${index + 1}...`}
                      className="w-full px-3 py-2 border border-stone-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-200 text-sm placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 focus:border-indigo-200 dark:focus:border-indigo-500/40 transition-all"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-stone-400 dark:text-zinc-500 uppercase tracking-wider">Type</span>
                      <div className="flex flex-wrap gap-1">
                        {EVIDENCE_TYPES.map((type) => (
                          <button
                            key={type}
                            onClick={() => updateEvidence(ev.id, { type })}
                            className={`px-2 py-0.5 text-xs rounded-full font-medium transition-all ${
                              ev.type === type
                                ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/50'
                                : 'bg-white dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border border-stone-200 dark:border-zinc-700 hover:border-stone-300 dark:hover:border-zinc-600'
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
                    className="p-1.5 text-stone-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {evidence.length === 0 && (
                <div className="text-center py-6 border border-dashed border-stone-200 dark:border-zinc-700 rounded-xl bg-stone-50/50 dark:bg-zinc-800/30">
                  <p className="text-sm text-stone-500 dark:text-zinc-400">
                    No evidence added yet
                  </p>
                  <p className="text-xs text-stone-400 dark:text-zinc-500 mt-1">
                    Click "Add Evidence" to capture supporting data
                  </p>
                </div>
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

        {/* Footer - Softer styling */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-900/50">
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
