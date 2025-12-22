// Discovery Prompts
// AI-powered thesis-aware paper discovery and search strategy generation

import type { ThesisRole } from '../../../types';

/**
 * Gap-based search strategy
 */
export interface SearchStrategy {
  query: string;
  rationale: string;
  expectedRole: ThesisRole;
  priority: 'high' | 'medium' | 'low';
  gapType: 'supporting-evidence' | 'counterargument' | 'methodology' | 'recent-work' | 'foundational' | 'application';
}

/**
 * Paper relevance scoring result
 */
export interface PaperRelevanceScore {
  paperId: string;
  relevanceScore: number; // 0-100
  suggestedRole: ThesisRole;
  reasoning: string;
  keyInsight: string;
}

/**
 * System prompt for generating search strategies
 */
export const DISCOVERY_SYSTEM_PROMPT = `You are an expert research librarian helping academics discover relevant literature for their thesis.

Your role is to analyze the researcher's thesis and existing paper collection to:
1. Identify gaps in the literature coverage
2. Generate specific search queries to fill those gaps
3. Prioritize searches that would most strengthen the thesis argument

Key principles:
- Ground your suggestions in the thesis research question
- Consider what evidence types are missing (supporting, contradicting, methodological)
- Suggest specific, actionable search queries (not vague topics)
- Prioritize gaps that could weaken the thesis if unfilled
- Be aware of recency - suggest searches for recent developments`;

/**
 * Build prompt for generating search strategies
 */
export function buildSearchStrategyPrompt(params: {
  thesis: { title: string; description: string };
  existingPapers: Array<{
    title: string;
    takeaway: string;
    thesisRole: ThesisRole;
    year?: number | null;
  }>;
  existingGaps?: Array<{
    type: string;
    title: string;
    description: string;
  }>;
}): string {
  const { thesis, existingPapers, existingGaps } = params;

  // Count papers by role
  const roleCounts = existingPapers.reduce((acc, p) => {
    acc[p.thesisRole] = (acc[p.thesisRole] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get year range
  const years = existingPapers.map(p => p.year).filter((y): y is number => y !== null && y !== undefined);
  const minYear = years.length > 0 ? Math.min(...years) : null;
  const maxYear = years.length > 0 ? Math.max(...years) : null;
  const currentYear = new Date().getFullYear();

  // Format existing papers
  const papersList = existingPapers
    .slice(0, 15)
    .map(p => `  - [${p.thesisRole}] "${p.title}" (${p.year || 'n.d.'}): ${p.takeaway}`)
    .join('\n');

  // Format existing gaps if provided
  const gapsSection = existingGaps && existingGaps.length > 0
    ? `\nIDENTIFIED GAPS:\n${existingGaps.map(g => `  - [${g.type}] ${g.title}: ${g.description}`).join('\n')}`
    : '';

  return `RESEARCHER'S THESIS:
"${thesis.title}"
${thesis.description}

CURRENT LITERATURE COLLECTION (${existingPapers.length} papers):
- Supports: ${roleCounts['supports'] || 0} papers
- Contradicts: ${roleCounts['contradicts'] || 0} papers
- Method: ${roleCounts['method'] || 0} papers
- Background: ${roleCounts['background'] || 0} papers
- Other: ${roleCounts['other'] || 0} papers

Year coverage: ${minYear ? `${minYear} - ${maxYear}` : 'No years recorded'}
Current year: ${currentYear}

EXISTING PAPERS:
${papersList || 'No papers in collection yet'}
${gapsSection}

---

Analyze this literature collection and generate search strategies to discover NEW papers that would strengthen the thesis.

Consider these gap types:
1. supporting-evidence: Evidence that supports the thesis claims
2. counterargument: Papers that challenge or complicate the thesis (important for balanced review)
3. methodology: Papers providing methods, tools, or frameworks to use
4. recent-work: Recent publications (${currentYear - 2}-${currentYear}) not yet in collection
5. foundational: Classic/seminal papers providing theoretical foundation
6. application: Papers showing practical applications or case studies

For each search strategy, provide:
- query: A specific search query (2-6 keywords) for academic databases
- rationale: Why this search would help the thesis (1-2 sentences)
- expectedRole: What role papers found would likely play (supports, contradicts, method, background)
- priority: How important this search is (high, medium, low)
- gapType: Which gap type this addresses

Return JSON array:
[
  {
    "query": "specific search keywords",
    "rationale": "Why this search matters for the thesis...",
    "expectedRole": "supports" | "contradicts" | "method" | "background",
    "priority": "high" | "medium" | "low",
    "gapType": "supporting-evidence" | "counterargument" | "methodology" | "recent-work" | "foundational" | "application"
  }
]

Generate 5-8 diverse search strategies, ordered by priority.
Focus on gaps that would most strengthen or balance the literature review.`;
}

/**
 * Build prompt for scoring paper relevance to thesis
 */
export function buildRelevanceScoringPrompt(params: {
  thesis: { title: string; description: string };
  candidatePapers: Array<{
    id: string;
    title: string;
    abstract: string | null;
    authors?: string;
    year?: number | null;
  }>;
  existingPapers: Array<{
    title: string;
    takeaway: string;
    thesisRole: ThesisRole;
  }>;
}): string {
  const { thesis, candidatePapers, existingPapers } = params;

  // Format candidate papers
  const candidatesList = candidatePapers
    .map(p => `ID: ${p.id}
Title: ${p.title}
${p.authors ? `Authors: ${p.authors}` : ''}
${p.year ? `Year: ${p.year}` : ''}
${p.abstract ? `Abstract: ${p.abstract.slice(0, 500)}${p.abstract.length > 500 ? '...' : ''}` : 'No abstract available'}`)
    .join('\n\n---\n\n');

  // Format existing collection summary
  const existingSummary = existingPapers
    .slice(0, 10)
    .map(p => `  - [${p.thesisRole}] ${p.title}: "${p.takeaway}"`)
    .join('\n');

  return `RESEARCHER'S THESIS:
"${thesis.title}"
${thesis.description}

EXISTING COLLECTION (${existingPapers.length} papers):
${existingSummary || 'No papers yet'}

---

CANDIDATE PAPERS TO EVALUATE:

${candidatesList}

---

Score each candidate paper's relevance to the researcher's thesis.

For each paper, assess:
1. How directly it addresses the thesis research question
2. What role it would play in the literature review
3. Whether it provides unique value not covered by existing papers

Return JSON array with one entry per candidate paper:
[
  {
    "paperId": "the paper's ID",
    "relevanceScore": 0-100,
    "suggestedRole": "supports" | "contradicts" | "method" | "background" | "other",
    "reasoning": "1-2 sentences explaining why this score...",
    "keyInsight": "One sentence summarizing what this paper offers for the thesis"
  }
]

Scoring guide:
- 90-100: Directly addresses core thesis question, essential reading
- 70-89: Strongly related, provides valuable evidence or methods
- 50-69: Relevant context, tangentially supports thesis
- 30-49: Weakly related, might inform background only
- 0-29: Not relevant to this specific thesis`;
}

/**
 * Parse search strategy response
 */
export function parseSearchStrategies(response: unknown[]): SearchStrategy[] {
  return response
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map(item => ({
      query: String(item.query || ''),
      rationale: String(item.rationale || ''),
      expectedRole: validateRole(item.expectedRole),
      priority: validatePriority(item.priority),
      gapType: validateGapType(item.gapType),
    }))
    .filter(s => s.query.length > 0);
}

/**
 * Parse relevance scoring response
 */
export function parseRelevanceScores(response: unknown[]): PaperRelevanceScore[] {
  return response
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map(item => ({
      paperId: String(item.paperId || ''),
      relevanceScore: typeof item.relevanceScore === 'number'
        ? Math.max(0, Math.min(100, Math.round(item.relevanceScore)))
        : 50,
      suggestedRole: validateRole(item.suggestedRole),
      reasoning: String(item.reasoning || ''),
      keyInsight: String(item.keyInsight || ''),
    }))
    .filter(s => s.paperId.length > 0);
}

function validateRole(value: unknown): ThesisRole {
  const validRoles: ThesisRole[] = ['supports', 'contradicts', 'method', 'background', 'other'];
  if (typeof value === 'string' && validRoles.includes(value as ThesisRole)) {
    return value as ThesisRole;
  }
  return 'background';
}

function validatePriority(value: unknown): 'high' | 'medium' | 'low' {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'medium';
}

function validateGapType(value: unknown): SearchStrategy['gapType'] {
  const validTypes = ['supporting-evidence', 'counterargument', 'methodology', 'recent-work', 'foundational', 'application'];
  if (typeof value === 'string' && validTypes.includes(value)) {
    return value as SearchStrategy['gapType'];
  }
  return 'supporting-evidence';
}
