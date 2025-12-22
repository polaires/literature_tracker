import { useState } from 'react';
import { X, Search, Loader2, Check, FileText, Globe, Plus, Trash2 } from 'lucide-react';
import { fetchPaperMetadata, type PaperMetadata } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import type { ThesisRole, ReadingStatus, Author } from '../../types';
import { FormTextarea, ErrorMessage, Button } from '../ui';
import { THESIS_ROLE_COLORS } from '../../constants/colors';

interface AddPaperModalProps {
  thesisId: string;
  onClose: () => void;
}

type InputMode = 'doi' | 'manual';
type Step = 'input' | 'fetching' | 'review' | 'error';

export function AddPaperModal({ thesisId, onClose }: AddPaperModalProps) {
  const { addPaper } = useAppStore();

  const [inputMode, setInputMode] = useState<InputMode>('doi');
  const [step, setStep] = useState<Step>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [doiInput, setDoiInput] = useState('');
  const [metadata, setMetadata] = useState<PaperMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual entry fields
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthors, setManualAuthors] = useState<Author[]>([{ name: '' }]);
  const [manualYear, setManualYear] = useState('');
  const [manualJournal, setManualJournal] = useState('');
  const [manualDoi, setManualDoi] = useState('');
  const [manualAbstract, setManualAbstract] = useState('');

  // Form fields
  const [takeaway, setTakeaway] = useState('');
  const [thesisRole, setThesisRole] = useState<ThesisRole>('background');
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>('to-read');

  const handleFetch = async () => {
    if (!doiInput.trim() || isLoading) return;

    setIsLoading(true);
    setStep('fetching');
    setError(null);

    try {
      const data = await fetchPaperMetadata(doiInput);
      setMetadata(data);
      // Pre-fill takeaway with TLDR if available
      if (data.tldr) {
        setTakeaway(data.tldr);
      }
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch paper');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!metadata || !takeaway.trim()) return;

    addPaper({
      thesisId,
      doi: metadata.doi,
      title: metadata.title,
      authors: metadata.authors,
      year: metadata.year,
      journal: metadata.journal,
      volume: metadata.volume,
      issue: metadata.issue,
      pages: metadata.pages,
      abstract: metadata.abstract,
      url: metadata.url,
      pdfUrl: metadata.pdfUrl,
      citationCount: metadata.citationCount,
      takeaway: takeaway.trim(),
      arguments: [],
      evidence: [],
      assessment: null,
      thesisRole,
      readingStatus,
      tags: [],
      readAt: null,
      source: 'doi',
      rawBibtex: null,
      screeningDecision: 'pending',
      exclusionReason: null,
      exclusionNote: null,
      screenedAt: null,
      semanticScholarId: null,
    });

    onClose();
  };

  const handleManualSubmit = () => {
    if (!manualTitle.trim()) return;

    const validAuthors = manualAuthors.filter((a) => a.name.trim());
    setMetadata({
      doi: manualDoi.trim() || null,
      title: manualTitle.trim(),
      authors: validAuthors.length > 0 ? validAuthors : [{ name: 'Unknown' }],
      year: manualYear ? parseInt(manualYear, 10) : null,
      journal: manualJournal.trim() || null,
      volume: null,
      issue: null,
      pages: null,
      abstract: manualAbstract.trim() || null,
      url: null,
      pdfUrl: null,
      citationCount: null,
      tldr: null,
    });
    setStep('review');
  };

  const addAuthor = () => {
    setManualAuthors([...manualAuthors, { name: '' }]);
  };

  const updateAuthor = (index: number, name: string) => {
    const updated = [...manualAuthors];
    updated[index] = { name };
    setManualAuthors(updated);
  };

  const removeAuthor = (index: number) => {
    if (manualAuthors.length > 1) {
      setManualAuthors(manualAuthors.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add New Paper
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Step 1: Input */}
          {(step === 'input' || step === 'error') && (
            <div>
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={() => setInputMode('doi')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    inputMode === 'doi'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Globe size={16} />
                  Fetch by DOI
                </button>
                <button
                  onClick={() => setInputMode('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    inputMode === 'manual'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <FileText size={16} />
                  Manual Entry
                </button>
              </div>

              {/* DOI Mode */}
              {inputMode === 'doi' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter DOI or URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={doiInput}
                      onChange={(e) => setDoiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                      placeholder="e.g., 10.1038/s41586-021-03819-2 or https://doi.org/..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      autoFocus
                    />
                    <Button
                      onClick={handleFetch}
                      disabled={!doiInput.trim() || isLoading}
                      loading={isLoading}
                      icon={<Search size={18} />}
                    >
                      {isLoading ? 'Fetching...' : 'Fetch'}
                    </Button>
                  </div>

                  {step === 'error' && error && (
                    <div className="mt-4">
                      <ErrorMessage
                        message={error}
                        onRetry={handleFetch}
                        retryLabel="Try Again"
                      />
                    </div>
                  )}

                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                    We'll fetch metadata from Semantic Scholar and CrossRef
                  </p>
                </div>
              )}

              {/* Manual Mode */}
              {inputMode === 'manual' && (
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="Paper title..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>

                  {/* Authors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Authors
                    </label>
                    <div className="space-y-2">
                      {manualAuthors.map((author, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={author.name}
                            onChange={(e) => updateAuthor(index, e.target.value)}
                            placeholder={`Author ${index + 1} name...`}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          {manualAuthors.length > 1 && (
                            <button
                              onClick={() => removeAuthor(index)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addAuthor}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} />
                        Add author
                      </button>
                    </div>
                  </div>

                  {/* Year & Journal */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Year
                      </label>
                      <input
                        type="number"
                        value={manualYear}
                        onChange={(e) => setManualYear(e.target.value)}
                        placeholder="2024"
                        min="1900"
                        max="2100"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Journal / Venue
                      </label>
                      <input
                        type="text"
                        value={manualJournal}
                        onChange={(e) => setManualJournal(e.target.value)}
                        placeholder="Nature, arXiv, etc."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* DOI (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      DOI <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={manualDoi}
                      onChange={(e) => setManualDoi(e.target.value)}
                      placeholder="10.1038/..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  {/* Abstract (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Abstract <span className="text-gray-400">(optional)</span>
                    </label>
                    <textarea
                      value={manualAbstract}
                      onChange={(e) => setManualAbstract(e.target.value)}
                      placeholder="Paper abstract..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Continue Button */}
                  <Button
                    onClick={handleManualSubmit}
                    disabled={!manualTitle.trim()}
                    className="w-full"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Fetching */}
          {step === 'fetching' && (
            <div className="text-center py-12">
              <Loader2 className="animate-spin mx-auto text-indigo-600" size={48} />
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Fetching paper metadata...
              </p>
            </div>
          )}

          {/* Step 3: Review & Add */}
          {step === 'review' && metadata && (
            <div className="space-y-6">
              {/* Fetched Metadata */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {metadata.title || 'Untitled Paper'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {metadata.authors.map((a) => a.name).join(', ')}
                      {metadata.year && ` (${metadata.year})`}
                    </p>
                    {metadata.journal && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {metadata.journal}
                      </p>
                    )}
                  </div>
                  {metadata.doi && (
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded flex items-center gap-1">
                      <Check size={12} />
                      DOI verified
                    </span>
                  )}
                </div>
                {metadata.abstract && (
                  <details className="mt-3">
                    <summary className="text-sm text-indigo-600 dark:text-indigo-400 cursor-pointer">
                      Show abstract
                    </summary>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {metadata.abstract}
                    </p>
                  </details>
                )}
              </div>

              {/* Takeaway (Required) */}
              <FormTextarea
                label="Takeaway *"
                hint="What's the key insight? (min 10 characters)"
                value={takeaway}
                onChange={(e) => setTakeaway(e.target.value)}
                placeholder="One sentence that captures the main contribution or finding..."
                rows={3}
                showCount
                minLength={10}
                maxLength={500}
                error={takeaway.length > 0 && takeaway.length < 10 ? 'Takeaway must be at least 10 characters' : undefined}
              />

              {/* Thesis Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role in Your Thesis
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(THESIS_ROLE_COLORS) as ThesisRole[]).map((role) => {
                    const colors = THESIS_ROLE_COLORS[role];
                    return (
                      <button
                        key={role}
                        onClick={() => setThesisRole(role)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          thesisRole === role
                            ? `${colors.bg} ${colors.text} ring-2 ring-offset-2 ring-indigo-500`
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reading Status
                </label>
                <select
                  value={readingStatus}
                  onChange={(e) => setReadingStatus(e.target.value as ReadingStatus)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="to-read">To Read</option>
                  <option value="reading">Currently Reading</option>
                  <option value="read">Read</option>
                  <option value="to-revisit">Need to Revisit</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <Button
              variant="secondary"
              onClick={() => {
                setStep('input');
                setMetadata(null);
              }}
            >
              Back
            </Button>
            <Button
              onClick={handleSave}
              disabled={takeaway.trim().length < 10}
            >
              Save Paper
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
