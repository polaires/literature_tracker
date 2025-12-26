import { useState, useEffect, useMemo } from 'react';
import { X, ExternalLink, Trash2, Edit2, Link2, Trash, Upload, BookOpen, Sparkles, Loader2, Search, CircleDot, Circle, CircleDashed, ThumbsUp, ThumbsDown, HelpCircle, MessageSquareQuote } from 'lucide-react';
import type { Paper, Connection, ThesisRole, ReadingStatus } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { useAI } from '../../hooks/useAI';
import { PaperEditModal } from './PaperEditModal';
import { ConnectionEditor } from '../connection/ConnectionEditor';
import { CitationNetworkModal } from './CitationNetworkModal';
import { PDFViewer, PDFUpload } from '../pdf';
import { pdfStorage } from '../../services/pdfStorage';
import { THESIS_ROLE_COLORS, READING_STATUS_COLORS, ARGUMENT_STRENGTH_COLORS, ARGUMENT_ASSESSMENT_COLORS } from '../../constants/colors';
import { cleanAbstract } from '../../utils/textCleaner';
import { PDFDownloadStatus } from './PDFDownloadStatus';

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

interface PaperDetailProps {
  paper: Paper;
  connections: Connection[];
  allPapers: Paper[];
  thesisId: string;
  onClose: () => void;
}

export function PaperDetail({
  paper,
  connections,
  allPapers,
  thesisId,
  onClose,
}: PaperDetailProps) {
  const { deletePaper, deleteConnection, setSelectedPaper, updatePaper, theses } = useAppStore();
  const thesis = theses.find(t => t.id === thesisId);
  const {
    suggestConnections,
    connectionSuggestions,
    isConfigured: isAIConfigured,
    settings: aiSettings,
    isLoading: isAILoading,
    loadingType: aiLoadingType,
    acceptConnectionSuggestion,
    dismissConnectionSuggestion,
  } = useAI();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showConnectionEditor, setShowConnectionEditor] = useState(false);
  const [showCitationNetwork, setShowCitationNetwork] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [hasPDF, setHasPDF] = useState(false);
  const [pdfMetadata, setPdfMetadata] = useState<{ filename: string; fileSize: number } | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // Build identifiers for PDF resolution
  const pdfIdentifiers = useMemo(() => ({
    doi: paper.doi,
    semanticScholarPdfUrl: paper.pdfUrl,
    arxivId: null, // TODO: Store arxivId in Paper type
    pmcId: null,   // TODO: Store pmcId in Paper type
    pmid: null,
  }), [paper.doi, paper.pdfUrl]);

  // Check if paper has identifiers that could resolve to a PDF
  const canDownloadPdf = !!(paper.doi || paper.pdfUrl);

  // Check if paper has a stored PDF
  useEffect(() => {
    async function checkPDF() {
      const hasStoredPDF = await pdfStorage.hasPDF(paper.id);
      setHasPDF(hasStoredPDF || !!paper.pdfUrl);

      if (hasStoredPDF) {
        const metadata = await pdfStorage.getPDFMetadata(paper.id);
        setPdfMetadata(metadata);
      }
    }
    checkPDF();
  }, [paper.id, paper.pdfUrl]);

  const handlePDFUploadComplete = (metadata: { id: string; filename: string; fileSize: number }) => {
    setHasPDF(true);
    setPdfMetadata({ filename: metadata.filename, fileSize: metadata.fileSize });
    setShowPDFUpload(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDelete = () => {
    if (confirm('Delete this paper and all its connections?')) {
      deletePaper(paper.id);
      onClose();
    }
  };

  const handleDeleteConnection = (connectionId: string) => {
    if (confirm('Remove this connection?')) {
      deleteConnection(connectionId);
    }
  };

  const handleToggleReadingStatus = () => {
    const statusOrder = ['screening', 'to-read', 'reading', 'read', 'to-revisit'] as const;
    const currentIndex = statusOrder.indexOf(paper.readingStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    updatePaper(paper.id, {
      readingStatus: nextStatus,
      readAt: nextStatus === 'read' && !paper.readAt ? new Date().toISOString() : paper.readAt,
    });
  };

  // Get connected papers
  const connectedPapers = connections.map((conn) => {
    const otherId = conn.fromPaperId === paper.id ? conn.toPaperId : conn.fromPaperId;
    const otherPaper = allPapers.find((p) => p.id === otherId);
    return { connection: conn, paper: otherPaper };
  });

  const roleColors = THESIS_ROLE_COLORS[paper.thesisRole as ThesisRole];
  const statusColors = READING_STATUS_COLORS[paper.readingStatus as ReadingStatus];

  // AI connection suggestion helpers
  const canSuggestConnections = isAIConfigured && aiSettings.enableConnectionSuggestions && allPapers.length > 1;
  const isSuggestingConnections = isAILoading && aiLoadingType === 'connection';

  const handleSuggestConnections = async () => {
    if (!canSuggestConnections || isSuggestingConnections) return;
    setShowAISuggestions(true);
    try {
      await suggestConnections(paper.id);
    } catch (err) {
      console.error('Failed to suggest connections:', err);
    }
  };

  // Filter suggestions for this paper
  const paperSuggestions = connectionSuggestions.filter(s => s.targetPaperId === paper.id);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-30 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-gray-800 shadow-xl z-40 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paper-detail-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 pr-4">
            <h2
              id="paper-detail-title"
              className="text-lg font-semibold text-gray-900 dark:text-white leading-tight"
            >
              {paper.title}
            </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {paper.authors.map((a) => a.name).join(', ')}
            {paper.year && ` (${paper.year})`}
          </p>
          {paper.journal && (
            <p className="text-sm text-gray-500 dark:text-gray-500">{paper.journal}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Tags & Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded-full ${roleColors.bg} ${roleColors.text}`}>
              {roleColors.label}
            </span>
            <button
              onClick={handleToggleReadingStatus}
              className={`text-xs px-2 py-1 rounded-full transition-colors hover:ring-2 hover:ring-stone-500 hover:ring-offset-1 ${statusColors.bg} ${statusColors.text}`}
              title="Click to change reading status"
            >
              {statusColors.label}
            </button>
            {paper.citationCount !== null && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {paper.citationCount} citations
              </span>
            )}
          </div>
          {paper.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {paper.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                >
                  {tag}
                </span>
              ))}
              {paper.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{paper.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Takeaway */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Takeaway
          </h3>
          <p className="text-stone-700 dark:text-stone-400 font-medium">
            {paper.takeaway}
          </p>
        </div>

        {/* Arguments */}
        {paper.arguments.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <MessageSquareQuote size={16} className="text-stone-600" />
              Arguments ({paper.arguments.length})
            </h3>
            <div className="space-y-3">
              {paper.arguments.map((arg) => {
                const strengthColors = arg.strength ? ARGUMENT_STRENGTH_COLORS[arg.strength] : null;
                const assessmentColors = arg.yourAssessment ? ARGUMENT_ASSESSMENT_COLORS[arg.yourAssessment] : null;
                const StrengthIcon = arg.strength ? STRENGTH_ICONS[arg.strength] : null;
                const AssessmentIcon = arg.yourAssessment ? ASSESSMENT_ICONS[arg.yourAssessment] : null;

                return (
                  <div
                    key={arg.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600/50"
                  >
                    <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                      {arg.claim}
                    </p>
                    {(arg.strength || arg.yourAssessment) && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {strengthColors && StrengthIcon && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${strengthColors.bg} ${strengthColors.text}`}>
                            <StrengthIcon size={12} />
                            {strengthColors.label}
                          </span>
                        )}
                        {assessmentColors && AssessmentIcon && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${assessmentColors.bg} ${assessmentColors.text}`}>
                            <AssessmentIcon size={12} />
                            {assessmentColors.label}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Evidence */}
        {paper.evidence.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Evidence
            </h3>
            <ul className="space-y-2">
              {paper.evidence.map((ev) => (
                <li
                  key={ev.id}
                  className="text-sm text-gray-600 dark:text-gray-400 pl-4 border-l-2 border-blue-300 dark:border-blue-600"
                >
                  {ev.description}
                  <span className="ml-2 text-xs text-gray-500">({ev.type})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Abstract */}
        {paper.abstract && (
          <details>
            <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Abstract
            </summary>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {cleanAbstract(paper.abstract)}
            </p>
          </details>
        )}

        {/* Assessment */}
        {paper.assessment && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Assessment
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              {paper.assessment}
            </p>
          </div>
        )}

        {/* Connections */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Connections ({connectedPapers.length})
            </h3>
            <div className="flex items-center gap-2">
              {canSuggestConnections && (
                <button
                  onClick={handleSuggestConnections}
                  disabled={isSuggestingConnections}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-all ${
                    isSuggestingConnections
                      ? 'bg-stone-100 dark:bg-stone-900/30 text-stone-600 dark:text-stone-400 cursor-wait'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900/20'
                  }`}
                >
                  {isSuggestingConnections ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  {isSuggestingConnections ? 'Finding...' : 'AI Suggest'}
                </button>
              )}
              <button
                onClick={() => setShowConnectionEditor(true)}
                className="text-xs text-stone-700 dark:text-stone-400 hover:underline flex items-center gap-1"
              >
                <Link2 size={14} />
                Add
              </button>
            </div>
          </div>

          {/* AI Suggestions */}
          {showAISuggestions && paperSuggestions.length > 0 && (
            <div className="mb-3 p-3 bg-stone-50 dark:bg-stone-900/20 rounded-lg border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <Sparkles size={12} />
                  AI Suggestions
                </span>
                <button
                  onClick={() => setShowAISuggestions(false)}
                  className="text-xs text-stone-500 hover:text-stone-700"
                >
                  Hide
                </button>
              </div>
              <div className="space-y-2">
                {paperSuggestions.map((suggestion) => {
                  const suggestedPaper = allPapers.find(p => p.id === suggestion.suggestedPaperId);
                  return (
                    <div
                      key={suggestion.id}
                      className="flex items-start justify-between gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-stone-100 dark:border-stone-900"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-1.5 py-0.5 bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 rounded">
                            {suggestion.connectionType.replace('-', ' ')}
                          </span>
                          <span className="text-xs text-gray-400">
                            {Math.round(suggestion.confidence * 100)}% confident
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white truncate">
                          {suggestedPaper?.title || suggestion.suggestedPaperTitle}
                        </p>
                        {suggestion.reasoning && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {suggestion.reasoning}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => acceptConnectionSuggestion(suggestion)}
                          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          title="Accept"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => dismissConnectionSuggestion(suggestion.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Dismiss"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {connectedPapers.length === 0 && !showAISuggestions ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No connections yet. {canSuggestConnections ? 'Try AI Suggest or add manually.' : 'Add one to link this paper to others.'}
            </p>
          ) : connectedPapers.length === 0 ? null : (
            <ul className="space-y-2">
              {connectedPapers.map(({ connection, paper: otherPaper }) => {
                const isSource = connection.fromPaperId === paper.id;
                const direction = isSource ? '→' : '←';

                return (
                  <li
                    key={connection.id}
                    className="group text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => otherPaper && setSelectedPaper(otherPaper.id)}
                      >
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                            {connection.type.replace('-', ' ')}
                          </span>
                          <span className="text-xs">{direction}</span>
                        </div>
                        <p className="text-gray-900 dark:text-white line-clamp-2">
                          {otherPaper?.title || 'Unknown paper'}
                        </p>
                        {connection.note && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                            {connection.note}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConnection(connection.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove connection"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* PDF Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            PDF Document
          </h3>
          {hasPDF ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPDFViewer(true)}
                className="flex-1 flex items-center gap-2 p-3 bg-stone-100 dark:bg-stone-800/20 text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800/30 transition-colors"
              >
                <BookOpen size={20} />
                <div className="text-left">
                  <p className="text-sm font-medium">Open PDF Reader</p>
                  {pdfMetadata && (
                    <p className="text-xs opacity-75">
                      {pdfMetadata.filename} ({formatFileSize(pdfMetadata.fileSize)})
                    </p>
                  )}
                </div>
              </button>
              <button
                onClick={() => setShowPDFUpload(true)}
                className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Upload different PDF"
              >
                <Upload size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Auto-download option */}
              {canDownloadPdf && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Try to download PDF automatically
                  </p>
                  <PDFDownloadStatus
                    paperId={paper.id}
                    identifiers={pdfIdentifiers}
                    autoDownload={false}
                    onDownloadComplete={(success) => {
                      if (success) {
                        setHasPDF(true);
                        pdfStorage.getPDFMetadata(paper.id).then(setPdfMetadata);
                      }
                    }}
                  />
                </div>
              )}
              {/* Manual upload option */}
              <button
                onClick={() => setShowPDFUpload(true)}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-stone-400 hover:text-stone-700 dark:hover:text-stone-400 transition-colors"
              >
                <Upload size={20} />
                <span>Or upload PDF manually</span>
              </button>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="flex items-center gap-4">
          {paper.doi && (
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-stone-700 dark:text-stone-400 hover:underline flex items-center gap-1"
            >
              <ExternalLink size={14} />
              View on DOI
            </a>
          )}
          {paper.pdfUrl && (
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-stone-700 dark:text-stone-400 hover:underline flex items-center gap-1"
            >
              <ExternalLink size={14} />
              Open PDF
            </a>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={handleDelete}
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
          Delete
        </button>
        <div className="flex items-center gap-2">
          {paper.semanticScholarId && (
            <button
              onClick={() => setShowCitationNetwork(true)}
              className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 flex items-center gap-1.5 px-3 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-900/20 rounded-lg transition-colors"
              title="Find related papers, citations, and references"
            >
              <Search size={16} />
              Find Related
            </button>
          )}
          <button
            onClick={() => setShowEditModal(true)}
            className="text-sm text-stone-700 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-300 flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800/20 hover:bg-stone-200 dark:hover:bg-stone-800/30 rounded-lg transition-colors font-medium"
          >
            <Edit2 size={16} />
            Edit Paper
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <PaperEditModal
          paper={paper}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Connection Editor */}
      {showConnectionEditor && (
        <ConnectionEditor
          thesisId={thesisId}
          sourcePaper={paper}
          onClose={() => setShowConnectionEditor(false)}
        />
      )}

      {/* Citation Network Modal */}
      {showCitationNetwork && (
        <CitationNetworkModal
          thesisId={thesisId}
          paper={paper}
          onClose={() => setShowCitationNetwork(false)}
        />
      )}

      {/* PDF Viewer */}
      {showPDFViewer && (
        <PDFViewer
          paper={paper}
          thesis={thesis}
          onClose={() => setShowPDFViewer(false)}
          showAIAssistant={true}
        />
      )}

        {/* PDF Upload */}
        {showPDFUpload && (
          <PDFUpload
            paperId={paper.id}
            onUploadComplete={handlePDFUploadComplete}
            onClose={() => setShowPDFUpload(false)}
          />
        )}
      </div>
    </>
  );
}
