// PDF Text Extraction Service
// Uses pdfjs-dist to extract text from PDF files

import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

// Ensure worker is initialized (uses same config as PDFViewer)
import '../../lib/pdfWorker';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  textItems: Array<{
    text: string;
    x: number;
    y: number;
    fontSize: number;
  }>;
}

export interface PDFExtractionResult {
  success: boolean;
  fullText: string;
  pages: ExtractedPage[];
  pageCount: number;
  wordCount: number;
  error?: string;
}

/**
 * Check if an item is a TextItem (has 'str' property)
 */
function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return 'str' in item;
}

/**
 * Extract text from a single PDF page
 */
async function extractPageText(
  pdfDocument: pdfjsLib.PDFDocumentProxy,
  pageNumber: number
): Promise<ExtractedPage> {
  const page = await pdfDocument.getPage(pageNumber);
  const textContent = await page.getTextContent();

  const textItems: ExtractedPage['textItems'] = [];
  let pageText = '';
  let lastY: number | null = null;

  for (const item of textContent.items) {
    if (isTextItem(item)) {
      const { str, transform } = item;
      const x = transform[4];
      const y = transform[5];
      const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);

      // Add newline if Y position changed significantly (new line)
      if (lastY !== null && Math.abs(y - lastY) > fontSize * 0.5) {
        pageText += '\n';
      } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
        pageText += ' ';
      }

      pageText += str;
      lastY = y;

      textItems.push({
        text: str,
        x,
        y,
        fontSize,
      });
    }
  }

  return {
    pageNumber,
    text: pageText.trim(),
    textItems,
  };
}

/**
 * Extract all text from a PDF file
 */
export async function extractPDFText(
  pdfData: ArrayBuffer
): Promise<PDFExtractionResult> {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;

    // Extract text from all pages
    const pages: ExtractedPage[] = [];
    const textParts: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await extractPageText(pdfDocument, i);
      pages.push(page);
      textParts.push(page.text);
    }

    const fullText = textParts.join('\n\n');
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;

    return {
      success: true,
      fullText,
      pages,
      pageCount,
      wordCount,
    };
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    return {
      success: false,
      fullText: '',
      pages: [],
      pageCount: 0,
      wordCount: 0,
      error: error instanceof Error ? error.message : 'Unknown extraction error',
    };
  }
}

/**
 * Extract text from specific page range
 */
export async function extractPDFTextRange(
  pdfData: ArrayBuffer,
  startPage: number,
  endPage: number
): Promise<PDFExtractionResult> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;

    // Clamp page range
    const start = Math.max(1, startPage);
    const end = Math.min(pageCount, endPage);

    const pages: ExtractedPage[] = [];
    const textParts: string[] = [];

    for (let i = start; i <= end; i++) {
      const page = await extractPageText(pdfDocument, i);
      pages.push(page);
      textParts.push(page.text);
    }

    const fullText = textParts.join('\n\n');
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;

    return {
      success: true,
      fullText,
      pages,
      pageCount,
      wordCount,
    };
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    return {
      success: false,
      fullText: '',
      pages: [],
      pageCount: 0,
      wordCount: 0,
      error: error instanceof Error ? error.message : 'Unknown extraction error',
    };
  }
}

/**
 * Get estimated reading time in minutes
 */
export function estimateReadingTime(wordCount: number): number {
  // Average reading speed: 200-250 words per minute for academic text
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}
