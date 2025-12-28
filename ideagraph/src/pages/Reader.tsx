// Standalone PDF Reader Page
// Upload and read PDFs with AI assistance before adding to thesis

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { extractPDFText, estimateReadingTime } from '../services/pdf';
import { pdfStorage } from '../services/pdfStorage';
import { StandaloneReader } from '../components/reader/StandaloneReader';
import type { Thesis } from '../types';

// Special ID for storing temporary reader session PDFs
const READER_SESSION_ID = '__reader-session__';

interface UploadedPDF {
  id: string;
  filename: string;
  fileSize: number;
  pdfData: ArrayBuffer;
  extractedText?: string;
  readingTime?: number;
}

export function Reader() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Get all theses first, then filter with useMemo to avoid creating new arrays on each render
  const allTheses = useAppStore((state) => state.theses);
  const theses = useMemo(() => allTheses.filter(t => !t.isArchived), [allTheses]);

  // State
  const [uploadedPDF, setUploadedPDF] = useState<UploadedPDF | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null);

  // Restore PDF from IndexedDB on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = await pdfStorage.getPDFByPaperId(READER_SESSION_ID);
        if (stored) {
          // Make copies to avoid issues with transferred ArrayBuffer
          // One for text extraction, one for the PDF viewer
          const pdfDataForExtraction = stored.data.slice(0);
          const pdfDataForViewer = stored.data.slice(0);

          // Extract text for AI and reading time estimation
          const extraction = await extractPDFText(pdfDataForExtraction);
          const readingTime = extraction.success
            ? estimateReadingTime(extraction.wordCount)
            : undefined;

          setUploadedPDF({
            // Use READER_SESSION_ID so AIAssistantPanel can find the PDF
            id: READER_SESSION_ID,
            filename: stored.filename,
            fileSize: stored.fileSize,
            pdfData: pdfDataForViewer,
            extractedText: extraction.success ? extraction.fullText : undefined,
            readingTime,
          });
        }
      } catch (err) {
        console.error('Failed to restore PDF session:', err);
      } finally {
        setIsRestoring(false);
      }
    }

    restoreSession();
  }, []);

  // Pre-select thesis from URL query param
  useEffect(() => {
    const thesisId = searchParams.get('thesis');
    if (thesisId && !selectedThesis) {
      const thesis = theses.find(t => t.id === thesisId);
      if (thesis) {
        setSelectedThesis(thesis);
      }
    }
  }, [searchParams, theses, selectedThesis]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.includes('pdf')) {
      setUploadError('Please upload a PDF file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setUploadError('File size must be less than 50MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const pdfData = await file.arrayBuffer();

      // Make a copy of the ArrayBuffer for text extraction since pdfjs may transfer it
      const pdfDataCopy = pdfData.slice(0);

      // Extract text for AI and reading time estimation
      const extraction = await extractPDFText(pdfDataCopy);
      const readingTime = extraction.success
        ? estimateReadingTime(extraction.wordCount)
        : undefined;

      // Store in IndexedDB for persistence across refreshes
      // First clear any existing session PDF
      await pdfStorage.deletePDFsByPaperId(READER_SESSION_ID);
      // Store the new PDF with READER_SESSION_ID as paperId
      await pdfStorage.storePDF(READER_SESSION_ID, file);

      setUploadedPDF({
        // Use READER_SESSION_ID so AIAssistantPanel can find the PDF
        id: READER_SESSION_ID,
        filename: file.name,
        fileSize: file.size,
        pdfData,
        extractedText: extraction.success ? extraction.fullText : undefined,
        readingTime,
      });
    } catch (err) {
      console.error('Failed to process PDF:', err);
      setUploadError('Failed to process PDF file');
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  // Handle drop zone
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Clear uploaded PDF
  const handleClearPDF = useCallback(async () => {
    // Delete from IndexedDB
    await pdfStorage.deletePDFsByPaperId(READER_SESSION_ID);

    setUploadedPDF(null);
    setSelectedThesis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Show loading while restoring from IndexedDB
  if (isRestoring) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-stone-600 animate-spin" />
          <p className="text-stone-500 dark:text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If a PDF is uploaded, show the reader
  if (uploadedPDF) {
    return (
      <StandaloneReader
        pdf={uploadedPDF}
        selectedThesis={selectedThesis}
        theses={theses}
        onSelectThesis={setSelectedThesis}
        onDiscard={handleClearPDF}
        onBack={() => navigate(-1)}
      />
    );
  }

  // Upload screen
  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-slate-900">
      {/* Header */}
      <header className="bg-[#FDFBF7] dark:bg-slate-800 border-b border-stone-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-stone-500 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-stone-800 dark:text-white">
              PDF Reader
            </h1>
            <p className="text-sm text-stone-500 dark:text-slate-400">
              Upload a PDF to read with AI assistance
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-stone-300 dark:border-slate-600 rounded-xl p-12 text-center hover:border-stone-400 dark:hover:border-stone-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-stone-600 animate-spin mb-4" />
              <p className="text-stone-600 dark:text-slate-400">Processing PDF...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-stone-400 dark:text-slate-500 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-stone-700 dark:text-slate-300 mb-2">
                Drop PDF here or click to upload
              </h2>
              <p className="text-sm text-stone-500 dark:text-slate-400 mb-4">
                PDF files up to 50MB
              </p>
              <button className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg font-medium transition-colors">
                Choose File
              </button>
            </>
          )}

          {uploadError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              {uploadError}
            </p>
          )}
        </div>

        {/* Recent papers hint */}
        {theses.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-stone-500 dark:text-slate-400 mb-3">
              Or open a paper from your theses
            </h3>
            <div className="grid gap-2">
              {theses.slice(0, 3).map((thesis) => (
                <button
                  key={thesis.id}
                  onClick={() => navigate(`/thesis/${thesis.id}`)}
                  className="flex items-center gap-3 p-3 bg-[#FDFBF7] dark:bg-slate-800 rounded-lg border border-stone-200 dark:border-slate-700 hover:border-stone-300 dark:hover:border-stone-600 transition-colors text-left overflow-hidden"
                  title={thesis.title}
                >
                  <FileText className="w-5 h-5 text-stone-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium text-stone-700 dark:text-slate-300 truncate">
                      {thesis.title}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-slate-400">
                      {thesis.paperIds.length} papers
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
