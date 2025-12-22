// Retraction Warning Banner
// Shows a prominent warning when a paper has been retracted

import { AlertTriangle, ExternalLink, X } from 'lucide-react';

interface RetractionWarningBannerProps {
  paperTitle: string;
  onDismiss?: () => void;
  onAddAnyway?: () => void;
  details?: {
    citationCount?: number;
    isOpenAccess?: boolean;
    concepts?: string[];
  };
}

export function RetractionWarningBanner({
  paperTitle,
  onDismiss,
  onAddAnyway,
  details,
}: RetractionWarningBannerProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          <h3 className="text-red-800 font-semibold text-lg">
            Paper Has Been Retracted
          </h3>

          <p className="text-red-700 mt-1">
            This paper has been officially retracted. Adding retracted papers may
            undermine the credibility of your thesis argument.
          </p>

          <div className="mt-3 p-3 bg-red-100 rounded-md">
            <p className="text-red-800 text-sm font-medium truncate">
              "{paperTitle}"
            </p>
          </div>

          {details && (
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-red-600">
              {details.citationCount !== undefined && (
                <span className="bg-red-100 px-2 py-0.5 rounded">
                  {details.citationCount} citations
                </span>
              )}
              {details.isOpenAccess && (
                <span className="bg-red-100 px-2 py-0.5 rounded">
                  Open Access
                </span>
              )}
              {details.concepts?.slice(0, 3).map((concept, i) => (
                <span key={i} className="bg-red-100 px-2 py-0.5 rounded">
                  {concept}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors font-medium"
            >
              Cancel
            </button>

            <button
              onClick={onAddAnyway}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Add Anyway (Not Recommended)
            </button>
          </div>

          <p className="mt-3 text-xs text-red-500 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Consider searching for the retraction notice to understand why it was retracted.
          </p>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact inline retraction indicator for lists
 */
export function RetractionBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded ${className}`}
      title="This paper has been retracted"
    >
      <AlertTriangle className="w-3 h-3" />
      Retracted
    </span>
  );
}
