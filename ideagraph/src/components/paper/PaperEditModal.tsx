import { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Paper, ThesisRole, ReadingStatus, Argument, Evidence } from '../../types';
import { FormInput, FormTextarea, Button } from '../ui';
import { THESIS_ROLE_COLORS, READING_STATUS_COLORS, ARGUMENT_STRENGTH_COLORS } from '../../constants/colors';

interface PaperEditModalProps {
  paper: Paper;
  onClose: () => void;
  onSuccess?: () => void;
}

const EVIDENCE_TYPES = ['experimental', 'computational', 'theoretical', 'meta-analysis', 'other'] as const;

export function PaperEditModal({ paper, onClose, onSuccess }: PaperEditModalProps) {
  const { updatePaper } = useAppStore();

  // Form state
  const [title, setTitle] = useState(paper.title);
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
          <FormTextarea
            label="Takeaway *"
            hint="Key insight (min 10 characters)"
            value={takeaway}
            onChange={(e) => setTakeaway(e.target.value)}
            rows={2}
            showCount
            minLength={10}
            maxLength={500}
            error={takeaway.length > 0 && takeaway.length < 10 ? 'Takeaway must be at least 10 characters' : undefined}
          />

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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Arguments
                <span className="font-normal text-slate-500 ml-1">(Claims the paper makes)</span>
              </label>
              <button
                onClick={addArgument}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus size={16} />
                Add Argument
              </button>
            </div>
            <div className="space-y-3">
              {arguments_.map((arg, index) => (
                <div
                  key={arg.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                >
                  <GripVertical size={16} className="text-slate-400 mt-3 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={arg.claim}
                      onChange={(e) => updateArgument(arg.id, { claim: e.target.value })}
                      placeholder={`Argument ${index + 1}...`}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Strength:</span>
                        <div className="flex gap-1">
                          {(Object.keys(ARGUMENT_STRENGTH_COLORS) as (keyof typeof ARGUMENT_STRENGTH_COLORS)[]).map((strength) => {
                            const colors = ARGUMENT_STRENGTH_COLORS[strength];
                            return (
                              <button
                                key={strength}
                                onClick={() =>
                                  updateArgument(arg.id, {
                                    strength: arg.strength === strength ? null : strength,
                                  })
                                }
                                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                                  arg.strength === strength
                                    ? `${colors.bg} ${colors.text}`
                                    : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-500'
                                }`}
                              >
                                {colors.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Your view:</span>
                        <div className="flex gap-1">
                          {(['agree', 'disagree', 'uncertain'] as const).map((assessment) => (
                            <button
                              key={assessment}
                              onClick={() =>
                                updateArgument(arg.id, {
                                  yourAssessment: arg.yourAssessment === assessment ? null : assessment,
                                })
                              }
                              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                                arg.yourAssessment === assessment
                                  ? assessment === 'agree'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    : assessment === 'disagree'
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-500'
                              }`}
                            >
                              {assessment}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeArgument(arg.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {arguments_.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic py-3">
                  No arguments added yet. Click "Add Argument" to capture claims this paper makes.
                </p>
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
