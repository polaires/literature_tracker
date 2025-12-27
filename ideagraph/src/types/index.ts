// ============================================
// RE-EXPORTS
// ============================================

// Paper IdeaGraph types (knowledge graph extraction)
export * from './paperGraph';

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
  graphCustomization: GraphCustomization;
}

// ============================================
// GRAPH CUSTOMIZATION
// ============================================

export interface GraphCustomization {
  // Node settings
  nodeSizeMode: 'fixed' | 'citations' | 'connections';
  nodeBaseSize: number;           // 32-80
  nodeSizeRange: [number, number]; // [min, max] for dynamic sizing
  nodeColorMode: 'role' | 'year' | 'status' | 'subthesis';
  showNodeLabels: 'always' | 'hover' | 'never';
  nodeLabelSize: 'small' | 'medium' | 'large';

  // Edge settings
  edgeBaseWidth: number;          // 1-5
  edgeWidthScaling: 'none' | 'by-strength';
  edgeOpacity: number;            // 0.3-1.0
  edgeArrowSize: 'small' | 'medium' | 'large';
  edgeCurveStyle: 'bezier' | 'straight' | 'taxi';

  // Visibility
  showPhantomEdges: boolean;
  phantomEdgeOpacity: number;     // 0.1-0.5
  showEdgeLabels: boolean;
  dimUnconnectedNodes: boolean;
}

export const DEFAULT_GRAPH_CUSTOMIZATION: GraphCustomization = {
  nodeSizeMode: 'fixed',
  nodeBaseSize: 48,
  nodeSizeRange: [40, 72],
  nodeColorMode: 'role',
  showNodeLabels: 'always',
  nodeLabelSize: 'medium',

  edgeBaseWidth: 1.5,
  edgeWidthScaling: 'none',
  edgeOpacity: 0.6,
  edgeArrowSize: 'medium',
  edgeCurveStyle: 'bezier',

  showPhantomEdges: true,
  phantomEdgeOpacity: 0.25,
  showEdgeLabels: false,
  dimUnconnectedNodes: true,
};

// Graph presets for quick switching
export type GraphPresetName = 'default' | 'presentation' | 'dense' | 'minimalist' | 'highContrast';

export const GRAPH_PRESETS: Record<GraphPresetName, Partial<GraphCustomization>> = {
  default: {
    nodeBaseSize: 48,
    edgeBaseWidth: 1.5,
    edgeOpacity: 0.6,
    showNodeLabels: 'always',
    nodeLabelSize: 'medium',
  },
  presentation: {
    nodeBaseSize: 64,
    edgeBaseWidth: 3,
    edgeOpacity: 0.8,
    showNodeLabels: 'always',
    nodeLabelSize: 'large',
    edgeArrowSize: 'large',
  },
  dense: {
    nodeBaseSize: 36,
    edgeBaseWidth: 1,
    edgeOpacity: 0.4,
    showNodeLabels: 'hover',
    nodeLabelSize: 'small',
  },
  minimalist: {
    nodeBaseSize: 40,
    edgeBaseWidth: 1,
    edgeOpacity: 0.3,
    showNodeLabels: 'never',
    showPhantomEdges: false,
  },
  highContrast: {
    nodeBaseSize: 56,
    edgeBaseWidth: 2.5,
    edgeOpacity: 0.9,
    showNodeLabels: 'always',
    nodeLabelSize: 'large',
  },
};

// ============================================
// AI SETTINGS (Phase 3)
// ============================================

export type AIProviderType = 'claude' | 'openai' | 'ollama' | 'mock';

export interface AISettings {
  // Provider configuration
  provider: AIProviderType;
  apiKey: string | null;
  ollamaEndpoint: string | null;

  // Feature toggles
  enableConnectionSuggestions: boolean;
  enableTakeawaySuggestions: boolean;
  enableArgumentExtraction: boolean;
  enableGapAnalysis: boolean;
  enableReviewGeneration: boolean;

  // Behavior settings
  autoSuggestOnPaperAdd: boolean;
  suggestionConfidenceThreshold: number; // 0.0 - 1.0
  maxSuggestionsPerRequest: number;

  // Privacy settings
  sendAbstractsToAI: boolean;
  sendHighlightsToAI: boolean;

  // Model preferences
  preferFastModel: boolean;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'claude',
  apiKey: null,
  ollamaEndpoint: null,

  enableConnectionSuggestions: true,
  enableTakeawaySuggestions: true,
  enableArgumentExtraction: true,
  enableGapAnalysis: true,
  enableReviewGeneration: true,

  autoSuggestOnPaperAdd: false,
  suggestionConfidenceThreshold: 0.6,
  maxSuggestionsPerRequest: 5,

  sendAbstractsToAI: true,
  sendHighlightsToAI: true,

  preferFastModel: false,
};

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

// ============================================
// SYNTHESIS & REVIEW TOOLS (Phase 2.6)
// ============================================

// Review section for organizing papers
export interface ReviewSection {
  id: string;
  thesisId: string;
  title: string;                   // e.g., "Introduction", "Kinetic Framework"
  description: string | null;      // Section purpose
  order: number;                   // Display order
  paperIds: string[];              // Papers assigned to this section
  createdAt: string;
}

// Synthesis theme for cross-paper analysis
export interface SynthesisTheme {
  id: string;
  thesisId: string;
  name: string;                    // e.g., "Pocket engineering limitations"
  description: string | null;
  color: string;                   // For visual coding
  paperIds: string[];              // Papers addressing this theme
  relatedArgumentIds: string[];    // Arguments across papers on this theme
  createdAt: string;
}

// Research gap identified in the literature
export type GapType =
  | 'knowledge'          // Missing empirical evidence
  | 'methodological'     // Missing methodology/approach
  | 'population'         // Understudied population
  | 'theoretical'        // Missing framework/theory
  | 'temporal'           // Outdated research
  | 'geographic'         // Geographic limitation
  | 'contradictory';     // Conflicting findings need resolution

export type GapPriority = 'high' | 'medium' | 'low';

export interface ResearchGap {
  id: string;
  thesisId: string;
  title: string;                   // Brief description
  description: string;             // Detailed explanation
  type: GapType;
  priority: GapPriority;
  evidenceSource: 'user' | 'inferred';  // User-identified or system-detected
  relatedPaperIds: string[];       // Papers that expose or mention this gap
  futureResearchNote: string | null;  // How this could be addressed
  createdAt: string;
}

// Evidence synthesis across papers
export interface EvidenceSynthesis {
  id: string;
  thesisId: string;
  claim: string;                   // The synthesized claim
  supportingPaperIds: string[];    // Papers that support this claim
  contradictingPaperIds: string[]; // Papers that contradict this claim
  evidenceStrength: 'strong' | 'moderate' | 'weak' | 'conflicting';
  consensusNote: string | null;    // Summary of agreement/disagreement
  createdAt: string;
}

// Export format options
export type ExportFormat = 'markdown' | 'docx' | 'latex' | 'csv';

// ============================================
// PAPER CLUSTERING (Phase 4)
// ============================================

export interface PaperCluster {
  id: string;
  thesisId: string;
  name: string;                    // User-defined cluster name
  paperIds: string[];              // Papers in this cluster
  color: string;                   // Hex color for visual coding
  isCollapsed: boolean;            // Whether to show as single node in graph
  createdAt: string;
}

// Cluster preset colors
export const CLUSTER_COLORS = [
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
] as const;

export interface ExportOptions {
  format: ExportFormat;
  includeSections: boolean;
  includeThemes: boolean;
  includeGaps: boolean;
  includeEvidenceTable: boolean;
  includeCitations: boolean;
  citationStyle: 'apa' | 'mla' | 'chicago' | 'ieee';
}

// ============================================
// SUB-THESIS & HYBRID LAYOUT (Phase 5)
// ============================================

/**
 * Sub-thesis shapes for cognitive differentiation in graph visualization
 * Using distinct shapes helps cognitive grouping without relying solely on color
 */
export type SubThesisShape =
  | 'ellipse'      // Default - general sub-thesis
  | 'rectangle'    // Methodology/technical sub-thesis
  | 'diamond'      // Controversial/debate sub-thesis
  | 'hexagon'      // Application/practical sub-thesis
  | 'triangle'     // Foundational/historical sub-thesis
  | 'octagon'      // Safety/limitations sub-thesis
  | 'star'         // Future directions/emerging sub-thesis
  | 'vee';         // Critique/gap sub-thesis

export const SUB_THESIS_SHAPES: SubThesisShape[] = [
  'ellipse',
  'rectangle',
  'diamond',
  'hexagon',
  'triangle',
  'octagon',
  'star',
  'vee',
];

// Shape metadata for UI
export const SUB_THESIS_SHAPE_INFO: Record<SubThesisShape, { label: string; description: string; icon: string }> = {
  ellipse: { label: 'General', description: 'Default shape for general topics', icon: '⬭' },
  rectangle: { label: 'Methods', description: 'Methodology or technical topics', icon: '▭' },
  diamond: { label: 'Debate', description: 'Controversial or contested topics', icon: '◇' },
  hexagon: { label: 'Applications', description: 'Practical applications', icon: '⬡' },
  triangle: { label: 'Foundation', description: 'Historical or foundational topics', icon: '△' },
  octagon: { label: 'Limitations', description: 'Safety concerns or limitations', icon: '⯃' },
  star: { label: 'Future', description: 'Emerging or future directions', icon: '☆' },
  vee: { label: 'Gaps', description: 'Research gaps or critiques', icon: '∨' },
};

export interface SubThesis {
  id: string;
  thesisId: string;                // Parent thesis
  parentSubThesisId: string | null; // For nested sub-theses (null = top-level)

  // Content
  title: string;                   // Short name (e.g., "Delivery Challenges")
  question: string | null;         // Sub-question being addressed
  summary: string | null;          // Brief synthesis of papers in this sub-thesis

  // Visual organization
  shape: SubThesisShape;           // Cognitive differentiation via shape
  color: string;                   // Hex color for region background
  icon: string | null;             // Optional emoji/icon

  // Papers
  paperIds: string[];              // Papers assigned to this sub-thesis

  // Layout hints
  order: number;                   // Display order among siblings
  depth: number;                   // 0 = direct child of thesis
  isCollapsed: boolean;            // Whether to show as single node in graph

  // Radial position hint (optional, for thesis-centric layout)
  preferredAngle: number | null;   // Angle in degrees from 12 o'clock, clockwise

  createdAt: string;
  updatedAt: string;
}

// Similarity between two papers (for phantom edges)
export interface PaperSimilarity {
  paper1Id: string;
  paper2Id: string;
  similarity: number;              // 0-1 combined similarity score
  components: {
    tagSimilarity: number;         // Jaccard similarity of tags
    textSimilarity: number;        // Abstract/title text similarity
    yearProximity: number;         // How close in publication year
    roleSimilarity: number;        // Same thesis role bonus
    connectionOverlap: number;     // Shared connections (bibliographic coupling-lite)
  };
}

// Configuration for hybrid layout algorithm
export interface HybridLayoutConfig {
  // Thesis-centric layout
  thesisCentered: boolean;
  thesisGravityStrength: number;   // 0-1, how strongly papers are pulled toward center

  // Similarity-based clustering
  useSimilarityEdges: boolean;     // Add phantom edges for similar papers
  similarityThreshold: number;      // 0-1, minimum similarity to create phantom edge
  similarityEdgeOpacity: number;    // Visual opacity of phantom edges

  // Sub-thesis grouping
  useSubThesisGrouping: boolean;   // Group papers by sub-thesis
  subThesisAttractionStrength: number; // How strongly papers in same sub-thesis attract
  subThesisRepulsionStrength: number;  // How strongly different sub-theses repel

  // Visual encoding
  maxVisibleEdges: number;         // Limit edges shown for performance
  showEdgesOnHover: boolean;       // Show all edges only on hover
  nodeSizeMetric: 'fixed' | 'citations' | 'connections' | 'pagerank';
  nodeColorMetric: 'role' | 'subthesis' | 'year' | 'readingStatus';
}

// Default hybrid layout config
export const DEFAULT_HYBRID_CONFIG: HybridLayoutConfig = {
  thesisCentered: true,
  thesisGravityStrength: 0.8,
  useSimilarityEdges: true,
  similarityThreshold: 0.25,
  similarityEdgeOpacity: 0.3,
  useSubThesisGrouping: true,
  subThesisAttractionStrength: 0.6,
  subThesisRepulsionStrength: 0.4,
  maxVisibleEdges: 100,
  showEdgesOnHover: true,
  nodeSizeMetric: 'citations',
  nodeColorMetric: 'role',
};
