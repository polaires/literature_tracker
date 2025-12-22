// Gap Analysis Prompts
// These prompts identify research gaps in literature collections

import type { AIRequestContext, GapSuggestion } from '../types';

/**
 * System prompt for gap analysis
 */
export const GAP_ANALYSIS_SYSTEM_PROMPT = `You are an expert research methodology consultant helping academics identify gaps in their literature coverage.

Your role is to analyze a collection of papers and identify what's MISSING that would strengthen the researcher's understanding of their topic.

Gap types to consider:
- knowledge: Missing understanding in a key area (unexplored questions)
- methodological: Lack of certain study types (e.g., no RCTs, no longitudinal studies)
- population: Limited scope of subjects/contexts studied
- theoretical: Missing conceptual frameworks or theoretical perspectives
- temporal: Outdated literature or missing recent developments
- geographic: Limited geographic/cultural coverage
- contradictory: Unresolved disagreements that need resolution

Key principles:
1. Ground gap identification in the actual papers present
2. Consider the researcher's thesis when assessing gap severity
3. Suggest specific research questions to address each gap
4. Prioritize gaps that would most strengthen the thesis argument
5. Don't suggest gaps that are outside the thesis scope`;

/**
 * Main prompt template for gap analysis
 */
export function buildGapAnalysisPrompt(context: AIRequestContext): string {
  const { thesis, relatedPapers, existingConnections } = context;

  // Calculate statistics
  const totalPapers = relatedPapers.length;
  const currentYear = new Date().getFullYear();

  // Group by role
  const roleBreakdown = relatedPapers.reduce((acc, p) => {
    acc[p.thesisRole] = (acc[p.thesisRole] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by year
  const yearBreakdown = relatedPapers.reduce((acc, p) => {
    const decade = p.year ? Math.floor(p.year / 5) * 5 : 'unknown';
    acc[decade] = (acc[decade] || 0) + 1;
    return acc;
  }, {} as Record<string | number, number>);

  // Collect all evidence types
  const evidenceTypes = relatedPapers.flatMap(p => p.evidence.map(e => e.type));
  const evidenceBreakdown = evidenceTypes.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find contradictions
  const contradictions = existingConnections
    .filter(c => c.type === 'contradicts')
    .map(c => `${c.fromPaperTitle} vs ${c.toPaperTitle}: ${c.note || 'No note'}`);

  // Format paper summaries
  const paperSummaries = relatedPapers
    .map(p => {
      const args = p.arguments.length > 0
        ? `\n    Arguments: ${p.arguments.map(a => a.claim).join('; ')}`
        : '';
      return `  - [${p.thesisRole}] ${p.title} (${p.year || 'n.d.'})\n    Takeaway: "${p.takeaway}"${args}`;
    })
    .join('\n');

  return `RESEARCHER'S THESIS:
"${thesis.title}"
${thesis.description}

LITERATURE COLLECTION OVERVIEW:
Total papers: ${totalPapers}

Papers by thesis role:
${Object.entries(roleBreakdown).map(([role, count]) => `  - ${role}: ${count}`).join('\n')}

Papers by time period:
${Object.entries(yearBreakdown).map(([period, count]) => `  - ${period}s: ${count}`).join('\n')}

Evidence types present:
${Object.entries(evidenceBreakdown).map(([type, count]) => `  - ${type}: ${count}`).join('\n') || '  - No evidence recorded'}

${contradictions.length > 0 ? `\nIDENTIFIED CONTRADICTIONS:\n${contradictions.map(c => `  - ${c}`).join('\n')}` : ''}

PAPER DETAILS:
${paperSummaries}

Analyze this literature collection to identify GAPS that would weaken the researcher's thesis argument.

Consider:
1. What perspectives or evidence types are missing?
2. Are there recent developments (${currentYear - 3}-${currentYear}) not represented?
3. Are contradictions resolved or do they need more investigation?
4. What questions remain unanswered by the current collection?
5. What methodological approaches would strengthen the evidence base?

For each gap identified:
- type: The gap category
- title: Short descriptive title (5-10 words)
- description: 2-3 sentences explaining the gap and its impact
- priority: "high" (threatens thesis), "medium" (weakens argument), "low" (nice to have)
- confidence: 0.0-1.0
- relatedPaperIds: IDs of papers that highlight this gap
- futureResearchQuestion: A specific research question to address this gap

Return a JSON array of gaps:
[
  {
    "type": "methodological" | "knowledge" | "temporal" | "theoretical" | "population" | "geographic" | "contradictory",
    "title": "...",
    "description": "...",
    "priority": "high" | "medium" | "low",
    "confidence": 0.0-1.0,
    "relatedPaperIds": ["id1", "id2"],
    "futureResearchQuestion": "..."
  }
]

Maximum 5 gaps, ordered by priority and confidence.
Only include gaps with confidence >= 0.6.`;
}

/**
 * Parse AI response into GapSuggestion objects
 */
export function parseGapSuggestions(
  response: unknown[],
  thesisId: string
): GapSuggestion[] {
  const now = new Date().toISOString();

  return response
    .filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null
    )
    .map((item, index) => ({
      id: `gap-sugg-${Date.now()}-${index}`,
      thesisId,
      type: validateGapType(item.type),
      title: String(item.title || 'Unidentified Gap'),
      description: String(item.description || ''),
      priority: validatePriority(item.priority),
      confidence: typeof item.confidence === 'number' ? item.confidence : 0.5,
      relatedPaperIds: Array.isArray(item.relatedPaperIds)
        ? item.relatedPaperIds.map(String)
        : [],
      futureResearchQuestion: String(item.futureResearchQuestion || ''),
      evidenceSource: 'ai-inferred' as const,
      createdAt: now,
    }))
    .filter(g => g.confidence >= 0.6);
}

function validateGapType(
  value: unknown
): GapSuggestion['type'] {
  const validTypes = [
    'knowledge',
    'methodological',
    'population',
    'theoretical',
    'temporal',
    'geographic',
    'contradictory',
  ];
  if (typeof value === 'string' && validTypes.includes(value)) {
    return value as GapSuggestion['type'];
  }
  return 'knowledge';
}

function validatePriority(value: unknown): 'high' | 'medium' | 'low' {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'medium';
}
