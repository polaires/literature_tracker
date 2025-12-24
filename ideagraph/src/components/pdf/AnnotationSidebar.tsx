import { useState } from 'react';
import {
  Trash2,
  MessageSquare,
  Link2,
  ChevronDown,
  ChevronRight,
  FileText,
  Lightbulb,
  FlaskConical,
} from 'lucide-react';
import type { PDFAnnotation, AnnotationColor, Paper } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface AnnotationSidebarProps {
  paper: Paper;
  annotations: PDFAnnotation[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (annotation: PDFAnnotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (id: string, updates: Partial<PDFAnnotation>) => void;
  colorMap: Record<AnnotationColor, string>;
}

export function AnnotationSidebar({
  paper,
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  onDeleteAnnotation,
  onUpdateAnnotation,
  colorMap,
}: AnnotationSidebarProps) {
  const { linkAnnotationToArgument, linkAnnotationToEvidence, updatePaper } = useAppStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<'argument' | 'evidence' | null>(null);

  // Sort annotations by page number and position
  const sortedAnnotations = [...annotations].sort((a, b) => {
    const pageA = a.position.pageNumber;
    const pageB = b.position.pageNumber;
    if (pageA !== pageB) return pageA - pageB;
    return a.position.boundingRect.y1 - b.position.boundingRect.y1;
  });

  // Group by page
  const byPage = sortedAnnotations.reduce((acc, ann) => {
    const page = ann.position.pageNumber;
    if (!acc[page]) acc[page] = [];
    acc[page].push(ann);
    return acc;
  }, {} as Record<number, PDFAnnotation[]>);

  const handleStartEditComment = (annotation: PDFAnnotation) => {
    setEditingComment(annotation.id);
    setCommentText(annotation.comment || '');
  };

  const handleSaveComment = (annotationId: string) => {
    onUpdateAnnotation(annotationId, { comment: commentText });
    setEditingComment(null);
    setCommentText('');
  };

  const handleLinkToArgument = (annotationId: string, argumentId: string) => {
    linkAnnotationToArgument(annotationId, argumentId);
    setLinkingId(null);
    setLinkType(null);
  };

  const handleLinkToEvidence = (annotationId: string, evidenceId: string) => {
    linkAnnotationToEvidence(annotationId, evidenceId);
    setLinkingId(null);
    setLinkType(null);
  };

  const handleExportToTakeaway = (annotation: PDFAnnotation) => {
    const currentTakeaway = paper.takeaway || '';
    const newText = annotation.selectedText || annotation.comment || '';
    const separator = currentTakeaway ? '\n\n' : '';
    updatePaper(paper.id, {
      takeaway: currentTakeaway + separator + `"${newText}" (p. ${annotation.position.pageNumber})`,
    });
    onUpdateAnnotation(annotation.id, { exportedToTakeaway: true });
  };

  const getLinkedItem = (annotation: PDFAnnotation): { type: string; label: string } | null => {
    if (annotation.linkedArgumentId) {
      const arg = paper.arguments.find(a => a.id === annotation.linkedArgumentId);
      return arg ? { type: 'argument', label: arg.claim.substring(0, 30) + '...' } : null;
    }
    if (annotation.linkedEvidenceId) {
      const ev = paper.evidence.find(e => e.id === annotation.linkedEvidenceId);
      return ev ? { type: 'evidence', label: ev.description.substring(0, 30) + '...' } : null;
    }
    return null;
  };

  return (
    <div className="fixed right-0 inset-y-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Annotations
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Annotations List */}
      <div className="flex-1 overflow-y-auto">
        {annotations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No annotations yet</p>
            <p className="text-xs mt-1">
              Select text in the PDF to create highlights
            </p>
          </div>
        ) : (
          Object.entries(byPage).map(([page, pageAnnotations]) => (
            <div key={page} className="border-b border-gray-100 dark:border-gray-700">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs font-medium text-gray-500 dark:text-gray-400">
                Page {page}
              </div>
              {pageAnnotations.map((annotation) => {
                const isExpanded = expandedId === annotation.id;
                const isSelected = selectedAnnotationId === annotation.id;
                const isLinking = linkingId === annotation.id;
                const linkedItem = getLinkedItem(annotation);

                return (
                  <div
                    key={annotation.id}
                    className={`border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                      isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  >
                    {/* Main annotation row */}
                    <div
                      className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      onClick={() => onSelectAnnotation(annotation)}
                    >
                      <div className="flex items-start gap-2">
                        {/* Color indicator */}
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: colorMap[annotation.color] }}
                        />

                        <div className="flex-1 min-w-0">
                          {/* Text or image preview */}
                          {annotation.selectedText ? (
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                              "{annotation.selectedText}"
                            </p>
                          ) : annotation.imageDataUrl ? (
                            <img
                              src={annotation.imageDataUrl}
                              alt="Area selection"
                              className="max-w-full h-16 object-cover rounded"
                            />
                          ) : (
                            <p className="text-sm text-gray-500 italic">Note</p>
                          )}

                          {/* Comment */}
                          {annotation.comment && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                              {annotation.comment}
                            </p>
                          )}

                          {/* Linked item badge */}
                          {linkedItem && (
                            <div className="mt-2">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                linkedItem.type === 'argument'
                                  ? 'bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}>
                                {linkedItem.type === 'argument' ? (
                                  <Lightbulb size={10} />
                                ) : (
                                  <FlaskConical size={10} />
                                )}
                                {linkedItem.label}
                              </span>
                            </div>
                          )}

                          {/* Tags */}
                          {annotation.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {annotation.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Expand button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : annotation.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {isExpanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded actions */}
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3">
                        {/* Edit comment */}
                        {editingComment === annotation.id ? (
                          <div>
                            <textarea
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                              rows={2}
                              placeholder="Add a comment..."
                              autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => setEditingComment(null)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveComment(annotation.id)}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditComment(annotation)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            <MessageSquare size={12} />
                            {annotation.comment ? 'Edit comment' : 'Add comment'}
                          </button>
                        )}

                        {/* Link to argument/evidence */}
                        {isLinking ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setLinkType('argument')}
                                className={`flex-1 text-xs px-2 py-1.5 rounded ${
                                  linkType === 'argument'
                                    ? 'bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                Argument
                              </button>
                              <button
                                onClick={() => setLinkType('evidence')}
                                className={`flex-1 text-xs px-2 py-1.5 rounded ${
                                  linkType === 'evidence'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                Evidence
                              </button>
                            </div>

                            {linkType === 'argument' && paper.arguments.length > 0 && (
                              <div className="space-y-1">
                                {paper.arguments.map((arg) => (
                                  <button
                                    key={arg.id}
                                    onClick={() => handleLinkToArgument(annotation.id, arg.id)}
                                    className="w-full text-left text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-stone-50 dark:hover:bg-stone-900/20"
                                  >
                                    {arg.claim}
                                  </button>
                                ))}
                              </div>
                            )}

                            {linkType === 'evidence' && paper.evidence.length > 0 && (
                              <div className="space-y-1">
                                {paper.evidence.map((ev) => (
                                  <button
                                    key={ev.id}
                                    onClick={() => handleLinkToEvidence(annotation.id, ev.id)}
                                    className="w-full text-left text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  >
                                    {ev.description}
                                  </button>
                                ))}
                              </div>
                            )}

                            {((linkType === 'argument' && paper.arguments.length === 0) ||
                              (linkType === 'evidence' && paper.evidence.length === 0)) && (
                              <p className="text-xs text-gray-500 italic">
                                No {linkType}s defined for this paper yet.
                              </p>
                            )}

                            <button
                              onClick={() => {
                                setLinkingId(null);
                                setLinkType(null);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setLinkingId(annotation.id)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            <Link2 size={12} />
                            Link to argument/evidence
                          </button>
                        )}

                        {/* Export to takeaway */}
                        {annotation.selectedText && !annotation.exportedToTakeaway && (
                          <button
                            onClick={() => handleExportToTakeaway(annotation)}
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <FileText size={12} />
                            Export to takeaway
                          </button>
                        )}

                        {annotation.exportedToTakeaway && (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <FileText size={12} />
                            Added to takeaway
                          </span>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteAnnotation(annotation.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer with stats */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {annotations.filter(a => a.linkedArgumentId || a.linkedEvidenceId).length} linked
          </span>
          <span>
            {annotations.filter(a => a.exportedToTakeaway).length} exported
          </span>
        </div>
      </div>
    </div>
  );
}
