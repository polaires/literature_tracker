// Stage 1: Paper Classification Prompt
// Fast pass to determine paper type, structure, and extraction strategy

import type {
  PaperExtractionContext,
} from './types';
import {
  isValidPaperType,
  isValidStructureQuality,
  isValidDataRichness,
  isValidExtractionDepth,
  clampConfidence,
} from './types';
import type { PaperClassification } from '../../../../types/paperGraph';

// =============================================================================
// System Prompt
// =============================================================================

export const CLASSIFICATION_SYSTEM_PROMPT = `You are an expert academic librarian analyzing scientific papers. Your task is to quickly classify a paper to determine the best extraction strategy.

Analyze the paper's type, structure quality, and content richness to provide extraction hints.

Paper Types:
- research-article: Empirical research with IMRaD structure (Introduction, Methods, Results, Discussion)
- review: Synthesis of existing literature, systematic reviews
- methods: Focus on protocols, techniques, or tools
- short-communication: Brief reports, letters, short findings
- meta-analysis: Statistical combination of multiple study results
- case-study: Detailed examination of specific instances
- theoretical: Conceptual frameworks, mathematical models

Structure Quality:
- well-structured: Clear sections (Abstract, Introduction, Methods, Results, Discussion, Conclusion)
- semi-structured: Some sections present but not fully organized
- unstructured: Minimal clear sectioning, continuous text

Data Richness:
- data-heavy: Many tables, figures, quantitative results
- narrative-heavy: Mostly text, qualitative discussion
- balanced: Mix of data and narrative

Be concise and accurate. Focus on enabling effective downstream extraction.`;

// =============================================================================
// Prompt Builder
// =============================================================================

export function buildClassificationPrompt(context: PaperExtractionContext): string {
  const { paper, pageCount, wordCount } = context;

  // Use first ~2000 words for classification (faster, sufficient for classification)
  const textSample = paper.pdfText.slice(0, 8000);

  return `PAPER METADATA:
Title: ${paper.title}
Authors: ${paper.authors}
Year: ${paper.year || 'Unknown'}
Journal: ${paper.journal || 'Unknown'}

ABSTRACT:
${paper.abstract || 'No abstract available'}

DOCUMENT INFO:
- Approximate pages: ${pageCount || 'Unknown'}
- Approximate words: ${wordCount || 'Unknown'}

TEXT SAMPLE (first portion):
${textSample}

---

Analyze this paper and provide classification for extraction strategy.

Return JSON:
{
  "paperType": "research-article" | "review" | "methods" | "short-communication" | "meta-analysis" | "case-study" | "theoretical",
  "structureQuality": "well-structured" | "semi-structured" | "unstructured",
  "dataRichness": "data-heavy" | "narrative-heavy" | "balanced",
  "confidence": 0.0-1.0,

  "flags": {
    "poorOCR": true/false,       // Text has garbled characters, formatting issues
    "missingSections": true/false,  // Key sections appear missing
    "veryShort": true/false,     // Less than ~1500 words
    "veryLong": true/false       // More than ~30 pages
  },

  "extractionHints": {
    "prioritySections": ["Results", "Discussion", ...],  // Sections to focus on
    "expectedFindingCount": 3-10,  // Estimated number of key findings
    "suggestedDepth": "quick" | "standard" | "deep"
  }
}`;
}

// =============================================================================
// Response Parser
// =============================================================================

export function parseClassificationResponse(
  response: Record<string, unknown>
): PaperClassification {
  // Parse paper type with validation
  const paperType = isValidPaperType(response.paperType)
    ? response.paperType
    : 'research-article';

  // Parse structure quality
  const structureQuality = isValidStructureQuality(response.structureQuality)
    ? response.structureQuality
    : 'semi-structured';

  // Parse data richness
  const dataRichness = isValidDataRichness(response.dataRichness)
    ? response.dataRichness
    : 'balanced';

  // Parse flags
  const rawFlags = response.flags as Record<string, unknown> | undefined;
  const flags = {
    poorOCR: rawFlags?.poorOCR === true,
    missingSections: rawFlags?.missingSections === true,
    veryShort: rawFlags?.veryShort === true,
    veryLong: rawFlags?.veryLong === true,
  };

  // Parse extraction hints
  const rawHints = response.extractionHints as Record<string, unknown> | undefined;
  const extractionHints = {
    prioritySections: Array.isArray(rawHints?.prioritySections)
      ? (rawHints.prioritySections as unknown[]).map(String).slice(0, 6)
      : getDefaultPrioritySections(paperType),
    expectedFindingCount: typeof rawHints?.expectedFindingCount === 'number'
      ? Math.max(1, Math.min(20, Math.round(rawHints.expectedFindingCount)))
      : getDefaultFindingCount(paperType),
    suggestedDepth: isValidExtractionDepth(rawHints?.suggestedDepth)
      ? rawHints.suggestedDepth
      : getSuggestedDepth(flags),
  };

  return {
    paperType,
    structureQuality,
    dataRichness,
    confidence: clampConfidence(response.confidence),
    flags,
    extractionHints,
  };
}

// =============================================================================
// Default Values
// =============================================================================

function getDefaultPrioritySections(paperType: string): string[] {
  switch (paperType) {
    case 'research-article':
      return ['Abstract', 'Results', 'Discussion', 'Conclusion'];
    case 'review':
      return ['Abstract', 'Introduction', 'Discussion', 'Conclusion'];
    case 'methods':
      return ['Abstract', 'Methods', 'Protocol', 'Validation'];
    case 'short-communication':
      return ['Abstract', 'Results', 'Discussion'];
    case 'meta-analysis':
      return ['Abstract', 'Results', 'Forest Plot', 'Discussion'];
    case 'case-study':
      return ['Abstract', 'Case Description', 'Analysis', 'Discussion'];
    case 'theoretical':
      return ['Abstract', 'Framework', 'Model', 'Discussion'];
    default:
      return ['Abstract', 'Results', 'Discussion', 'Conclusion'];
  }
}

function getDefaultFindingCount(paperType: string): number {
  switch (paperType) {
    case 'short-communication': return 2;
    case 'review': return 8;
    case 'meta-analysis': return 6;
    case 'research-article': return 5;
    case 'methods': return 4;
    case 'case-study': return 4;
    case 'theoretical': return 5;
    default: return 5;
  }
}

function getSuggestedDepth(flags: { veryShort: boolean; veryLong: boolean }): 'quick' | 'standard' | 'deep' {
  if (flags.veryShort) return 'quick';
  if (flags.veryLong) return 'deep';
  return 'standard';
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Estimate page count from text
 */
export function estimatePageCount(text: string): number {
  // Rough estimate: ~500 words per page, ~5 chars per word
  const charCount = text.length;
  const wordEstimate = charCount / 5;
  return Math.ceil(wordEstimate / 500);
}

/**
 * Estimate word count from text
 */
export function estimateWordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Check if text appears to have OCR issues
 */
export function detectOCRIssues(text: string): boolean {
  // Check for common OCR artifacts
  const artifacts = [
    /[^\x00-\x7F]{3,}/g,  // Multiple non-ASCII chars in sequence
    /\d[A-Za-z]\d[A-Za-z]/g,  // Alternating digits and letters (common OCR error)
    /[|l1][|l1][|l1]/g,  // Common l/1/| confusion
    /\b[A-Z]{10,}\b/g,  // Long runs of capitals
  ];

  let issueCount = 0;
  for (const pattern of artifacts) {
    const matches = text.match(pattern);
    if (matches && matches.length > 5) {
      issueCount += matches.length;
    }
  }

  // If more than 20 potential OCR issues in the text, flag it
  return issueCount > 20;
}
