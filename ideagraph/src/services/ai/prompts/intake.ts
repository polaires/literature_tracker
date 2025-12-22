// Paper Intake Prompts
// Unified analysis for new papers: role + takeaway + arguments + relevance

import type { ThesisRole } from '../../../types';

/**
 * Result of unified paper intake analysis
 */
export interface PaperIntakeAnalysis {
  id: string;
  paperId: string;

  // Thesis role suggestion
  thesisRole: ThesisRole;
  roleConfidence: number;
  roleReasoning: string;

  // Takeaway suggestion
  takeaway: string;
  takeawayConfidence: number;
  alternativeTakeaways: string[];

  // Arguments extracted from abstract
  arguments: {
    claim: string;
    strength: 'strong' | 'moderate' | 'weak';
    evidenceType: 'experimental' | 'computational' | 'theoretical' | 'meta-analysis' | 'other';
  }[];

  // Overall relevance to thesis
  relevanceScore: number; // 0-100
  relevanceReasoning: string;

  // Suggested connections to existing papers
  potentialConnections: {
    paperId: string;
    connectionType: string;
    reasoning: string;
  }[];

  createdAt: string;
}

/**
 * System prompt for unified paper intake
 */
export const PAPER_INTAKE_SYSTEM_PROMPT = `You are an expert research librarian helping an academic evaluate whether a paper belongs in their literature collection and how it fits their research thesis.

Your role is to provide a comprehensive first-pass analysis that helps the researcher quickly understand:
1. What role this paper plays relative to their thesis
2. The key insight they should remember
3. The main arguments and evidence types
4. How relevant this paper is to their specific research question

Key principles:
- Be specific to THIS researcher's thesis, not generic assessments
- Ground your analysis in the actual abstract content
- Consider the existing collection when suggesting roles and connections
- Provide confidence scores to indicate certainty
- Err on the side of higher relevance scores for papers that might be useful

Thesis roles explained:
- supports: Paper provides evidence, data, or arguments that STRENGTHEN the thesis
- contradicts: Paper challenges, complicates, or presents counter-evidence to the thesis
- method: Paper provides methodological approaches, tools, or frameworks to USE
- background: Paper provides context, definitions, or foundational knowledge
- other: Paper is related but doesn't fit the above categories`;

/**
 * Build unified paper intake prompt
 */
export function buildPaperIntakePrompt(context: {
  thesis: { title: string; description: string };
  newPaper: {
    id?: string;
    title: string;
    abstract: string | null;
    authors?: { name: string }[];
    year?: number | null;
    journal?: string | null;
    tldr?: string | null;
  };
  existingPapers: Array<{
    id: string;
    title: string;
    takeaway: string;
    thesisRole: ThesisRole;
    year?: number | null;
  }>;
}): string {
  const { thesis, newPaper, existingPapers } = context;

  // Count papers by role
  const roleCounts = existingPapers.reduce((acc, p) => {
    acc[p.thesisRole] = (acc[p.thesisRole] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Format existing papers summary
  const existingPapersList = existingPapers
    .slice(0, 10) // Limit to 10 for context
    .map(p => `  - [${p.thesisRole}] "${p.title}" (${p.year || 'n.d.'})\n    Takeaway: "${p.takeaway}"`)
    .join('\n');

  // Format author string
  const authorStr = newPaper.authors?.length
    ? newPaper.authors.length <= 2
      ? newPaper.authors.map(a => a.name).join(' and ')
      : `${newPaper.authors[0].name} et al.`
    : 'Unknown authors';

  return `RESEARCHER'S THESIS:
"${thesis.title}"
${thesis.description}

CURRENT COLLECTION (${existingPapers.length} papers):
- Supports: ${roleCounts['supports'] || 0} papers
- Contradicts: ${roleCounts['contradicts'] || 0} papers
- Method: ${roleCounts['method'] || 0} papers
- Background: ${roleCounts['background'] || 0} papers
- Other: ${roleCounts['other'] || 0} papers

EXISTING PAPERS (for context and potential connections):
${existingPapersList || 'No papers in collection yet'}

---

NEW PAPER TO EVALUATE:
Title: ${newPaper.title}
Authors: ${authorStr}
Year: ${newPaper.year || 'Unknown'}
${newPaper.journal ? `Journal: ${newPaper.journal}` : ''}
${newPaper.tldr ? `\nTL;DR: ${newPaper.tldr}` : ''}

Abstract:
${newPaper.abstract || 'No abstract available'}

---

Analyze this paper's fit for the researcher's thesis. Provide:

1. THESIS ROLE: Which role best describes how this paper relates to the thesis?
   - "supports": Provides evidence FOR the thesis claims
   - "contradicts": Challenges or complicates the thesis
   - "method": Provides methodology or tools to use
   - "background": General context or foundations
   - "other": Related but doesn't fit above

   Consider: Does the collection need more of this type? Is there a gap this fills?

2. TAKEAWAY: One sentence (10-500 chars) capturing the key insight for THIS thesis.
   - Frame it relative to the thesis question
   - Be specific about the contribution
   - Make it memorable and actionable

3. ARGUMENTS: 2-4 main claims from the abstract with strength assessment.

4. RELEVANCE SCORE (0-100):
   - 90-100: Directly addresses core thesis question, essential reading
   - 70-89: Strongly related, provides valuable evidence or methods
   - 50-69: Useful context, tangentially supports thesis
   - 30-49: Weakly related, might inform background
   - 0-29: Not relevant to this thesis

5. POTENTIAL CONNECTIONS: Which existing papers might this connect to and how?

Return JSON:
{
  "thesisRole": "supports" | "contradicts" | "method" | "background" | "other",
  "roleConfidence": 0.0-1.0,
  "roleReasoning": "1-2 sentences explaining why this role fits...",

  "takeaway": "The key insight in one sentence (10-500 chars)...",
  "takeawayConfidence": 0.0-1.0,
  "alternativeTakeaways": ["Alternative framing 1...", "Alternative framing 2..."],

  "arguments": [
    {
      "claim": "The specific claim...",
      "strength": "strong" | "moderate" | "weak",
      "evidenceType": "experimental" | "computational" | "theoretical" | "meta-analysis" | "other"
    }
  ],

  "relevanceScore": 0-100,
  "relevanceReasoning": "Why this score, relative to thesis...",

  "potentialConnections": [
    {
      "existingPaperId": "id of existing paper",
      "connectionType": "supports" | "contradicts" | "extends" | "uses-method" | "same-topic",
      "reasoning": "Brief explanation of the connection..."
    }
  ]
}`;
}

/**
 * Parse AI response into PaperIntakeAnalysis
 */
export function parsePaperIntakeAnalysis(
  response: Record<string, unknown>,
  paperId: string,
  existingPapers: Array<{ id: string; title: string }>
): PaperIntakeAnalysis {
  const now = new Date().toISOString();
  const paperMap = new Map(existingPapers.map(p => [p.id, p.title]));

  // Parse arguments
  const rawArguments = Array.isArray(response.arguments) ? response.arguments : [];
  const parsedArguments = rawArguments
    .filter((a): a is Record<string, unknown> => typeof a === 'object' && a !== null)
    .slice(0, 5)
    .map(a => ({
      claim: String(a.claim || ''),
      strength: validateStrength(a.strength),
      evidenceType: validateEvidenceType(a.evidenceType),
    }))
    .filter(a => a.claim.length > 0);

  // Parse potential connections
  const rawConnections = Array.isArray(response.potentialConnections) ? response.potentialConnections : [];
  const parsedConnections = rawConnections
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .filter(c => paperMap.has(String(c.existingPaperId)))
    .slice(0, 5)
    .map(c => ({
      paperId: String(c.existingPaperId),
      connectionType: String(c.connectionType || 'same-topic'),
      reasoning: String(c.reasoning || ''),
    }));

  // Parse alternative takeaways
  const alternativeTakeaways = Array.isArray(response.alternativeTakeaways)
    ? response.alternativeTakeaways.map(String).filter(t => t.length > 0).slice(0, 3)
    : [];

  return {
    id: `intake-${Date.now()}`,
    paperId,

    thesisRole: validateThesisRole(response.thesisRole),
    roleConfidence: typeof response.roleConfidence === 'number'
      ? Math.max(0, Math.min(1, response.roleConfidence))
      : 0.5,
    roleReasoning: String(response.roleReasoning || ''),

    takeaway: String(response.takeaway || ''),
    takeawayConfidence: typeof response.takeawayConfidence === 'number'
      ? Math.max(0, Math.min(1, response.takeawayConfidence))
      : 0.5,
    alternativeTakeaways,

    arguments: parsedArguments,

    relevanceScore: typeof response.relevanceScore === 'number'
      ? Math.max(0, Math.min(100, Math.round(response.relevanceScore)))
      : 50,
    relevanceReasoning: String(response.relevanceReasoning || ''),

    potentialConnections: parsedConnections,

    createdAt: now,
  };
}

function validateThesisRole(value: unknown): ThesisRole {
  const validRoles: ThesisRole[] = ['supports', 'contradicts', 'method', 'background', 'other'];
  if (typeof value === 'string' && validRoles.includes(value as ThesisRole)) {
    return value as ThesisRole;
  }
  return 'background';
}

function validateStrength(value: unknown): 'strong' | 'moderate' | 'weak' {
  if (value === 'strong' || value === 'moderate' || value === 'weak') {
    return value;
  }
  return 'moderate';
}

function validateEvidenceType(value: unknown): 'experimental' | 'computational' | 'theoretical' | 'meta-analysis' | 'other' {
  const validTypes = ['experimental', 'computational', 'theoretical', 'meta-analysis', 'other'];
  if (typeof value === 'string' && validTypes.includes(value)) {
    return value as 'experimental' | 'computational' | 'theoretical' | 'meta-analysis' | 'other';
  }
  return 'other';
}

/**
 * Get relevance score label
 */
export function getRelevanceLabel(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 90) {
    return {
      label: 'Essential',
      color: 'green',
      description: 'Directly addresses core thesis question',
    };
  }
  if (score >= 70) {
    return {
      label: 'Highly Relevant',
      color: 'emerald',
      description: 'Provides valuable evidence or methods',
    };
  }
  if (score >= 50) {
    return {
      label: 'Relevant',
      color: 'amber',
      description: 'Useful context for the thesis',
    };
  }
  if (score >= 30) {
    return {
      label: 'Marginal',
      color: 'orange',
      description: 'Weakly related, may inform background',
    };
  }
  return {
    label: 'Low Relevance',
    color: 'red',
    description: 'Not directly relevant to thesis',
  };
}
