// ============================================
// PAPER IDEAGRAPH TYPES
// Structured knowledge graph extraction from academic papers
// ============================================

// ============================================
// PAPER TYPE CLASSIFICATION
// ============================================

export type PaperType =
  | 'research-article'    // Primary: IMRaD structure, empirical findings
  | 'review'              // Primary: Synthesis/meta-review of existing work
  | 'methods'             // Secondary: Protocol/technique focus
  | 'short-communication' // Secondary: Brief report, letter
  | 'meta-analysis'       // Statistical pooling of multiple studies
  | 'case-study'          // Specific instance analysis
  | 'theoretical';        // Framework/model development

export type PaperStructureQuality = 'well-structured' | 'semi-structured' | 'unstructured';
export type DataRichness = 'data-heavy' | 'narrative-heavy' | 'balanced';

// ============================================
// EXTRACTION METADATA
// ============================================

export type ExtractionDepth = 'quick' | 'standard' | 'deep';
export type ExtractionStatus = 'pending' | 'extracting' | 'completed' | 'failed';
export type ReviewStatus = 'unreviewed' | 'partial' | 'reviewed';

// ============================================
// FINDING TYPES
// ============================================

export type FindingType =
  | 'central-finding'      // The main result/contribution
  | 'supporting-finding'   // Secondary results that support central
  | 'methodological'       // Key methodological insight
  | 'limitation'           // Acknowledged limitations
  | 'implication'          // Stated implications
  | 'open-question'        // Questions raised
  | 'background';          // Context/setup findings

// ============================================
// CONNECTION TYPES (INTRA-PAPER)
// ============================================

export type IntraPaperConnectionType =
  | 'supports'     // Finding A supports Finding B
  | 'contradicts'  // Findings are in tension
  | 'extends'      // Finding A builds on Finding B
  | 'requires'     // Finding A depends on Finding B
  | 'explains'     // Finding A explains why Finding B occurs
  | 'qualifies';   // Finding A adds nuance to Finding B

// ============================================
// QUOTE REFERENCE
// ============================================

export interface QuoteReference {
  id: string;
  text: string;                     // Exact quote from paper
  pageNumber: number | null;        // Page number if available
  pageLabel: string | null;         // "p. 5" or "pp. 5-6"
  approximatePosition?: 'early' | 'middle' | 'late'; // Position in paper
  sectionName?: string;             // Section where quote appears
  annotationId?: string;            // Link to PDF annotation if exists
}

// ============================================
// EXTRACTED FINDING
// ============================================

export interface ExtractedFinding {
  id: string;
  paperId: string;

  // Content
  title: string;                    // Short label (3-10 words)
  description: string;              // Full description (1-3 sentences)
  findingType: FindingType;

  // Evidence grounding
  pageNumbers: number[];
  sectionName?: string;
  directQuotes: QuoteReference[];

  // Thesis relevance (populated in Stage 3)
  thesisRelevance?: {
    score: 1 | 2 | 3 | 4 | 5;       // 1-5 stars
    dimension: string;              // Which aspect of thesis
    reasoning: string;              // Why this score
  };

  // AI confidence + user verification
  confidence: number;               // 0.0-1.0
  userVerified: boolean;
  userEdited: boolean;

  // Ordering
  order: number;                    // Display order
}

// ============================================
// EXTRACTED DATA TABLE
// ============================================

export interface ExtractedDataTable {
  id: string;
  paperId: string;

  // Identification
  name: string;                     // "Table I: Ln(III) Binding Affinities"
  description: string;              // What the table shows
  pageReference: string | null;     // "p. 4994"

  // Structure (AI-extracted from text)
  columns: Array<{
    id: string;
    name: string;                   // "Lanthanide", "K_d ratio"
    unit?: string;                  // "uM", "fold-change"
  }>;
  rows: Array<{
    id: string;
    label: string;                  // "Nd", "Pr", "Ce"
    values: Record<string, string>; // columnId -> value
  }>;

  // Quality
  extractionConfidence: number;     // AI confidence in structure
  userVerified: boolean;
  userEdited: boolean;

  // Linking
  linkedFindingIds: string[];       // Findings this table supports
}

// ============================================
// INTRA-PAPER CONNECTION
// ============================================

export interface IntraPaperConnection {
  id: string;
  fromFindingId: string;
  toFindingId: string;
  connectionType: IntraPaperConnectionType;
  explanation: string;
  isExplicit: boolean;              // Did authors explicitly state this connection?
}

// ============================================
// POTENTIAL CROSS-PAPER CONNECTION
// ============================================

export interface PotentialCrossPaperConnection {
  id: string;
  findingId: string;
  suggestedConnectionType: 'supports' | 'contradicts' | 'extends' | 'uses-method' | 'same-topic';
  targetDescription: string;        // "Papers studying k_on variation"
  keywords: string[];               // For matching with other papers
  reasoning: string;                // Why this connection might exist
}

// ============================================
// REVIEW PAPER SPECIFIC EXTRACTION
// ============================================

// Align with GapType in types/index.ts
export type GapTypeExtracted =
  | 'knowledge'          // Missing empirical evidence
  | 'methodological'     // Missing methodology/approach
  | 'population'         // Understudied population/system
  | 'theoretical'        // Missing framework/theory
  | 'temporal'           // Outdated research
  | 'geographic'         // Geographic limitation
  | 'contradictory';     // Conflicting findings need resolution

export interface ReviewPaperExtraction {
  // Synthesis themes identified in the review
  synthesisThemes: Array<{
    id: string;
    theme: string;                  // Theme name/description
    papersCited: string[];          // Papers grouped under this theme (titles or refs)
    consensus: string | null;       // What papers agree on
    disagreement: string | null;    // Where papers disagree
  }>;

  // Gaps explicitly identified in the review
  identifiedGaps: Array<{
    id: string;
    gap: string;                    // Description of gap
    gapType: GapTypeExtracted;
    pageReference: string | null;
    explicitOrInferred: 'explicit' | 'inferred';
  }>;

  // Future directions mentioned
  futureDirections: string[];

  // Chronological trends (if review covers history)
  chronologicalTrends?: Array<{
    period: string;                 // "1990s", "2010-2015"
    characterization: string;       // What characterized this period
  }>;
}

// ============================================
// PAPER CLASSIFICATION RESULT (Stage 1)
// ============================================

export interface PaperClassification {
  paperType: PaperType;
  structureQuality: PaperStructureQuality;
  dataRichness: DataRichness;
  confidence: number;               // 0.0-1.0

  // Quality flags
  flags: {
    poorOCR: boolean;
    missingSections: boolean;
    veryShort: boolean;             // <1500 words
    veryLong: boolean;              // >30 pages
  };

  // Extraction hints
  extractionHints: {
    prioritySections: string[];     // Sections to focus on
    expectedFindingCount: number;   // Estimated number of findings
    suggestedDepth: ExtractionDepth;
  };
}

// ============================================
// PAPER IDEAGRAPH (Main Entity)
// ============================================

export interface PaperIdeaGraph {
  id: string;
  paperId: string;

  // Extraction metadata
  extractedAt: string;              // ISO date
  extractionDepth: ExtractionDepth;
  extractionStatus: ExtractionStatus;
  extractionError?: string;         // Error message if failed

  // Stage 1: Classification
  classification?: PaperClassification;

  // Stage 2: Core extraction
  findings: ExtractedFinding[];
  intraPaperConnections: IntraPaperConnection[];
  dataTables: ExtractedDataTable[];

  // Summary metadata
  paperType: PaperType;
  experimentalSystem?: string;      // e.g., "HeLa cells", "E. coli", "mice"
  keyContributions: string[];       // 1-3 main contributions
  limitations: string[];            // Acknowledged limitations
  openQuestions: string[];          // Questions raised by paper

  // Review paper specific (only populated for review papers)
  reviewExtraction?: ReviewPaperExtraction;

  // Stage 3: Cross-paper hints
  potentialConnections: PotentialCrossPaperConnection[];

  // Thesis relevance (from Stage 3)
  thesisRelevance?: {
    overallScore: 1 | 2 | 3 | 4 | 5;
    suggestedRole: 'supports' | 'contradicts' | 'method' | 'background' | 'other';
    roleConfidence: number;
    reasoning: string;
    thesisFramedTakeaway: string;   // Takeaway framed for this thesis
    alternativeTakeaways: string[];
  };

  // User review state (auto-save with review flag)
  reviewStatus: ReviewStatus;
  reviewedAt?: string;
  reviewNotes?: string;

  // Token usage tracking
  tokensUsed: {
    stage1: { input: number; output: number };
    stage2: { input: number; output: number };
    stage3: { input: number; output: number };
  };
}

// ============================================
// EXTRACTION PROGRESS
// ============================================

export interface ExtractionProgress {
  paperId: string;
  currentStage: 1 | 2 | 3;
  stageDescription: string;
  overallProgress: number;          // 0-100
  currentChunk?: number;            // For long papers
  totalChunks?: number;
  canCancel: boolean;
}

// ============================================
// HELPER TYPE GUARDS
// ============================================

export function isPaperIdeaGraph(obj: unknown): obj is PaperIdeaGraph {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'paperId' in obj &&
    'findings' in obj &&
    Array.isArray((obj as PaperIdeaGraph).findings)
  );
}

export function isExtractedFinding(obj: unknown): obj is ExtractedFinding {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'paperId' in obj &&
    'title' in obj &&
    'findingType' in obj
  );
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createEmptyPaperIdeaGraph(paperId: string): PaperIdeaGraph {
  const now = new Date().toISOString();
  return {
    id: `graph-${paperId}-${Date.now()}`,
    paperId,
    extractedAt: now,
    extractionDepth: 'standard',
    extractionStatus: 'pending',
    findings: [],
    intraPaperConnections: [],
    dataTables: [],
    paperType: 'research-article',
    keyContributions: [],
    limitations: [],
    openQuestions: [],
    potentialConnections: [],
    reviewStatus: 'unreviewed',
    tokensUsed: {
      stage1: { input: 0, output: 0 },
      stage2: { input: 0, output: 0 },
      stage3: { input: 0, output: 0 },
    },
  };
}

export function createQuoteReference(
  text: string,
  pageNumber?: number,
  sectionName?: string
): QuoteReference {
  return {
    id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text,
    pageNumber: pageNumber ?? null,
    pageLabel: pageNumber ? `p. ${pageNumber}` : null,
    sectionName,
  };
}

export function createExtractedFinding(
  paperId: string,
  title: string,
  description: string,
  findingType: FindingType,
  confidence: number
): ExtractedFinding {
  return {
    id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    paperId,
    title,
    description,
    findingType,
    pageNumbers: [],
    directQuotes: [],
    confidence,
    userVerified: false,
    userEdited: false,
    order: 0,
  };
}

// ============================================
// CONFIDENCE THRESHOLDS
// ============================================

export const CONFIDENCE_THRESHOLDS = {
  LOW: 0.4,         // Warn user, extraction may be unreliable
  MEDIUM: 0.7,      // Show suggestions, require review
  HIGH: 0.85,       // High-confidence badge
} as const;

export function getConfidenceLevel(confidence: number): 'low' | 'medium' | 'high' {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

export function getConfidenceColor(confidence: number): string {
  const level = getConfidenceLevel(confidence);
  switch (level) {
    case 'high': return 'text-green-600';
    case 'medium': return 'text-amber-600';
    case 'low': return 'text-red-600';
  }
}
