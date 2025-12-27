// Stage 2: Deep Extraction Prompts
// Type-specific extraction of findings, data, and connections

import type {
  PaperExtractionContext,
  ExtractionResponse,
  ReviewExtractionResponse,
  ExtractedFindingRaw,
  ExtractedDataTableRaw,
  IntraPaperConnectionRaw,
  PotentialCrossConnectionRaw,
} from './types';
import {
  isValidFindingType,
  clampConfidence,
} from './types';
import type { PaperType, PaperClassification } from '../../../../types/paperGraph';

// =============================================================================
// System Prompts
// =============================================================================

const EXTRACTION_SYSTEM_PROMPT_BASE = `You are an expert research analyst extracting structured knowledge from academic papers. Your task is to identify and organize the key findings, data, and connections within the paper.

Key principles:
1. GROUND EVERYTHING IN QUOTES - Every finding must have at least one direct quote with page reference
2. BE SPECIFIC - Use precise language from the paper, not vague summaries
3. DISTINGUISH FINDING TYPES - Central findings are rare (usually 1-2), most are supporting
4. IDENTIFY CONNECTIONS - Note how findings relate to each other within the paper
5. EXTRACT DATA TABLES - When tables are described, structure the data

Finding Types:
- central-finding: The main result or contribution (rare, 1-2 per paper)
- supporting-finding: Results that support or elaborate the central finding
- methodological: Key methodological insights or innovations
- limitation: Acknowledged limitations or caveats
- implication: Stated implications or significance
- open-question: Questions raised but not answered
- background: Important context or prior knowledge

For quotes, always include page numbers when visible (e.g., "Quote text" on p. 5).
If page numbers aren't visible, indicate approximate position: early (first 20%), middle (20-80%), late (last 20%).`;

const RESEARCH_ARTICLE_SYSTEM_PROMPT = `${EXTRACTION_SYSTEM_PROMPT_BASE}

This is a RESEARCH ARTICLE with empirical findings. Focus on:
- Results: What did they actually find? Quantitative data is key
- Methods: What approach makes their results valid?
- Implications: What do the results mean for the field?

Pay special attention to:
- Numerical results, statistics, p-values
- Figures and tables mentioned
- Comparisons to prior work
- Limitations acknowledged by authors`;

const REVIEW_PAPER_SYSTEM_PROMPT = `${EXTRACTION_SYSTEM_PROMPT_BASE}

This is a REVIEW PAPER synthesizing existing literature. Focus on:
- Synthesis themes: How do they group or organize the literature?
- Consensus points: What do papers agree on?
- Disagreements: Where do papers conflict?
- Gaps: What's missing from the literature?
- Future directions: What research is needed?

Pay special attention to:
- How the review organizes different papers
- Claims about the state of the field
- Explicit identification of research gaps
- Chronological or thematic trends`;

const METHODS_PAPER_SYSTEM_PROMPT = `${EXTRACTION_SYSTEM_PROMPT_BASE}

This is a METHODS PAPER describing techniques or protocols. Focus on:
- Key protocol steps: What are the critical procedural elements?
- Parameters: What conditions, concentrations, times matter?
- Validation: How did they show the method works?
- Limitations: When does the method NOT work?

Pay special attention to:
- Specific numerical parameters
- Comparison to existing methods
- Troubleshooting advice
- Application scope`;

const SHORT_COMM_SYSTEM_PROMPT = `${EXTRACTION_SYSTEM_PROMPT_BASE}

This is a SHORT COMMUNICATION with a brief, focused contribution. Focus on:
- The single key finding or observation
- The evidence supporting it
- Immediate implications

Keep extraction concise - expect only 1-3 findings.`;

// =============================================================================
// System Prompt Selector
// =============================================================================

export function getExtractionSystemPrompt(paperType: PaperType): string {
  switch (paperType) {
    case 'research-article':
    case 'meta-analysis':
    case 'case-study':
      return RESEARCH_ARTICLE_SYSTEM_PROMPT;
    case 'review':
      return REVIEW_PAPER_SYSTEM_PROMPT;
    case 'methods':
      return METHODS_PAPER_SYSTEM_PROMPT;
    case 'short-communication':
      return SHORT_COMM_SYSTEM_PROMPT;
    case 'theoretical':
      return RESEARCH_ARTICLE_SYSTEM_PROMPT; // Similar to research article
    default:
      return RESEARCH_ARTICLE_SYSTEM_PROMPT;
  }
}

// =============================================================================
// Prompt Builder
// =============================================================================

export function buildExtractionPrompt(
  context: PaperExtractionContext,
  classification: PaperClassification
): string {
  const { paper } = context;
  const { paperType, extractionHints } = classification;

  // Adjust text length based on extraction depth
  const maxTextLength = getMaxTextLength(extractionHints.suggestedDepth);
  const pdfText = paper.pdfText.slice(0, maxTextLength);

  const prioritySectionsNote = extractionHints.prioritySections.length > 0
    ? `\nPRIORITY SECTIONS: Focus especially on: ${extractionHints.prioritySections.join(', ')}`
    : '';

  const isReviewPaper = paperType === 'review';

  return `PAPER TO EXTRACT:
Title: ${paper.title}
Authors: ${paper.authors}
Year: ${paper.year || 'Unknown'}
Journal: ${paper.journal || 'Unknown'}
Paper Type: ${paperType}

ABSTRACT:
${paper.abstract || 'No abstract available'}
${prioritySectionsNote}

FULL TEXT:
${pdfText}

---

Extract structured knowledge from this paper.

${isReviewPaper ? getReviewSpecificInstructions() : getStandardInstructions()}

Return JSON:
{
  "findings": [
    {
      "title": "Short label (3-10 words)",
      "description": "Full description (1-3 sentences)",
      "findingType": "central-finding" | "supporting-finding" | "methodological" | "limitation" | "implication" | "open-question" | "background",
      "pageNumbers": [5, 6],
      "sectionName": "Results",
      "directQuotes": [
        {
          "text": "Exact quote from paper...",
          "pageNumber": 5,
          "approximatePosition": "early" | "middle" | "late"
        }
      ],
      "confidence": 0.0-1.0
    }
  ],

  "dataTables": [
    {
      "name": "Table I: Binding Affinities",
      "description": "What the table shows",
      "pageReference": "p. 5",
      "columns": [
        { "name": "Column Name", "unit": "uM" }
      ],
      "rows": [
        { "label": "Row Label", "values": { "Column Name": "value" } }
      ],
      "linkedFindingIndices": [0, 1],
      "confidence": 0.0-1.0
    }
  ],

  "intraPaperConnections": [
    {
      "fromFindingIndex": 0,
      "toFindingIndex": 1,
      "connectionType": "supports" | "contradicts" | "extends" | "requires" | "explains" | "qualifies",
      "explanation": "How these findings relate...",
      "isExplicit": true/false
    }
  ],

  "experimentalSystem": "HeLa cells" | "E. coli" | "mice" | null,
  "keyContributions": ["1-3 main contributions"],
  "limitations": ["Acknowledged limitations"],
  "openQuestions": ["Questions raised but not answered"],

  "potentialConnections": [
    {
      "findingIndex": 0,
      "suggestedConnectionType": "supports" | "contradicts" | "extends" | "uses-method" | "same-topic",
      "targetDescription": "Papers studying X...",
      "keywords": ["keyword1", "keyword2"],
      "reasoning": "Why this connection might exist..."
    }
  ]${isReviewPaper ? `,

  "reviewSpecific": {
    "synthesisThemes": [
      {
        "theme": "Theme description",
        "papersCited": ["Author et al., 2020", "Author & Author, 2019"],
        "consensus": "What papers agree on...",
        "disagreement": "Where papers conflict..."
      }
    ],
    "identifiedGaps": [
      {
        "gap": "Description of gap",
        "gapType": "knowledge" | "methodological" | "population" | "temporal" | "contradictory",
        "pageReference": "p. 10",
        "explicitOrInferred": "explicit" | "inferred"
      }
    ],
    "futureDirections": ["Future research direction 1", "..."],
    "chronologicalTrends": [
      { "period": "2010-2015", "characterization": "What characterized this period..." }
    ]
  }` : ''}
}`;
}

// =============================================================================
// Helper Instructions
// =============================================================================

function getStandardInstructions(): string {
  return `EXTRACTION GUIDELINES:
1. Start with the central finding (the main contribution) - there's usually only 1-2
2. Add supporting findings that provide evidence or context
3. Include methodological findings if the method is novel
4. Capture limitations and open questions
5. For each finding, include at least one direct quote with page reference
6. Connect findings that relate to each other
7. Extract any data tables described in the text`;
}

function getReviewSpecificInstructions(): string {
  return `REVIEW PAPER EXTRACTION GUIDELINES:
1. Identify how the review organizes the literature (synthesis themes)
2. For each theme, note which papers are grouped together
3. Capture points of consensus and disagreement
4. Explicitly identify research gaps mentioned
5. Note future directions recommended
6. Track chronological trends if the review covers history
7. Quote specific claims about the state of the field`;
}

function getMaxTextLength(depth: 'quick' | 'standard' | 'deep'): number {
  switch (depth) {
    case 'quick': return 15000;   // ~3000 words
    case 'standard': return 40000; // ~8000 words
    case 'deep': return 80000;    // ~16000 words
  }
}

// =============================================================================
// Response Parser
// =============================================================================

export function parseExtractionResponse(
  response: Record<string, unknown>,
  _paperTitle: string // Reserved for future use with paper-specific parsing
): ExtractionResponse {
  // Parse findings
  const rawFindings = Array.isArray(response.findings) ? response.findings : [];
  const findings: ExtractedFindingRaw[] = rawFindings
    .filter((f): f is Record<string, unknown> => typeof f === 'object' && f !== null)
    .slice(0, 15) // Max 15 findings
    .map(parseFinding);

  // Parse data tables
  const rawTables = Array.isArray(response.dataTables) ? response.dataTables : [];
  const dataTables: ExtractedDataTableRaw[] = rawTables
    .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
    .slice(0, 10) // Max 10 tables
    .map(parseDataTable);

  // Parse intra-paper connections
  const rawConnections = Array.isArray(response.intraPaperConnections) ? response.intraPaperConnections : [];
  const intraPaperConnections: IntraPaperConnectionRaw[] = rawConnections
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .filter(c => typeof c.fromFindingIndex === 'number' && typeof c.toFindingIndex === 'number')
    .slice(0, 20) // Max 20 connections
    .map(parseIntraPaperConnection);

  // Parse potential cross-paper connections
  const rawPotential = Array.isArray(response.potentialConnections) ? response.potentialConnections : [];
  const potentialConnections: PotentialCrossConnectionRaw[] = rawPotential
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .slice(0, 10)
    .map(parsePotentialConnection);

  return {
    findings,
    dataTables,
    intraPaperConnections,
    experimentalSystem: typeof response.experimentalSystem === 'string'
      ? response.experimentalSystem
      : undefined,
    keyContributions: parseStringArray(response.keyContributions, 5),
    limitations: parseStringArray(response.limitations, 10),
    openQuestions: parseStringArray(response.openQuestions, 10),
    potentialConnections,
  };
}

export function parseReviewExtractionResponse(
  response: Record<string, unknown>,
  paperId: string
): ReviewExtractionResponse {
  const baseExtraction = parseExtractionResponse(response, paperId);

  const reviewSpecific = response.reviewSpecific as Record<string, unknown> | undefined;

  return {
    ...baseExtraction,
    reviewSpecific: {
      synthesisThemes: parseSynthesisThemes(reviewSpecific?.synthesisThemes),
      identifiedGaps: parseIdentifiedGaps(reviewSpecific?.identifiedGaps),
      futureDirections: parseStringArray(reviewSpecific?.futureDirections, 10),
      chronologicalTrends: parseChronologicalTrends(reviewSpecific?.chronologicalTrends),
    },
  };
}

// =============================================================================
// Individual Parsers
// =============================================================================

function parseFinding(f: Record<string, unknown>): ExtractedFindingRaw {
  const rawQuotes = Array.isArray(f.directQuotes) ? f.directQuotes : [];
  const directQuotes = rawQuotes
    .filter((q): q is Record<string, unknown> => typeof q === 'object' && q !== null)
    .slice(0, 5)
    .map(q => ({
      text: String(q.text || ''),
      pageNumber: typeof q.pageNumber === 'number' ? q.pageNumber : undefined,
      approximatePosition: parseApproximatePosition(q.approximatePosition),
    }))
    .filter(q => q.text.length > 0);

  return {
    title: String(f.title || 'Untitled Finding').slice(0, 100),
    description: String(f.description || '').slice(0, 1000),
    findingType: isValidFindingType(f.findingType) ? f.findingType : 'supporting-finding',
    pageNumbers: parsePageNumbers(f.pageNumbers),
    sectionName: typeof f.sectionName === 'string' ? f.sectionName : undefined,
    directQuotes,
    confidence: clampConfidence(f.confidence),
  };
}

function parseDataTable(t: Record<string, unknown>): ExtractedDataTableRaw {
  const rawColumns = Array.isArray(t.columns) ? t.columns : [];
  const columns = rawColumns
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .slice(0, 20)
    .map(c => ({
      name: String(c.name || 'Column'),
      unit: typeof c.unit === 'string' ? c.unit : undefined,
    }));

  const rawRows = Array.isArray(t.rows) ? t.rows : [];
  const rows = rawRows
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .slice(0, 50)
    .map(r => ({
      label: String(r.label || 'Row'),
      values: typeof r.values === 'object' && r.values !== null
        ? Object.fromEntries(
            Object.entries(r.values as Record<string, unknown>)
              .map(([k, v]) => [k, String(v)])
          )
        : {},
    }));

  const rawLinked = Array.isArray(t.linkedFindingIndices) ? t.linkedFindingIndices : [];
  const linkedFindingIndices = rawLinked
    .filter((i): i is number => typeof i === 'number')
    .slice(0, 5);

  return {
    name: String(t.name || 'Untitled Table').slice(0, 200),
    description: String(t.description || '').slice(0, 500),
    pageReference: typeof t.pageReference === 'string' ? t.pageReference : null,
    columns,
    rows,
    linkedFindingIndices,
    confidence: clampConfidence(t.confidence),
  };
}

function parseIntraPaperConnection(c: Record<string, unknown>): IntraPaperConnectionRaw {
  const validTypes = ['supports', 'contradicts', 'extends', 'requires', 'explains', 'qualifies'];
  const connectionType = validTypes.includes(String(c.connectionType))
    ? (c.connectionType as IntraPaperConnectionRaw['connectionType'])
    : 'supports';

  return {
    fromFindingIndex: Number(c.fromFindingIndex) || 0,
    toFindingIndex: Number(c.toFindingIndex) || 0,
    connectionType,
    explanation: String(c.explanation || '').slice(0, 500),
    isExplicit: c.isExplicit === true,
  };
}

function parsePotentialConnection(c: Record<string, unknown>): PotentialCrossConnectionRaw {
  const validTypes = ['supports', 'contradicts', 'extends', 'uses-method', 'same-topic'];
  const suggestedConnectionType = validTypes.includes(String(c.suggestedConnectionType))
    ? (c.suggestedConnectionType as PotentialCrossConnectionRaw['suggestedConnectionType'])
    : 'same-topic';

  return {
    findingIndex: typeof c.findingIndex === 'number' ? c.findingIndex : 0,
    suggestedConnectionType,
    targetDescription: String(c.targetDescription || '').slice(0, 300),
    keywords: parseStringArray(c.keywords, 10),
    reasoning: String(c.reasoning || '').slice(0, 500),
  };
}

function parseApproximatePosition(value: unknown): 'early' | 'middle' | 'late' | undefined {
  if (value === 'early' || value === 'middle' || value === 'late') {
    return value;
  }
  return undefined;
}

function parsePageNumbers(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((n): n is number => typeof n === 'number' && n > 0)
    .slice(0, 10);
}

function parseStringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => String(item || ''))
    .filter(s => s.length > 0)
    .slice(0, maxItems);
}

function parseSynthesisThemes(value: unknown): ReviewExtractionResponse['reviewSpecific']['synthesisThemes'] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
    .slice(0, 10)
    .map(t => ({
      theme: String(t.theme || '').slice(0, 300),
      papersCited: parseStringArray(t.papersCited, 20),
      consensus: typeof t.consensus === 'string' ? t.consensus.slice(0, 500) : null,
      disagreement: typeof t.disagreement === 'string' ? t.disagreement.slice(0, 500) : null,
    }));
}

function parseIdentifiedGaps(value: unknown): ReviewExtractionResponse['reviewSpecific']['identifiedGaps'] {
  if (!Array.isArray(value)) return [];
  // Aligned with GapTypeExtracted in types/paperGraph.ts
  const validGapTypes = ['knowledge', 'methodological', 'population', 'theoretical', 'temporal', 'geographic', 'contradictory'];

  return value
    .filter((g): g is Record<string, unknown> => typeof g === 'object' && g !== null)
    .slice(0, 10)
    .map(g => ({
      gap: String(g.gap || '').slice(0, 500),
      gapType: validGapTypes.includes(String(g.gapType))
        ? (g.gapType as 'knowledge' | 'methodological' | 'population' | 'theoretical' | 'temporal' | 'geographic' | 'contradictory')
        : 'knowledge',
      pageReference: typeof g.pageReference === 'string' ? g.pageReference : null,
      explicitOrInferred: g.explicitOrInferred === 'inferred' ? 'inferred' : 'explicit',
    }));
}

function parseChronologicalTrends(value: unknown): ReviewExtractionResponse['reviewSpecific']['chronologicalTrends'] {
  if (!Array.isArray(value)) return undefined;
  const trends = value
    .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
    .slice(0, 10)
    .map(t => ({
      period: String(t.period || '').slice(0, 50),
      characterization: String(t.characterization || '').slice(0, 300),
    }))
    .filter(t => t.period.length > 0 && t.characterization.length > 0);

  return trends.length > 0 ? trends : undefined;
}
