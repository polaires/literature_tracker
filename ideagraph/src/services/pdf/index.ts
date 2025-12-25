// PDF Services
// Export all PDF-related services

export {
  extractPDFText,
  extractPDFTextRange,
  estimateReadingTime,
  type ExtractedPage,
  type PDFExtractionResult,
} from './pdfTextExtractor';

export {
  detectSections,
  getSectionByType,
  getSectionsByTypes,
  getCombinedSectionContent,
  type SectionType,
  type DetectedSection,
  type SectionDetectionResult,
} from './pdfSectionDetector';
