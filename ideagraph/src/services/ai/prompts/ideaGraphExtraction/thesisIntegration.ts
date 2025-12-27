// Stage 3: Thesis Integration Prompt
// Connects extracted findings to the research thesis and existing papers

import type {
  ThesisIntegrationContext,
  ThesisIntegrationResponse,
} from './types';
import { clampConfidence, clampRelevanceScore } from './types';
import type { ThesisRole } from '../../../../types';

// =============================================================================
// System Prompt
// =============================================================================

export const THESIS_INTEGRATION_SYSTEM_PROMPT = `You are an expert research advisor helping a scholar connect a newly analyzed paper to their research thesis.

Your task is to:
1. Assess how relevant this paper is to the specific thesis
2. Determine what role the paper plays (supports, contradicts, method, background, other)
3. Frame a takeaway specific to this thesis
4. Score individual findings for thesis relevance
5. Suggest connections to existing papers in the collection

Key principles:
- Be THESIS-SPECIFIC, not generic. A paper on "protein folding" might be highly relevant to one thesis and irrelevant to another
- Ground assessments in the actual findings extracted from the paper
- Consider the existing collection - what role is missing? What connections are possible?
- Provide specific reasoning for all scores and suggestions

Thesis roles:
- supports: Provides evidence, data, or arguments that STRENGTHEN the thesis
- contradicts: Challenges, complicates, or presents counter-evidence to the thesis
- method: Provides methodology, tools, or frameworks to USE in the research
- background: Provides context, definitions, or foundational knowledge
- other: Related but doesn't fit the above categories

Relevance scores (1-5):
1. Not relevant - No meaningful connection to thesis
2. Tangentially relevant - Weak or indirect connection
3. Moderately relevant - Useful context or secondary evidence
4. Highly relevant - Direct evidence or important methodology
5. Essential - Core paper for the thesis, must include`;

// =============================================================================
// Prompt Builder
// =============================================================================

export function buildThesisIntegrationPrompt(
  context: ThesisIntegrationContext
): string {
  const { thesis, existingPapers, extractedFindings } = context;

  // Format existing papers for context
  const existingPapersFormatted = existingPapers.length > 0
    ? existingPapers
        .slice(0, 15) // Limit to 15 for context size
        .map((p, i) => `${i + 1}. [${p.thesisRole}] "${p.title}" (${p.year || 'n.d.'})
      ID: ${p.id}
      Takeaway: "${p.takeaway}"`)
        .join('\n')
    : 'No papers in collection yet.';

  // Format findings for integration
  const findingsFormatted = extractedFindings
    .map((f, i) => `Finding ${i}: [${f.findingType}] ${f.title}
      ${f.description}
      Confidence: ${f.confidence}`)
    .join('\n\n');

  // Count roles in collection
  const roleCounts = existingPapers.reduce((acc, p) => {
    acc[p.thesisRole] = (acc[p.thesisRole] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return `RESEARCHER'S THESIS:
"${thesis.title}"

THESIS DESCRIPTION:
${thesis.description}

---

CURRENT COLLECTION (${existingPapers.length} papers):
- Supports: ${roleCounts['supports'] || 0}
- Contradicts: ${roleCounts['contradicts'] || 0}
- Method: ${roleCounts['method'] || 0}
- Background: ${roleCounts['background'] || 0}
- Other: ${roleCounts['other'] || 0}

EXISTING PAPERS:
${existingPapersFormatted}

---

EXTRACTED FINDINGS FROM NEW PAPER:
${findingsFormatted}

---

Analyze how this paper fits the thesis and collection.

Return JSON:
{
  "overallRelevance": {
    "score": 1-5,
    "reasoning": "Why this overall score, specific to the thesis..."
  },

  "suggestedRole": {
    "role": "supports" | "contradicts" | "method" | "background" | "other",
    "confidence": 0.0-1.0,
    "reasoning": "Why this role fits best..."
  },

  "thesisFramedTakeaway": "One sentence (10-500 chars) capturing the key insight for THIS thesis...",
  "alternativeTakeaways": ["Alternative framing 1...", "Alternative framing 2..."],

  "findingRelevance": [
    {
      "findingIndex": 0,
      "relevanceScore": 1-5,
      "thesisDimension": "Which aspect of thesis this relates to",
      "reasoning": "Why this score..."
    }
  ],

  "crossPaperConnections": [
    {
      "existingPaperId": "ID from existing papers above",
      "connectionType": "supports" | "contradicts" | "extends" | "uses-method" | "same-topic",
      "reasoning": "How these papers connect...",
      "confidence": 0.0-1.0
    }
  ],

  "gapsAddressed": ["Gaps in the literature this paper helps address..."],
  "newGapsRevealed": ["New gaps or questions this paper reveals..."]
}`;
}

// =============================================================================
// Response Parser
// =============================================================================

export function parseThesisIntegrationResponse(
  response: Record<string, unknown>,
  existingPaperIds: string[]
): ThesisIntegrationResponse {
  // Parse overall relevance
  const rawRelevance = response.overallRelevance as Record<string, unknown> | undefined;
  const overallRelevance = {
    score: clampRelevanceScore(rawRelevance?.score),
    reasoning: String(rawRelevance?.reasoning || '').slice(0, 1000),
  };

  // Parse suggested role
  const rawRole = response.suggestedRole as Record<string, unknown> | undefined;
  const validRoles: ThesisRole[] = ['supports', 'contradicts', 'method', 'background', 'other'];
  const suggestedRole = {
    role: validRoles.includes(rawRole?.role as ThesisRole)
      ? (rawRole?.role as ThesisRole)
      : 'background',
    confidence: clampConfidence(rawRole?.confidence),
    reasoning: String(rawRole?.reasoning || '').slice(0, 1000),
  };

  // Parse takeaways
  const thesisFramedTakeaway = String(response.thesisFramedTakeaway || '').slice(0, 500);
  const alternativeTakeaways = Array.isArray(response.alternativeTakeaways)
    ? response.alternativeTakeaways.map(t => String(t || '')).filter(t => t.length > 0).slice(0, 3)
    : [];

  // Parse finding relevance
  const rawFindingRelevance = Array.isArray(response.findingRelevance) ? response.findingRelevance : [];
  const findingRelevance = rawFindingRelevance
    .filter((f): f is Record<string, unknown> => typeof f === 'object' && f !== null)
    .map(f => ({
      findingIndex: typeof f.findingIndex === 'number' ? f.findingIndex : 0,
      relevanceScore: clampRelevanceScore(f.relevanceScore),
      thesisDimension: String(f.thesisDimension || '').slice(0, 200),
      reasoning: String(f.reasoning || '').slice(0, 500),
    }));

  // Parse cross-paper connections (validate against existing paper IDs)
  const existingIdSet = new Set(existingPaperIds);
  const rawConnections = Array.isArray(response.crossPaperConnections) ? response.crossPaperConnections : [];
  const validConnectionTypes = ['supports', 'contradicts', 'extends', 'uses-method', 'same-topic'];
  const crossPaperConnections = rawConnections
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .filter(c => existingIdSet.has(String(c.existingPaperId)))
    .slice(0, 10)
    .map(c => ({
      existingPaperId: String(c.existingPaperId),
      connectionType: validConnectionTypes.includes(String(c.connectionType))
        ? (c.connectionType as 'supports' | 'contradicts' | 'extends' | 'uses-method' | 'same-topic')
        : 'same-topic',
      reasoning: String(c.reasoning || '').slice(0, 500),
      confidence: clampConfidence(c.confidence),
    }));

  // Parse gaps
  const gapsAddressed = Array.isArray(response.gapsAddressed)
    ? response.gapsAddressed.map(g => String(g || '')).filter(g => g.length > 0).slice(0, 5)
    : [];
  const newGapsRevealed = Array.isArray(response.newGapsRevealed)
    ? response.newGapsRevealed.map(g => String(g || '')).filter(g => g.length > 0).slice(0, 5)
    : [];

  return {
    overallRelevance,
    suggestedRole,
    thesisFramedTakeaway,
    alternativeTakeaways,
    findingRelevance,
    crossPaperConnections,
    gapsAddressed,
    newGapsRevealed,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get relevance label for display
 */
export function getRelevanceLabel(score: 1 | 2 | 3 | 4 | 5): {
  label: string;
  color: string;
  description: string;
} {
  switch (score) {
    case 5:
      return { label: 'Essential', color: 'green', description: 'Core paper for this thesis' };
    case 4:
      return { label: 'Highly Relevant', color: 'emerald', description: 'Direct evidence or important method' };
    case 3:
      return { label: 'Relevant', color: 'amber', description: 'Useful context or secondary evidence' };
    case 2:
      return { label: 'Tangential', color: 'orange', description: 'Weak or indirect connection' };
    case 1:
      return { label: 'Not Relevant', color: 'red', description: 'No meaningful connection' };
  }
}

/**
 * Get role description for display
 */
export function getRoleDescription(role: ThesisRole): string {
  switch (role) {
    case 'supports':
      return 'Provides evidence that strengthens your thesis';
    case 'contradicts':
      return 'Presents challenges or counter-evidence to your thesis';
    case 'method':
      return 'Provides methodology or tools you can use';
    case 'background':
      return 'Provides foundational context or definitions';
    case 'other':
      return 'Related to your thesis in other ways';
  }
}

/**
 * Calculate recommended action based on relevance
 */
export function getRecommendedAction(
  relevanceScore: 1 | 2 | 3 | 4 | 5,
  confidence: number
): 'include' | 'consider' | 'skip' {
  if (relevanceScore >= 4) return 'include';
  if (relevanceScore === 3 && confidence >= 0.7) return 'include';
  if (relevanceScore >= 2) return 'consider';
  return 'skip';
}
