// Screening Prompts
// AI-powered paper screening suggestions for inclusion/exclusion decisions

import type { ThesisRole } from '../../../types';

/**
 * Screening decision suggestion
 */
export interface ScreeningSuggestion {
  paperId: string;
  decision: 'include' | 'exclude' | 'maybe';
  confidence: number;
  reasoning: string;
  suggestedRole?: ThesisRole;
  suggestedTakeaway?: string;
  exclusionReason?: string;
}

/**
 * System prompt for screening suggestions
 */
export const SCREENING_SYSTEM_PROMPT = `You are an expert research librarian helping academics decide which papers to include in their literature review.

Your role is to evaluate whether each paper should be:
- INCLUDE: Directly relevant to the thesis, will strengthen the literature review
- EXCLUDE: Not relevant enough, out of scope, or duplicates existing coverage
- MAYBE: Potentially relevant but needs full-text review to decide

Key principles:
1. Ground decisions in the thesis research question
2. Consider what's already in the collection - avoid redundancy
3. Be conservative with exclusions - when unsure, suggest MAYBE
4. Explain your reasoning clearly
5. For INCLUDE suggestions, also provide a thesis role and draft takeaway`;

/**
 * Build prompt for batch screening suggestions
 */
export function buildScreeningPrompt(params: {
  thesis: { title: string; description: string };
  existingPapers: Array<{
    title: string;
    takeaway: string;
    thesisRole: ThesisRole;
  }>;
  candidatePapers: Array<{
    id: string;
    title: string;
    abstract: string | null;
    authors?: string;
    year?: number | null;
  }>;
}): string {
  const { thesis, existingPapers, candidatePapers } = params;

  // Group existing papers by role for context
  const roleGroups = existingPapers.reduce((acc, p) => {
    if (!acc[p.thesisRole]) acc[p.thesisRole] = [];
    acc[p.thesisRole].push(p);
    return acc;
  }, {} as Record<string, typeof existingPapers>);

  const existingSummary = Object.entries(roleGroups)
    .map(([role, papers]) => {
      const paperList = papers.slice(0, 3).map(p => `    - "${p.title}": ${p.takeaway}`).join('\n');
      const moreCount = papers.length > 3 ? ` (+${papers.length - 3} more)` : '';
      return `  ${role.toUpperCase()} (${papers.length} papers${moreCount}):\n${paperList}`;
    })
    .join('\n\n');

  // Format candidate papers
  const candidatesList = candidatePapers
    .map(p => `ID: ${p.id}
Title: ${p.title}
${p.authors ? `Authors: ${p.authors}` : ''}
${p.year ? `Year: ${p.year}` : ''}
Abstract: ${p.abstract || 'No abstract available'}`)
    .join('\n\n---\n\n');

  return `RESEARCHER'S THESIS:
"${thesis.title}"
${thesis.description}

EXISTING LITERATURE COLLECTION (${existingPapers.length} papers):
${existingSummary || 'No papers in collection yet'}

---

PAPERS TO SCREEN:

${candidatesList}

---

For each paper, decide whether it should be INCLUDED in the literature review, EXCLUDED, or marked as MAYBE for later review.

Inclusion criteria:
- Directly addresses the thesis research question
- Provides evidence, methods, or theoretical framework relevant to the thesis
- Offers a unique perspective not already covered
- Is sufficiently recent and reputable

Exclusion criteria:
- Off-topic or tangentially related at best
- Duplicates coverage already in the collection
- Too narrow/broad for the thesis scope
- Quality concerns (predatory journals, retracted, etc.)

For each paper, provide:
- paperId: The paper's ID
- decision: "include" | "exclude" | "maybe"
- confidence: 0.0-1.0
- reasoning: 1-2 sentences explaining the decision
- suggestedRole: (only for "include") Which role this paper would play
- suggestedTakeaway: (only for "include") Draft takeaway for the paper
- exclusionReason: (only for "exclude") Brief reason category

Return JSON array:
[
  {
    "paperId": "...",
    "decision": "include" | "exclude" | "maybe",
    "confidence": 0.0-1.0,
    "reasoning": "Why this decision...",
    "suggestedRole": "supports" | "contradicts" | "method" | "background" | "other",
    "suggestedTakeaway": "Draft takeaway for included papers...",
    "exclusionReason": "off-topic" | "duplicate" | "out-of-scope" | "quality" | "other"
  }
]`;
}

/**
 * Parse screening suggestions response
 */
export function parseScreeningSuggestions(
  response: unknown[],
  paperIds: string[]
): ScreeningSuggestion[] {
  const validIds = new Set(paperIds);

  return response
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .filter(item => validIds.has(String(item.paperId)))
    .map(item => {
      const decision = validateDecision(item.decision);
      return {
        paperId: String(item.paperId),
        decision,
        confidence: typeof item.confidence === 'number'
          ? Math.max(0, Math.min(1, item.confidence))
          : 0.5,
        reasoning: String(item.reasoning || ''),
        suggestedRole: decision === 'include' ? validateRole(item.suggestedRole) : undefined,
        suggestedTakeaway: decision === 'include' ? String(item.suggestedTakeaway || '') : undefined,
        exclusionReason: decision === 'exclude' ? String(item.exclusionReason || 'other') : undefined,
      };
    });
}

function validateDecision(value: unknown): 'include' | 'exclude' | 'maybe' {
  if (value === 'include' || value === 'exclude' || value === 'maybe') {
    return value;
  }
  return 'maybe';
}

function validateRole(value: unknown): ThesisRole {
  const validRoles: ThesisRole[] = ['supports', 'contradicts', 'method', 'background', 'other'];
  if (typeof value === 'string' && validRoles.includes(value as ThesisRole)) {
    return value as ThesisRole;
  }
  return 'background';
}
