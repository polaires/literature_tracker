// ============================================
// CORE TYPES
// ============================================

export type ThesisRole =
  | 'supports'      // Provides evidence for thesis
  | 'contradicts'   // Argues against thesis
  | 'method'        // Provides methodology
  | 'background'    // General context
  | 'other';        // Uncategorized

export type ConnectionType =
  | 'supports'      // Paper B supports Paper A's claims
  | 'contradicts'   // Papers disagree
  | 'extends'       // Paper B builds on Paper A
  | 'uses-method'   // Methodological dependency
  | 'same-topic'    // Topically related
  | 'reviews'       // Review relationship
  | 'replicates'    // Replication study
  | 'critiques';    // Critical commentary

export type ReadingStatus =
  | 'screening'     // In screening queue (new!)
  | 'to-read'       // Added but not read
  | 'reading'       // Currently reading
  | 'read'          // Finished reading
  | 'to-revisit';   // Need to re-read

// Screening decision for PRISMA workflow
export type ScreeningDecision =
  | 'pending'       // Not yet screened
  | 'include'       // Include in review
  | 'exclude'       // Exclude from review
  | 'maybe';        // Uncertain, revisit later

// Exclusion reasons for documentation
export type ExclusionReason =
  | 'not-relevant'      // Topic doesn't match
  | 'wrong-study-type'  // Not the right type of study
  | 'duplicate'         // Already have this paper
  | 'no-full-text'      // Can't access full text
  | 'wrong-population'  // Wrong population/sample
  | 'wrong-outcome'     // Wrong outcome measure
  | 'low-quality'       // Quality doesn't meet criteria
  | 'language'          // Not in acceptable language
  | 'date-range'        // Outside date range
  | 'other';            // Other reason

// ============================================
// THESIS
// ============================================

export interface Thesis {
  id: string;                    // UUID
  title: string;                 // Research question/hypothesis
  description: string;           // Longer explanation
  createdAt: string;             // ISO date
  updatedAt: string;             // ISO date
  isArchived: boolean;           // Soft delete
  paperIds: string[];            // References to papers
  connectionIds: string[];       // References to connections
}

// ============================================
// PAPER
// ============================================

export interface Author {
  name: string;
  orcid?: string;
}

export interface Argument {
  id: string;
  claim: string;                 // The claim being made
  strength: 'strong' | 'moderate' | 'weak' | null;
  yourAssessment: 'agree' | 'disagree' | 'uncertain' | null;
}

export interface Evidence {
  id: string;
  description: string;           // What the evidence is
  type: 'experimental' | 'computational' | 'theoretical' | 'meta-analysis' | 'other';
  linkedArgumentId: string | null;  // Which argument it supports
}

export interface Paper {
  id: string;                    // UUID
  thesisId: string;              // Parent thesis

  // Metadata (auto-fetched)
  doi: string | null;
  title: string;
  authors: Author[];
  year: number | null;
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  abstract: string | null;
  url: string | null;
  pdfUrl: string | null;
  citationCount: number | null;

  // User synthesis (THE CORE VALUE)
  takeaway: string;              // REQUIRED - one sentence insight
  arguments: Argument[];         // Claims the paper makes
  evidence: Evidence[];          // Supporting evidence
  assessment: string | null;     // Your critical evaluation

  // Organization
  thesisRole: ThesisRole;
  readingStatus: ReadingStatus;
  tags: string[];

  // Timestamps
  addedAt: string;               // When added to system
  readAt: string | null;         // When marked as read
  lastAccessedAt: string;        // For "forgotten papers" feature

  // Source tracking
  source: 'doi' | 'url' | 'bibtex' | 'zotero' | 'manual' | 'search';
  rawBibtex: string | null;      // Original if imported

  // Screening workflow (Phase 2.5)
  screeningDecision: ScreeningDecision;
  exclusionReason: ExclusionReason | null;
  exclusionNote: string | null;  // Custom reason if 'other'
  screenedAt: string | null;     // When screening decision was made
  semanticScholarId: string | null; // For citation network exploration
}

// ============================================
// CONNECTION
// ============================================

export interface Connection {
  id: string;
  thesisId: string;              // Parent thesis
  fromPaperId: string;           // Source paper
  toPaperId: string;             // Target paper
  type: ConnectionType;
  note: string | null;           // Why this connection?

  // AI features
  aiSuggested: boolean;          // Was this AI-generated?
  aiConfidence: number | null;   // 0-1 confidence score
  userApproved: boolean;         // Has user confirmed?

  createdAt: string;
}

// ============================================
// PDF ANNOTATIONS (Zotero-like)
// ============================================

export type AnnotationType =
  | 'highlight'     // Text highlight with color
  | 'underline'     // Text underline
  | 'note'          // Sticky note at position
  | 'area'          // Rectangle selection (screenshot)
  | 'text';         // Text insertion annotation

export type AnnotationColor =
  | 'yellow'        // Default highlight
  | 'red'           // Important/contradicting
  | 'green'         // Supporting/agree
  | 'blue'          // Method/technical
  | 'purple'        // Question/unclear
  | 'orange';       // Review later

export interface ScaledPosition {
  boundingRect: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  };
  rects: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  }>;
  pageNumber: number;
  // For viewport-independent storage
  usePdfCoordinates?: boolean;
}

export interface PDFAnnotation {
  id: string;
  paperId: string;              // Links to Paper
  type: AnnotationType;
  color: AnnotationColor;

  // Position (viewport-independent for storage)
  position: ScaledPosition;

  // Content
  selectedText?: string;        // For highlights/underlines
  comment?: string;             // User's note/comment
  imageDataUrl?: string;        // For area selections (base64)

  // IdeaGraph Integration - THE KEY DIFFERENTIATOR
  linkedArgumentId?: string;    // Link highlight to an argument
  linkedEvidenceId?: string;    // Link highlight to evidence
  exportedToTakeaway?: boolean; // Was this exported to paper takeaway?
  tags: string[];               // User tags for organization

  // Metadata
  createdAt: string;
  updatedAt: string;
  pageLabel?: string;           // Display label (e.g., "p. 5")
}

// For PDF file storage
export interface PDFFile {
  id: string;
  paperId: string;
  filename: string;
  fileSize: number;
  // Stored in IndexedDB as ArrayBuffer, not in this object
  addedAt: string;
  lastOpenedAt: string;
}

// ============================================
// APPLICATION STATE
// ============================================

export interface UserSettings {
  defaultView: 'list' | 'graph';
  graphLayout: 'force' | 'hierarchical' | 'timeline';
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  showAiSuggestions: boolean;
}

export interface AppState {
  theses: Thesis[];
  papers: Paper[];
  connections: Connection[];
  activeThesisId: string | null;
  settings: UserSettings;
}

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  THESES: 'ideagraph_theses',
  PAPERS: 'ideagraph_papers',
  CONNECTIONS: 'ideagraph_connections',
  SETTINGS: 'ideagraph_settings',
  ACTIVE_THESIS: 'ideagraph_active_thesis',
  VERSION: 'ideagraph_version',
} as const;

export const CURRENT_VERSION = '1.0.0';
