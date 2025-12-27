// IdeaGraph Extraction - Types for AI prompts and responses
// These types define the structure of AI interactions for paper analysis

import type {
  PaperType,
  PaperStructureQuality,
  DataRichness,
  FindingType,
  ExtractionDepth,
} from '../../../../types/paperGraph';

// =============================================================================
// Stage 1: Classification Response Types
// =============================================================================

export interface ClassificationResponse {
  paperType: PaperType;
  structureQuality: PaperStructureQuality;
  dataRichness: DataRichness;
  confidence: number;

  flags: {
    poorOCR: boolean;
    missingSections: boolean;
    veryShort: boolean;
    veryLong: boolean;
  };

  extractionHints: {
    prioritySections: string[];
    expectedFindingCount: number;
    suggestedDepth: ExtractionDepth;
  };
}

// =============================================================================
// Stage 2: Extraction Response Types
// =============================================================================

export interface ExtractedFindingRaw {
  title: string;
  description: string;
  findingType: FindingType;
  pageNumbers: number[];
  sectionName?: string;
  directQuotes: Array<{
    text: string;
    pageNumber?: number;
    approximatePosition?: 'early' | 'middle' | 'late';
  }>;
  confidence: number;
}

export interface ExtractedDataTableRaw {
  name: string;
  description: string;
  pageReference: string | null;
  columns: Array<{
    name: string;
    unit?: string;
  }>;
  rows: Array<{
    label: string;
    values: Record<string, string>;
  }>;
  linkedFindingIndices: number[]; // References to findings by index
  confidence: number;
}

export interface IntraPaperConnectionRaw {
  fromFindingIndex: number;
  toFindingIndex: number;
  connectionType: 'supports' | 'contradicts' | 'extends' | 'requires' | 'explains' | 'qualifies';
  explanation: string;
  isExplicit: boolean;
}

export interface PotentialCrossConnectionRaw {
  findingIndex: number;
  suggestedConnectionType: 'supports' | 'contradicts' | 'extends' | 'uses-method' | 'same-topic';
  targetDescription: string;
  keywords: string[];
  reasoning: string;
}

export interface ExtractionResponse {
  // Core extraction
  findings: ExtractedFindingRaw[];
  dataTables: ExtractedDataTableRaw[];
  intraPaperConnections: IntraPaperConnectionRaw[];

  // Summary metadata
  experimentalSystem?: string;
  keyContributions: string[];
  limitations: string[];
  openQuestions: string[];

  // Cross-paper hints
  potentialConnections: PotentialCrossConnectionRaw[];
}

// =============================================================================
// Stage 2 (Review Paper Variant): Review-specific extraction
// =============================================================================

// Aligned with GapTypeExtracted in types/paperGraph.ts
export type GapTypeExtracted =
  | 'knowledge'
  | 'methodological'
  | 'population'
  | 'theoretical'
  | 'temporal'
  | 'geographic'
  | 'contradictory';

export interface ReviewExtractionResponse extends ExtractionResponse {
  reviewSpecific: {
    synthesisThemes: Array<{
      theme: string;
      papersCited: string[];
      consensus: string | null;
      disagreement: string | null;
    }>;
    identifiedGaps: Array<{
      gap: string;
      gapType: GapTypeExtracted;
      pageReference: string | null;
      explicitOrInferred: 'explicit' | 'inferred';
    }>;
    futureDirections: string[];
    chronologicalTrends?: Array<{
      period: string;
      characterization: string;
    }>;
  };
}

// =============================================================================
// Stage 3: Thesis Integration Response Types
// =============================================================================

export interface ThesisIntegrationResponse {
  overallRelevance: {
    score: 1 | 2 | 3 | 4 | 5;
    reasoning: string;
  };

  suggestedRole: {
    role: 'supports' | 'contradicts' | 'method' | 'background' | 'other';
    confidence: number;
    reasoning: string;
  };

  thesisFramedTakeaway: string;
  alternativeTakeaways: string[];

  // Finding-level relevance (references findings by index)
  findingRelevance: Array<{
    findingIndex: number;
    relevanceScore: 1 | 2 | 3 | 4 | 5;
    thesisDimension: string;
    reasoning: string;
  }>;

  // Suggested connections to existing papers
  crossPaperConnections: Array<{
    existingPaperId: string;
    connectionType: 'supports' | 'contradicts' | 'extends' | 'uses-method' | 'same-topic';
    reasoning: string;
    confidence: number;
  }>;

  // Gaps addressed or revealed
  gapsAddressed: string[];
  newGapsRevealed: string[];
}

// =============================================================================
// Context Types for Prompts
// =============================================================================

export interface PaperExtractionContext {
  paper: {
    title: string;
    authors: string;
    year: number | null;
    journal: string | null;
    abstract: string | null;
    pdfText: string;
  };
  pageCount?: number;
  wordCount?: number;
}

export interface ThesisIntegrationContext {
  thesis: {
    id: string;
    title: string;
    description: string;
  };
  existingPapers: Array<{
    id: string;
    title: string;
    takeaway: string;
    thesisRole: string;
    year: number | null;
  }>;
  extractedFindings: ExtractedFindingRaw[];
}

// =============================================================================
// Validation Helpers
// =============================================================================

export function isValidPaperType(value: unknown): value is PaperType {
  const validTypes: PaperType[] = [
    'research-article', 'review', 'methods', 'short-communication',
    'meta-analysis', 'case-study', 'theoretical'
  ];
  return typeof value === 'string' && validTypes.includes(value as PaperType);
}

export function isValidFindingType(value: unknown): value is FindingType {
  const validTypes: FindingType[] = [
    'central-finding', 'supporting-finding', 'methodological',
    'limitation', 'implication', 'open-question', 'background'
  ];
  return typeof value === 'string' && validTypes.includes(value as FindingType);
}

export function isValidStructureQuality(value: unknown): value is PaperStructureQuality {
  return value === 'well-structured' || value === 'semi-structured' || value === 'unstructured';
}

export function isValidDataRichness(value: unknown): value is DataRichness {
  return value === 'data-heavy' || value === 'narrative-heavy' || value === 'balanced';
}

export function isValidExtractionDepth(value: unknown): value is ExtractionDepth {
  return value === 'quick' || value === 'standard' || value === 'deep';
}

export function clampConfidence(value: unknown): number {
  if (typeof value !== 'number') return 0.5;
  return Math.max(0, Math.min(1, value));
}

export function clampRelevanceScore(value: unknown): 1 | 2 | 3 | 4 | 5 {
  if (typeof value !== 'number') return 3;
  const clamped = Math.max(1, Math.min(5, Math.round(value)));
  return clamped as 1 | 2 | 3 | 4 | 5;
}

// =============================================================================
// Gap Type Validators
// =============================================================================

export const VALID_GAP_TYPES: GapTypeExtracted[] = [
  'knowledge', 'methodological', 'population', 'theoretical',
  'temporal', 'geographic', 'contradictory'
];

export function isValidGapType(value: unknown): value is GapTypeExtracted {
  return typeof value === 'string' && VALID_GAP_TYPES.includes(value as GapTypeExtracted);
}

export function validateGapType(value: unknown, defaultValue: GapTypeExtracted = 'knowledge'): GapTypeExtracted {
  return isValidGapType(value) ? value : defaultValue;
}

// =============================================================================
// Connection Type Validators
// =============================================================================

export type IntraPaperConnectionType = 'supports' | 'contradicts' | 'extends' | 'requires' | 'explains' | 'qualifies';
export type CrossPaperConnectionType = 'supports' | 'contradicts' | 'extends' | 'uses-method' | 'same-topic';

export const VALID_INTRA_CONNECTION_TYPES: IntraPaperConnectionType[] = [
  'supports', 'contradicts', 'extends', 'requires', 'explains', 'qualifies'
];

export const VALID_CROSS_CONNECTION_TYPES: CrossPaperConnectionType[] = [
  'supports', 'contradicts', 'extends', 'uses-method', 'same-topic'
];

export function isValidIntraConnectionType(value: unknown): value is IntraPaperConnectionType {
  return typeof value === 'string' && VALID_INTRA_CONNECTION_TYPES.includes(value as IntraPaperConnectionType);
}

export function isValidCrossConnectionType(value: unknown): value is CrossPaperConnectionType {
  return typeof value === 'string' && VALID_CROSS_CONNECTION_TYPES.includes(value as CrossPaperConnectionType);
}

// =============================================================================
// Extraction Limits (for consistent validation)
// =============================================================================

export const EXTRACTION_LIMITS = {
  MAX_FINDINGS: 15,
  MAX_TABLES: 10,
  MAX_CONNECTIONS: 20,
  MAX_QUOTES_PER_FINDING: 5,
  MAX_GAP_TYPES: 10,
  MAX_THEMES: 10,
  MAX_FUTURE_DIRECTIONS: 10,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_QUOTE_LENGTH: 500,
} as const;
