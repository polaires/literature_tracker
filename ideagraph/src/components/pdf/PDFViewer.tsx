import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PdfLoader,
  PdfHighlighter,
  Highlight,
  AreaHighlight,
  Popup,
} from 'react-pdf-highlighter';
import type { IHighlight, NewHighlight } from 'react-pdf-highlighter';

// Initialize PDF.js worker
import '../../lib/pdfWorker';
import {
  X,
  Highlighter,
  MessageSquare,
  Square,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { PDFAnnotation, AnnotationColor, Paper } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { pdfStorage } from '../../services/pdfStorage';
import { AnnotationSidebar } from './AnnotationSidebar';

interface PDFViewerProps {
  paper: Paper;
  onClose: () => void;
}

// Map our annotation colors to CSS colors
const COLOR_MAP: Record<AnnotationColor, string> = {
  yellow: '#FFEB3B',
  red: '#EF5350',
  green: '#66BB6A',
  blue: '#42A5F5',
  purple: '#AB47BC',
  orange: '#FFA726',
};

// Convert our PDFAnnotation to react-pdf-highlighter format
function toHighlightFormat(annotation: PDFAnnotation): IHighlight {
  return {
    id: annotation.id,
    position: annotation.position,
    content: {
      text: annotation.selectedText,
      image: annotation.imageDataUrl,
    },
    comment: {
      text: annotation.comment || '',
      emoji: '',
    },
  };
}

export function PDFViewer({ paper, onClose }: PDFViewerProps) {
  const { addAnnotation, updateAnnotation, deleteAnnotation, getAnnotationsForPaper } = useAppStore();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<AnnotationColor>('yellow');
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [highlightMode, setHighlightMode] = useState<'highlight' | 'area' | 'note'>('highlight');

  const scrollViewerTo = useRef<(highlight: IHighlight) => void>(() => {});

  // Get annotations for this paper
  const annotations = getAnnotationsForPaper(paper.id);
  const highlights = annotations.map(toHighlightFormat);

  // Load PDF on mount
  useEffect(() => {
    let blobUrl: string | null = null;

    async function loadPDF() {
      setLoading(true);
      setError(null);

      try {
        // First try to get from IndexedDB
        const url = await pdfStorage.createPDFUrl(paper.id);
        if (url) {
          blobUrl = url;
          setPdfUrl(url);
        } else if (paper.pdfUrl) {
          // Fall back to remote URL
          setPdfUrl(paper.pdfUrl);
        } else {
          setError('No PDF available for this paper');
        }
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setError('Failed to load PDF');
      } finally {
        setLoading(false);
      }
    }

    loadPDF();

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [paper.id, paper.pdfUrl]);

  // Handle creating a new highlight
  const handleAddHighlight = useCallback((highlight: NewHighlight) => {
    addAnnotation({
      paperId: paper.id,
      type: highlight.content.image ? 'area' : 'highlight',
      color: activeColor,
      position: highlight.position as PDFAnnotation['position'],
      selectedText: highlight.content.text,
      comment: highlight.comment?.text || undefined,
      imageDataUrl: highlight.content.image,
      tags: [],
    });
  }, [paper.id, activeColor, addAnnotation]);

  // Handle deleting highlight
  const handleDeleteHighlight = useCallback((highlightId: string) => {
    deleteAnnotation(highlightId);
    if (selectedAnnotationId === highlightId) {
      setSelectedAnnotationId(null);
    }
  }, [deleteAnnotation, selectedAnnotationId]);

  // Scroll to annotation when selected from sidebar
  const scrollToHighlight = useCallback((annotation: PDFAnnotation) => {
    setSelectedAnnotationId(annotation.id);
    const highlight = toHighlightFormat(annotation);
    scrollViewerTo.current(highlight);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900/90 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900/90 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {error || 'No PDF available'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You can add a PDF to this paper by uploading one or providing a URL.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex">
      {/* Main PDF Viewer */}
      <div className={`flex-1 flex flex-col ${showSidebar ? 'mr-80' : ''} transition-all`}>
        {/* Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
            >
              <X size={20} />
            </button>

            <h2 className="text-white font-medium truncate max-w-md">
              {paper.title}
            </h2>
          </div>

          {/* Tool buttons */}
          <div className="flex items-center gap-2">
            {/* Color picker */}
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
              {(Object.keys(COLOR_MAP) as AnnotationColor[]).map((color) => (
                <button
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    activeColor === color
                      ? 'border-white scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: COLOR_MAP[color] }}
                  title={color}
                />
              ))}
            </div>

            {/* Mode buttons */}
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setHighlightMode('highlight')}
                className={`p-2 rounded ${
                  highlightMode === 'highlight'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
                title="Highlight text"
              >
                <Highlighter size={18} />
              </button>
              <button
                onClick={() => setHighlightMode('area')}
                className={`p-2 rounded ${
                  highlightMode === 'area'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
                title="Area selection"
              >
                <Square size={18} />
              </button>
              <button
                onClick={() => setHighlightMode('note')}
                className={`p-2 rounded ${
                  highlightMode === 'note'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
                title="Add note"
              >
                <MessageSquare size={18} />
              </button>
            </div>

            {/* Toggle sidebar */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-2 rounded-lg ${
                showSidebar
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={showSidebar ? 'Hide annotations' : 'Show annotations'}
            >
              {showSidebar ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </div>

        {/* PDF Content - Container must be relative for absolute positioned PdfHighlighter */}
        <div
          className="flex-1 min-h-0 overflow-hidden"
          style={{ position: 'relative', width: '100%', height: '100%' }}
        >
          <PdfLoader url={pdfUrl} beforeLoad={<div className="text-white p-4">Loading PDF...</div>}>
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={() => highlightMode === 'area'}
                onScrollChange={() => {}}
                scrollRef={(scrollTo) => {
                  scrollViewerTo.current = scrollTo;
                }}
                onSelectionFinished={(
                  position,
                  content,
                  hideTipAndSelection
                ) => {
                  handleAddHighlight({
                    position,
                    content,
                    comment: { text: '', emoji: '' },
                  });
                  hideTipAndSelection();
                  return null;
                }}
                highlightTransform={(
                  highlight,
                  index,
                  setTip,
                  hideTip,
                  viewportToScaled,
                  screenshot,
                  isScrolledTo
                ) => {
                  const annotation = annotations.find(a => a.id === highlight.id);
                  const isAreaHighlight = highlight.content?.image;
                  const color = annotation?.color || 'yellow';

                  const component = isAreaHighlight ? (
                    <AreaHighlight
                      isScrolledTo={isScrolledTo}
                      highlight={highlight}
                      onChange={(boundingRect) => {
                        updateAnnotation(highlight.id, {
                          position: {
                            ...highlight.position,
                            boundingRect: {
                              ...viewportToScaled(boundingRect),
                              width: boundingRect.width,
                              height: boundingRect.height,
                            },
                          },
                          imageDataUrl: screenshot(boundingRect),
                        });
                      }}
                    />
                  ) : (
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                  );

                  return (
                    <Popup
                      popupContent={
                        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 max-w-xs">
                          {annotation?.comment && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              {annotation.comment}
                            </p>
                          )}
                          {annotation?.selectedText && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">
                              "{annotation.selectedText.substring(0, 100)}..."
                            </p>
                          )}
                          <button
                            onClick={() => handleDeleteHighlight(highlight.id)}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      }
                      onMouseOver={() => setTip(highlight, () => {})}
                      onMouseOut={hideTip}
                      key={index}
                    >
                      <div
                        style={{
                          background: COLOR_MAP[color],
                          opacity: selectedAnnotationId === highlight.id ? 0.8 : 0.4,
                        }}
                      >
                        {component}
                      </div>
                    </Popup>
                  );
                }}
                highlights={highlights}
              />
            )}
          </PdfLoader>
        </div>
      </div>

      {/* Annotation Sidebar */}
      {showSidebar && (
        <AnnotationSidebar
          paper={paper}
          annotations={annotations}
          selectedAnnotationId={selectedAnnotationId}
          onSelectAnnotation={scrollToHighlight}
          onDeleteAnnotation={handleDeleteHighlight}
          onUpdateAnnotation={updateAnnotation}
          colorMap={COLOR_MAP}
        />
      )}
    </div>
  );
}
