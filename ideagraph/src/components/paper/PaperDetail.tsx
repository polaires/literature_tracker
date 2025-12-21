import { useState, useEffect } from 'react';
import { X, ExternalLink, Trash2, Edit2, Link2, Trash, FileText, Upload, BookOpen } from 'lucide-react';
import type { Paper, Connection } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { PaperEditModal } from './PaperEditModal';
import { ConnectionEditor } from '../connection/ConnectionEditor';
import { PDFViewer, PDFUpload } from '../pdf';
import { pdfStorage } from '../../services/pdfStorage';

interface PaperDetailProps {
  paper: Paper;
  connections: Connection[];
  allPapers: Paper[];
  thesisId: string;
  onClose: () => void;
}

const ROLE_STYLES: Record<string, string> = {
  supports: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  contradicts: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  method: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  background: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  other: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const STATUS_STYLES: Record<string, string> = {
  'to-read': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  reading: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  read: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'to-revisit': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export function PaperDetail({
  paper,
  connections,
  allPapers,
  thesisId,
  onClose,
}: PaperDetailProps) {
  const { deletePaper, deleteConnection, setSelectedPaper, updatePaper } = useAppStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showConnectionEditor, setShowConnectionEditor] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [hasPDF, setHasPDF] = useState(false);
  const [pdfMetadata, setPdfMetadata] = useState<{ filename: string; fileSize: number } | null>(null);

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
    const statusOrder = ['to-read', 'reading', 'read', 'to-revisit'] as const;
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

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-gray-800 shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 pr-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
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
            <span className={`text-xs px-2 py-1 rounded-full ${ROLE_STYLES[paper.thesisRole]}`}>
              {paper.thesisRole}
            </span>
            <button
              onClick={handleToggleReadingStatus}
              className={`text-xs px-2 py-1 rounded-full transition-colors hover:ring-2 hover:ring-indigo-500 hover:ring-offset-1 ${STATUS_STYLES[paper.readingStatus]}`}
              title="Click to change reading status"
            >
              {paper.readingStatus.replace('-', ' ')}
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
          <p className="text-indigo-600 dark:text-indigo-400 font-medium">
            {paper.takeaway}
          </p>
        </div>

        {/* Arguments */}
        {paper.arguments.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Arguments
            </h3>
            <ul className="space-y-2">
              {paper.arguments.map((arg) => (
                <li
                  key={arg.id}
                  className="text-sm text-gray-600 dark:text-gray-400 pl-4 border-l-2 border-gray-300 dark:border-gray-600"
                >
                  {arg.claim}
                  {arg.strength && (
                    <span className="ml-2 text-xs text-gray-500">({arg.strength})</span>
                  )}
                </li>
              ))}
            </ul>
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
              {paper.abstract}
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
            <button
              onClick={() => setShowConnectionEditor(true)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Link2 size={14} />
              Add connection
            </button>
          </div>
          {connectedPapers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No connections yet. Add one to link this paper to others.
            </p>
          ) : (
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
                className="flex-1 flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
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
            <button
              onClick={() => setShowPDFUpload(true)}
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <FileText size={20} />
              <span>Add PDF for annotations</span>
            </button>
          )}
        </div>

        {/* Links */}
        <div className="flex items-center gap-4">
          {paper.doi && (
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
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
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
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
        <button
          onClick={() => setShowEditModal(true)}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors font-medium"
        >
          <Edit2 size={16} />
          Edit Paper
        </button>
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

      {/* PDF Viewer */}
      {showPDFViewer && (
        <PDFViewer
          paper={paper}
          onClose={() => setShowPDFViewer(false)}
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
  );
}
