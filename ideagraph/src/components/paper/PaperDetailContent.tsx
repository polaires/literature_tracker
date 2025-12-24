// PaperDetailContent - Content component for the right panel paper detail view
// This is the inner content extracted from PaperDetail for use in the new layout

import { useState, useEffect, useMemo } from 'react';
import {
  ExternalLink,
  BookOpen,
  Calendar,
  Quote,
  Edit2,
  Trash2,
  FileText,
  Link2,
  Plus,
  Tag,
  Eye,
  Sparkles,
  Loader2,
  X,
  Upload,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { usePanelContext } from '../../contexts/PanelContext';
import { useAI } from '../../hooks/useAI';
import type { Paper, Connection, ThesisRole, ReadingStatus } from '../../types';
import { THESIS_ROLE_COLORS } from '../../constants/colors';
import { Button } from '../ui';
import { ConnectionEditor } from '../connection/ConnectionEditor';
import { PDFDownloadStatus } from './PDFDownloadStatus';
import { pdfStorage } from '../../services/pdfStorage';
import { PDFUpload } from '../pdf';

interface PaperDetailContentProps {
  paper: Paper;
  connections: Connection[];
  allPapers: Paper[];
  thesisId: string;
}

const READING_STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: 'screening', label: 'Screening' },
  { value: 'to-read', label: 'To Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'read', label: 'Read' },
  { value: 'to-revisit', label: 'To Revisit' },
];

export function PaperDetailContent({
  paper,
  connections,
  allPapers,
  thesisId,
}: PaperDetailContentProps) {
  const { updatePaper, deletePaper, setSelectedPaper } = useAppStore();
  const { openFullScreen, closeRightPanel } = usePanelContext();

  // AI features
  const {
    isConfigured: isAIConfigured,
    settings: aiSettings,
    suggestConnections,
    connectionSuggestions,
    acceptConnectionSuggestion,
    dismissConnectionSuggestion,
    isLoading: isAILoading,
    loadingType: aiLoadingType,
  } = useAI();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTakeaway, setEditedTakeaway] = useState(paper.takeaway);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showConnectionEditor, setShowConnectionEditor] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [hasPDF, setHasPDF] = useState(false);

  // Build identifiers for PDF resolution
  const pdfIdentifiers = useMemo(() => ({
    doi: paper.doi,
    semanticScholarPdfUrl: paper.pdfUrl,
    arxivId: null,
    pmcId: null,
    pmid: null,
  }), [paper.doi, paper.pdfUrl]);

  const canDownloadPdf = !!(paper.doi || paper.pdfUrl);

  // Check if paper has a stored PDF
  useEffect(() => {
    pdfStorage.hasPDF(paper.id).then(setHasPDF);
  }, [paper.id]);

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

  const handleSaveTakeaway = () => {
    updatePaper(paper.id, { takeaway: editedTakeaway });
    setIsEditing(false);
  };

  const handleDelete = () => {
    deletePaper(paper.id);
    setSelectedPaper(null);
    closeRightPanel();
  };

  const handleStatusChange = (status: ReadingStatus) => {
    updatePaper(paper.id, {
      readingStatus: status,
      readAt: status === 'read' ? new Date().toISOString() : paper.readAt,
    });
  };

  const handleRoleChange = (role: ThesisRole) => {
    updatePaper(paper.id, { thesisRole: role });
  };

  const handleOpenPdf = () => {
    if (paper.pdfUrl) {
      openFullScreen('pdf', { paperId: paper.id, pdfUrl: paper.pdfUrl });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Paper Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
            {paper.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {paper.authors.map((a) => a.name).join(', ')}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
            {paper.year && (
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {paper.year}
              </span>
            )}
            {paper.journal && (
              <span className="flex items-center gap-1">
                <BookOpen size={14} />
                {paper.journal}
              </span>
            )}
            {paper.citationCount !== null && (
              <span className="flex items-center gap-1">
                <Quote size={14} />
                {paper.citationCount.toLocaleString()} citations
              </span>
            )}
          </div>

          {/* External links */}
          <div className="flex items-center gap-2 mt-3">
            {paper.doi && (
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <ExternalLink size={14} />
                DOI
              </a>
            )}
            {paper.pdfUrl && (
              <button
                onClick={handleOpenPdf}
                className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <FileText size={14} />
                View PDF
              </button>
            )}
          </div>
        </div>

        {/* Thesis Role */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Thesis Role
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(THESIS_ROLE_COLORS).map(([role, colors]) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role as ThesisRole)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  paper.thesisRole === role
                    ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-indigo-500`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {colors.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reading Status */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Reading Status
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {READING_STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleStatusChange(value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  paper.readingStatus === value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Takeaway */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Takeaway
            </label>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedTakeaway}
                onChange={(e) => setEditedTakeaway(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={4}
                placeholder="Key insight from this paper..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveTakeaway}>Save</Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditedTakeaway(paper.takeaway);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {paper.takeaway || 'No takeaway added yet'}
            </p>
          )}
        </div>

        {/* Abstract */}
        {paper.abstract && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Abstract
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              {paper.abstract}
            </p>
          </div>
        )}

        {/* Connections */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Connections ({connections.length})
            </label>
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
                className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded"
                title="Add connection"
              >
                <Plus size={16} />
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

          {connections.length === 0 && !showAISuggestions ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No connections yet. {canSuggestConnections ? 'Try AI Suggest or add manually.' : 'Add one to link this paper to others.'}
            </p>
          ) : connections.length === 0 ? null : (
            <div className="space-y-2">
              {connections.map((conn) => {
                const otherPaperId = conn.fromPaperId === paper.id ? conn.toPaperId : conn.fromPaperId;
                const otherPaper = allPapers.find((p) => p.id === otherPaperId);
                if (!otherPaper) return null;

                return (
                  <button
                    key={conn.id}
                    onClick={() => setSelectedPaper(otherPaperId)}
                    className="w-full p-2 text-left bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Link2 size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded">
                        {conn.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-1">
                      {otherPaper.title}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* PDF Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            PDF Document
          </label>
          <div className="mt-2">
            {hasPDF ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <FileText size={16} />
                  <span className="text-sm font-medium">PDF stored locally</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openFullScreen('pdf', { paperId: paper.id })}
                >
                  Open
                </Button>
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
                        if (success) setHasPDF(true);
                      }}
                    />
                  </div>
                )}
                {/* Manual upload option */}
                <button
                  onClick={() => setShowPDFUpload(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
                >
                  <Upload size={16} />
                  <span>Upload PDF manually</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {paper.tags.length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {paper.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        {paper.pdfUrl && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleOpenPdf}
            icon={<Eye size={16} />}
          >
            Open PDF
          </Button>
        )}
        <div className="flex-1" />
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600 dark:text-red-400">Delete?</span>
            <Button size="sm" variant="danger" onClick={handleDelete}>
              Yes
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              No
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Delete paper"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Connection Editor Modal */}
      {showConnectionEditor && (
        <ConnectionEditor
          thesisId={thesisId}
          sourcePaper={paper}
          onClose={() => setShowConnectionEditor(false)}
        />
      )}

      {/* PDF Upload Modal */}
      {showPDFUpload && (
        <PDFUpload
          paperId={paper.id}
          onUploadComplete={() => {
            setHasPDF(true);
            setShowPDFUpload(false);
          }}
          onClose={() => setShowPDFUpload(false)}
        />
      )}
    </div>
  );
}
