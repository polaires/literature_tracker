import { useState, useCallback } from 'react';
import {
  X,
  Upload,
  Loader2,
  Check,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { fetchPaperMetadata, extractDOI } from '../../services/api';
import type { Paper, ThesisRole } from '../../types';

interface BatchImportModalProps {
  thesisId: string;
  onClose: () => void;
}

interface ImportResult {
  doi: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  title?: string;
  error?: string;
}

export function BatchImportModal({ thesisId, onClose }: BatchImportModalProps) {
  const { addPaper, hasPaperWithDOI } = useAppStore();

  // Input state
  const [doiInput, setDoiInput] = useState('');
  const [defaultRole, setDefaultRole] = useState<ThesisRole>('background');

  // Import state
  const [results, setResults] = useState<ImportResult[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);

  // Parse DOIs from input
  const parseDOIs = useCallback((input: string): string[] => {
    const lines = input.split(/[\n,;]+/).map((line) => line.trim()).filter(Boolean);
    const dois: string[] = [];

    for (const line of lines) {
      const doi = extractDOI(line);
      if (doi && !dois.includes(doi)) {
        dois.push(doi);
      }
    }

    return dois;
  }, []);

  // Preview DOIs
  const previewDOIs = parseDOIs(doiInput);
  const duplicateDOIs = previewDOIs.filter((doi) => hasPaperWithDOI(thesisId, doi));
  const newDOIs = previewDOIs.filter((doi) => !hasPaperWithDOI(thesisId, doi));

  // Start import
  const handleImport = useCallback(async () => {
    if (newDOIs.length === 0) return;

    setIsImporting(true);
    setImportComplete(false);

    // Initialize results
    const initialResults: ImportResult[] = newDOIs.map((doi) => ({
      doi,
      status: 'pending',
    }));
    setResults(initialResults);

    // Process DOIs sequentially with rate limiting
    for (let i = 0; i < newDOIs.length; i++) {
      const doi = newDOIs[i];

      // Update status to loading
      setResults((prev) =>
        prev.map((r) => (r.doi === doi ? { ...r, status: 'loading' as const } : r))
      );

      try {
        const metadata = await fetchPaperMetadata(doi);

        // Create paper
        const paper: Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'> = {
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
          takeaway: metadata.tldr || 'Takeaway to be added after reading',
          arguments: [],
          evidence: [],
          assessment: null,
          thesisRole: defaultRole,
          readingStatus: 'screening',
          tags: [],
          readAt: null,
          source: 'doi',
          rawBibtex: null,
          screeningDecision: 'pending',
          exclusionReason: null,
          exclusionNote: null,
          screenedAt: null,
          semanticScholarId: null,
        };

        addPaper(paper);

        // Update status to success
        setResults((prev) =>
          prev.map((r) =>
            r.doi === doi
              ? { ...r, status: 'success' as const, title: metadata.title }
              : r
          )
        );
      } catch (e) {
        // Update status to error
        setResults((prev) =>
          prev.map((r) =>
            r.doi === doi
              ? {
                  ...r,
                  status: 'error' as const,
                  error: e instanceof Error ? e.message : 'Import failed',
                }
              : r
          )
        );
      }

      // Small delay between requests to avoid rate limiting
      if (i < newDOIs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    setIsImporting(false);
    setImportComplete(true);
  }, [newDOIs, thesisId, defaultRole, addPaper]);

  // Count results
  const successCount = results.filter((r) => r.status === 'success').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  return (
    <Modal onClose={onClose} className="max-w-2xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-stone-700 dark:text-stone-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Batch Import DOIs
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!importComplete ? (
          <>
            {/* Instructions */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Paste DOIs (one per line, comma-separated, or as URLs). We'll fetch
              metadata from Semantic Scholar and CrossRef.
            </p>

            {/* DOI Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                DOIs
              </label>
              <textarea
                value={doiInput}
                onChange={(e) => setDoiInput(e.target.value)}
                placeholder={`10.1038/s41586-021-03819-2
https://doi.org/10.1126/science.abf4799
10.1021/jacs.0c01932`}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-stone-500 focus:border-transparent font-mono text-sm"
                disabled={isImporting}
              />
            </div>

            {/* Default Role */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Thesis Role
              </label>
              <select
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value as ThesisRole)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                disabled={isImporting}
              >
                <option value="background">Background</option>
                <option value="supports">Supports</option>
                <option value="contradicts">Contradicts</option>
                <option value="method">Method</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Preview */}
            {previewDOIs.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                </h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {previewDOIs.length} DOI{previewDOIs.length > 1 ? 's' : ''} detected
                  </span>
                  {newDOIs.length > 0 && (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle size={14} />
                      {newDOIs.length} new
                    </span>
                  )}
                  {duplicateDOIs.length > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {duplicateDOIs.length} already added
                    </span>
                  )}
                </div>

                {duplicateDOIs.length > 0 && (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    Duplicates will be skipped: {duplicateDOIs.slice(0, 3).join(', ')}
                    {duplicateDOIs.length > 3 && ` +${duplicateDOIs.length - 3} more`}
                  </div>
                )}
              </div>
            )}

            {/* Import Progress */}
            {isImporting && results.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Importing papers...</span>
                  <span>
                    {results.filter((r) => r.status !== 'pending').length} / {results.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-stone-800 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        (results.filter((r) => r.status !== 'pending').length /
                          results.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
                  {results.map((result) => (
                    <div
                      key={result.doi}
                      className="flex items-center gap-2 text-xs"
                    >
                      {result.status === 'pending' && (
                        <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
                      )}
                      {result.status === 'loading' && (
                        <Loader2 size={14} className="animate-spin text-stone-700" />
                      )}
                      {result.status === 'success' && (
                        <Check size={14} className="text-green-600" />
                      )}
                      {result.status === 'error' && (
                        <XCircle size={14} className="text-red-600" />
                      )}
                      <span className="font-mono text-gray-600 dark:text-gray-400 truncate">
                        {result.doi}
                      </span>
                      {result.status === 'error' && (
                        <span className="text-red-600 dark:text-red-400 truncate">
                          {result.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Import Complete */
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Import Complete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Successfully imported {successCount} paper{successCount !== 1 ? 's' : ''}
              {errorCount > 0 && `, ${errorCount} failed`}
            </p>

            {/* Results summary */}
            <div className="max-h-60 overflow-y-auto text-left space-y-2 mb-6">
              {results.map((result) => (
                <div
                  key={result.doi}
                  className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                    result.status === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  {result.status === 'success' ? (
                    <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {result.title || result.doi}
                    </div>
                    {result.status === 'error' && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {result.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={onClose}>Done</Button>
          </div>
        )}
      </div>

      {/* Footer */}
      {!importComplete && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={newDOIs.length === 0 || isImporting}
            icon={
              isImporting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Upload size={18} />
              )
            }
          >
            {isImporting
              ? 'Importing...'
              : `Import ${newDOIs.length} Paper${newDOIs.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </Modal>
  );
}
