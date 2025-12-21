import { X, ExternalLink, Trash2, Edit2, Link2 } from 'lucide-react';
import type { Paper, Connection } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface PaperDetailProps {
  paper: Paper;
  connections: Connection[];
  allPapers: Paper[];
  onClose: () => void;
  onAddConnection: () => void;
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
  onClose,
  onAddConnection,
}: PaperDetailProps) {
  const { deletePaper, setSelectedPaper } = useAppStore();

  const handleDelete = () => {
    if (confirm('Delete this paper and all its connections?')) {
      deletePaper(paper.id);
      onClose();
    }
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
        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-1 rounded-full ${ROLE_STYLES[paper.thesisRole]}`}>
            {paper.thesisRole}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[paper.readingStatus]}`}>
            {paper.readingStatus.replace('-', ' ')}
          </span>
          {paper.citationCount !== null && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {paper.citationCount} citations
            </span>
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

        {/* Connections */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Connections ({connectedPapers.length})
            </h3>
            <button
              onClick={onAddConnection}
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
              {connectedPapers.map(({ connection, paper: otherPaper }) => (
                <li
                  key={connection.id}
                  className="text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => otherPaper && setSelectedPaper(otherPaper.id)}
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {connection.type.replace('-', ' ')}:
                  </span>{' '}
                  <span className="text-gray-900 dark:text-white">
                    {otherPaper?.title || 'Unknown paper'}
                  </span>
                </li>
              ))}
            </ul>
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
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
        >
          <Trash2 size={16} />
          Delete
        </button>
        <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
          <Edit2 size={16} />
          Edit
        </button>
      </div>
    </div>
  );
}
