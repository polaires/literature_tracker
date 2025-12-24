import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  FileText,
  Building2,
} from 'lucide-react';
import { downloadAndStorePdf, type PaperIdentifiers } from '../../services/pdfResolver';
import { pdfStorage } from '../../services/pdfStorage';

interface PDFDownloadStatusProps {
  paperId: string;
  identifiers: PaperIdentifiers;
  autoDownload?: boolean;
  onDownloadComplete?: (success: boolean) => void;
  className?: string;
}

type DownloadState =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'success'
  | 'failed'
  | 'requires_auth';

interface SourceAttempt {
  source: string;
  success: boolean;
}

export function PDFDownloadStatus({
  paperId,
  identifiers,
  autoDownload = false,
  onDownloadComplete,
  className = '',
}: PDFDownloadStatusProps) {
  const [state, setState] = useState<DownloadState>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [sourceAttempts, setSourceAttempts] = useState<SourceAttempt[]>([]);
  const [doiUrl, setDoiUrl] = useState<string | null>(null);
  const [hasExistingPdf, setHasExistingPdf] = useState<boolean>(false);

  // Check if PDF already exists
  useEffect(() => {
    pdfStorage.hasPDF(paperId).then(setHasExistingPdf);
  }, [paperId]);

  const handleDownload = useCallback(async () => {
    if (state === 'downloading') return;

    setState('downloading');
    setStatusMessage('Resolving PDF sources...');
    setSourceAttempts([]);

    const result = await downloadAndStorePdf(paperId, identifiers, {
      onProgress: (status) => {
        setStatusMessage(status);
      },
      onSourceTried: (source, success) => {
        setSourceAttempts(prev => [...prev, { source, success }]);
      },
    });

    if (result.success) {
      setState('success');
      setStatusMessage(`Downloaded from ${result.source}`);
      setHasExistingPdf(true);
      onDownloadComplete?.(true);
    } else if (result.requiresManualDownload) {
      setState('requires_auth');
      setDoiUrl(result.doiUrl || null);
      setStatusMessage('Institutional access may be available');
      onDownloadComplete?.(false);
    } else {
      setState('failed');
      setStatusMessage(result.error || 'Download failed');
      onDownloadComplete?.(false);
    }
  }, [paperId, identifiers, state, onDownloadComplete]);

  // Auto-download on mount if enabled and no existing PDF
  useEffect(() => {
    if (autoDownload && !hasExistingPdf && state === 'idle') {
      // Small delay to not block UI
      const timer = setTimeout(handleDownload, 500);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, hasExistingPdf, state, handleDownload]);

  // Source badge component
  const SourceBadge = ({ source, success }: SourceAttempt) => (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
        success
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 line-through'
      }`}
    >
      {success ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {source.replace('_', ' ')}
    </span>
  );

  // Already have PDF
  if (hasExistingPdf && state !== 'downloading') {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-600 dark:text-green-400 ${className}`}>
        <CheckCircle size={16} />
        <span>PDF stored locally</span>
      </div>
    );
  }

  // Idle state - show download button
  if (state === 'idle') {
    const hasAnySources = identifiers.doi || identifiers.semanticScholarPdfUrl || identifiers.arxivId || identifiers.pmcId;

    if (!hasAnySources) {
      return (
        <div className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
          No PDF sources available
        </div>
      );
    }

    return (
      <button
        onClick={handleDownload}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400
          hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors ${className}`}
      >
        <Download size={16} />
        <span>Download PDF</span>
      </button>
    );
  }

  // Downloading state
  if (state === 'downloading') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
          <Loader2 size={16} className="animate-spin" />
          <span>{statusMessage}</span>
        </div>
        {sourceAttempts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sourceAttempts.map((attempt, i) => (
              <SourceBadge key={i} {...attempt} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Success state
  if (state === 'success') {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-600 dark:text-green-400 ${className}`}>
        <CheckCircle size={16} />
        <span>{statusMessage}</span>
        {sourceAttempts.length > 1 && (
          <div className="flex gap-1 ml-2">
            {sourceAttempts.map((attempt, i) => (
              <SourceBadge key={i} {...attempt} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Requires institutional access
  if (state === 'requires_auth') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <Building2 size={16} />
          <span>{statusMessage}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {doiUrl && (
            <a
              href={doiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20
                rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <ExternalLink size={14} />
              Open via DOI
            </a>
          )}
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
              text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700
              rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
        {sourceAttempts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sourceAttempts.map((attempt, i) => (
              <SourceBadge key={i} {...attempt} />
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          If you're on an institutional network, click "Open via DOI" to access the PDF through your subscription.
          Then upload it manually.
        </p>
      </div>
    );
  }

  // Failed state
  if (state === 'failed') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <XCircle size={16} />
          <span>{statusMessage}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
              text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20
              rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
          {identifiers.doi && (
            <a
              href={`https://doi.org/${identifiers.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700
                rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ExternalLink size={14} />
              Open DOI
            </a>
          )}
        </div>
        {sourceAttempts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sourceAttempts.map((attempt, i) => (
              <SourceBadge key={i} {...attempt} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

/**
 * Compact inline version for use in paper cards/lists
 */
export function PDFDownloadBadge({
  paperId,
  identifiers,
  onDownloadComplete,
}: {
  paperId: string;
  identifiers: PaperIdentifiers;
  onDownloadComplete?: (success: boolean) => void;
}) {
  const [hasExistingPdf, setHasExistingPdf] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    pdfStorage.hasPDF(paperId).then(setHasExistingPdf);
  }, [paperId]);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    const result = await downloadAndStorePdf(paperId, identifiers);
    setIsDownloading(false);

    if (result.success) {
      setHasExistingPdf(true);
    }
    onDownloadComplete?.(result.success);
  };

  if (hasExistingPdf) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium
        text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded">
        <FileText size={12} />
        PDF
      </span>
    );
  }

  const hasAnySources = identifiers.doi || identifiers.semanticScholarPdfUrl;

  if (!hasAnySources) return null;

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium
        text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20
        rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDownloading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Download size={12} />
      )}
      {isDownloading ? 'Downloading...' : 'Get PDF'}
    </button>
  );
}
