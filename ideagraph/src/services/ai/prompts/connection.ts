// Connection Suggestion Prompts
// These prompts analyze user's synthesis data to suggest paper connections

import type { AIRequestContext, ConnectionSuggestion } from '../types';
import type { ConnectionType } from '../../../types';

/**
 * System prompt for connection suggestions
 */
export const CONNECTION_SYSTEM_PROMPT = `You are an expert research assistant helping academics identify intellectual relationships between papers in their literature collection.

Your role is to analyze the researcher's own synthesis (takeaways, arguments, evidence) to suggest meaningful connections they may have missed.

Key principles:
1. Ground suggestions in the user's own notes, not just paper metadata
2. Be specific about WHY a connection exists
3. Only suggest high-confidence connections (>= 0.6)
4. Prefer connections supported by multiple signals (takeaway + argument + citation)
5. Never invent information not present in the provided data

Connection types and when to use them:
- supports: Paper B provides evidence or arguments that strengthen Paper A's claims
- contradicts: Papers reach opposite conclusions or make incompatible claims
- extends: Paper B builds upon Paper A's work (methodology, theory, or findings)
- uses-method: Paper B uses a methodology introduced or refined by Paper A
- same-topic: Papers address the same topic but without direct intellectual relationship
- reviews: One paper is a review that covers the other
- replicates: Paper B attempts to reproduce Paper A's results
- critiques: Paper B offers critical analysis of Paper A`;

/**
 * Main prompt template for suggesting connections for a specific paper
 */
export function buildConnectionSuggestionPrompt(context: AIRequestContext): string {
  const { thesis, targetPaper, relatedPapers, existingConnections, citationData } = context;

  if (!targetPaper) {
    throw new Error('Target paper is required for connection suggestions');
  }

  // Format existing connections to avoid duplicates
  const existingPairs = new Set(
    existingConnections.map(c =>
      `${c.fromPaperId}-${c.toPaperId}`
    )
  );

  // Format candidate papers
  const candidatePapers = relatedPapers
    .filter(p => p.id !== targetPaper.id)
    .filter(p => !existingPairs.has(`${targetPaper.id}-${p.id}`) && !existingPairs.has(`${p.id}-${targetPaper.id}`))
    .map(p => formatPaperForPrompt(p))
    .join('\n\n---\n\n');

  // Format citation data if available
  let citationSection = '';
  if (citationData) {
    const citedBy = citationData.papersCitedByTarget.length > 0
      ? `Papers cited by target: ${citationData.papersCitedByTarget.join(', ')}`
      : '';
    const citing = citationData.papersCitingTarget.length > 0
      ? `Papers citing target: ${citationData.papersCitingTarget.join(', ')}`
      : '';
    if (citedBy || citing) {
      citationSection = `\n\nCITATION RELATIONSHIPS:\n${citedBy}\n${citing}`;
    }
  }

  // Format existing connections
  const connectionsSection = existingConnections.length > 0
    ? `\n\nEXISTING CONNECTIONS (do not suggest duplicates):\n${existingConnections.map(c =>
        `- ${c.fromPaperTitle} → ${c.toPaperTitle}: ${c.type}${c.note ? ` (${c.note})` : ''}`
      ).join('\n')}`
    : '';

  return `RESEARCHER'S THESIS:
"${thesis.title}"
${thesis.description}

TARGET PAPER TO FIND CONNECTIONS FOR:
${formatPaperForPrompt(targetPaper)}

CANDIDATE PAPERS IN COLLECTION:
${candidatePapers || 'No other papers in collection'}
${citationSection}
${connectionsSection}

Analyze the TARGET paper against each CANDIDATE paper. For each potential connection you identify:

1. Consider the researcher's takeaways - do they suggest relationships?
2. Compare arguments - do papers make similar/opposing claims?
3. Look at evidence types - do papers use related methodologies?
4. Check citation data - does a citation relationship exist?

For each suggested connection, provide:
- paperId: The candidate paper's ID
- connectionType: One of [supports, contradicts, extends, uses-method, same-topic, reviews, replicates, critiques]
- confidence: 0.0-1.0 (only include if >= 0.6)
- reasoning: 1-2 sentences explaining WHY this connection exists
- evidence: Array of specific quotes/references from the researcher's notes that support this connection

Return a JSON array of suggestions. Maximum 5 suggestions, ordered by confidence.

Example output format:
[
  {
    "paperId": "abc-123",
    "connectionType": "contradicts",
    "confidence": 0.85,
    "reasoning": "Both papers study X but reach opposite conclusions. The target paper claims Y increases Z, while this paper claims Y decreases Z.",
    "evidence": [
      {"type": "takeaway", "text": "Target takeaway mentions Y increases Z"},
      {"type": "argument", "text": "Candidate argues Y decreases Z with strong evidence"}
    ]
  }
]

If no connections meet the confidence threshold, return an empty array: []`;
}

/**
 * Prompt for bulk connection analysis across a thesis
 */
export function buildBulkConnectionPrompt(context: AIRequestContext): string {
  const { thesis, relatedPapers, existingConnections } = context;

  // Group papers by thesis role for context
  const papersByRole = relatedPapers.reduce((acc, p) => {
    if (!acc[p.thesisRole]) acc[p.thesisRole] = [];
    acc[p.thesisRole].push(p);
    return acc;
  }, {} as Record<string, typeof relatedPapers>);

  const papersSummary = Object.entries(papersByRole)
    .map(([role, papers]) =>
      `${role.toUpperCase()} (${papers.length} papers):\n${papers.map(p =>
        `  - [${p.id}] ${p.title}\n    Takeaway: "${p.takeaway}"`
      ).join('\n')}`
    )
    .join('\n\n');

  const existingCount = existingConnections.length;

  return `RESEARCHER'S THESIS:
"${thesis.title}"
${thesis.description}

PAPER COLLECTION BY ROLE:
${papersSummary}

EXISTING CONNECTIONS: ${existingCount} connections already created

Analyze this literature collection to identify MISSING connections between papers.

Focus on:
1. Papers with similar or opposing takeaways that aren't connected
2. Papers that should logically relate based on their thesis roles
3. Potential contradictions that the researcher should be aware of
4. Methodological relationships between papers

Return a JSON array of suggested connections:
[
  {
    "fromPaperId": "...",
    "toPaperId": "...",
    "connectionType": "...",
    "confidence": 0.0-1.0,
    "reasoning": "..."
  }
]

Maximum 10 suggestions, ordered by confidence (>= 0.6 only).`;
}

/**
 * Format a paper for inclusion in prompts
 */
function formatPaperForPrompt(paper: {
  id: string;
  title: string;
  authors: string;
  year: number | null;
  abstract: string | null;
  takeaway: string;
  thesisRole: string;
  arguments: Array<{ claim: string; strength?: string | null; yourAssessment?: string | null }>;
  evidence: Array<{ description: string; type: string }>;
}): string {
  const parts = [
    `ID: ${paper.id}`,
    `Title: ${paper.title}`,
    `Authors: ${paper.authors}`,
    paper.year ? `Year: ${paper.year}` : null,
    `Thesis Role: ${paper.thesisRole}`,
    `\nRESEARCHER'S TAKEAWAY: "${paper.takeaway}"`,
  ];

  if (paper.arguments.length > 0) {
    const args = paper.arguments
      .map(a => {
        const strength = a.strength ? ` [${a.strength}]` : '';
        const assessment = a.yourAssessment ? ` (researcher ${a.yourAssessment}s)` : '';
        return `  • ${a.claim}${strength}${assessment}`;
      })
      .join('\n');
    parts.push(`\nARGUMENTS IDENTIFIED:\n${args}`);
  }

  if (paper.evidence.length > 0) {
    const evidence = paper.evidence
      .map(e => `  • [${e.type}] ${e.description}`)
      .join('\n');
    parts.push(`\nEVIDENCE:\n${evidence}`);
  }

  if (paper.abstract) {
    // Truncate abstract if too long
    const abstract = paper.abstract.length > 500
      ? paper.abstract.substring(0, 500) + '...'
      : paper.abstract;
    parts.push(`\nABSTRACT: ${abstract}`);
  }

  return parts.filter(Boolean).join('\n');
}

/**
 * Parse AI response into ConnectionSuggestion objects
 */
export function parseConnectionSuggestions(
  response: unknown[],
  targetPaperId: string,
  papers: Array<{ id: string; title: string }>
): ConnectionSuggestion[] {
  const paperMap = new Map(papers.map(p => [p.id, p.title]));
  const now = new Date().toISOString();

  return response
    .filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null
    )
    .map((item, index) => {
      const paperId = String(item.paperId || '');
      const paperTitle = paperMap.get(paperId) || 'Unknown Paper';

      return {
        id: `conn-sugg-${Date.now()}-${index}`,
        targetPaperId,
        suggestedPaperId: paperId,
        suggestedPaperTitle: paperTitle,
        connectionType: (item.connectionType || 'same-topic') as ConnectionType,
        confidence: typeof item.confidence === 'number' ? item.confidence : 0.5,
        reasoning: String(item.reasoning || 'No reasoning provided'),
        evidence: Array.isArray(item.evidence)
          ? item.evidence.map((e: unknown) => ({
              type: (e as Record<string, unknown>)?.type as 'takeaway' | 'argument' | 'citation' | 'abstract' || 'takeaway',
              paperId: String((e as Record<string, unknown>)?.paperId || targetPaperId),
              text: String((e as Record<string, unknown>)?.text || ''),
              relevance: String((e as Record<string, unknown>)?.relevance || ''),
            }))
          : [],
        source: 'combined' as const,
        createdAt: now,
      };
    })
    .filter(s => s.suggestedPaperId && s.confidence >= 0.6);
}
