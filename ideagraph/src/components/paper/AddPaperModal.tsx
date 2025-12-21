import { useState } from 'react';
import { X, Search, Loader2, Check, AlertCircle } from 'lucide-react';
import { fetchPaperMetadata, type PaperMetadata } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import type { ThesisRole, ReadingStatus } from '../../types';

interface AddPaperModalProps {
  thesisId: string;
  onClose: () => void;
}

type Step = 'input' | 'fetching' | 'review' | 'error';

const THESIS_ROLES: { value: ThesisRole; label: string; color: string }[] = [
  { value: 'supports', label: 'Supports', color: 'bg-green-100 text-green-800' },
  { value: 'contradicts', label: 'Contradicts', color: 'bg-red-100 text-red-800' },
  { value: 'method', label: 'Method', color: 'bg-blue-100 text-blue-800' },
  { value: 'background', label: 'Background', color: 'bg-gray-100 text-gray-800' },
  { value: 'other', label: 'Other', color: 'bg-purple-100 text-purple-800' },
];

export function AddPaperModal({ thesisId, onClose }: AddPaperModalProps) {
  const { addPaper } = useAppStore();

  const [step, setStep] = useState<Step>('input');
  const [doiInput, setDoiInput] = useState('');
  const [metadata, setMetadata] = useState<PaperMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [takeaway, setTakeaway] = useState('');
  const [thesisRole, setThesisRole] = useState<ThesisRole>('background');
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>('to-read');

  const handleFetch = async () => {
    if (!doiInput.trim()) return;

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
    });

    onClose();
  };

  const handleManualEntry = () => {
    setMetadata({
      doi: null,
      title: '',
      authors: [],
      year: null,
      journal: null,
      volume: null,
      issue: null,
      pages: null,
      abstract: null,
      url: null,
      pdfUrl: null,
      citationCount: null,
      tldr: null,
    });
    setStep('review');
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
          {/* Step 1: Input DOI */}
          {(step === 'input' || step === 'error') && (
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
                <button
                  onClick={handleFetch}
                  disabled={!doiInput.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Search size={18} />
                  Fetch
                </button>
              </div>

              {step === 'error' && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-red-800 dark:text-red-200 font-medium">
                      Could not fetch paper
                    </p>
                    <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 text-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">or</span>
                <button
                  onClick={handleManualEntry}
                  className="block mx-auto mt-2 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                >
                  Enter paper details manually
                </button>
              </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Takeaway <span className="text-red-500">*</span>
                  <span className="font-normal text-gray-500 ml-1">
                    (What's the key insight?)
                  </span>
                </label>
                <textarea
                  value={takeaway}
                  onChange={(e) => setTakeaway(e.target.value)}
                  placeholder="One sentence that captures the main contribution or finding..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {takeaway.length}/500 characters (min 10)
                </p>
              </div>

              {/* Thesis Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role in Your Thesis
                </label>
                <div className="flex flex-wrap gap-2">
                  {THESIS_ROLES.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setThesisRole(role.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        thesisRole === role.value
                          ? `${role.color} ring-2 ring-offset-2 ring-indigo-500`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
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
            <button
              onClick={() => {
                setStep('input');
                setMetadata(null);
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={takeaway.trim().length < 10}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Paper
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
