// Takeaway Suggestion Prompts
// These prompts help researchers articulate context-aware takeaways

import type { AIRequestContext, TakeawaySuggestion } from '../types';

/**
 * System prompt for takeaway suggestions
 */
export const TAKEAWAY_SYSTEM_PROMPT = `You are an expert research assistant helping academics articulate the key insights from papers in the context of their specific research.

Your role is to help transform generic paper summaries into thesis-relevant takeaways that capture what matters for THIS researcher's work.

Key principles:
1. Frame the insight relative to the researcher's thesis
2. Be specific and actionable, not generic
3. Focus on the contribution, not just the topic
4. Write from the researcher's perspective
5. Keep to one clear sentence (10-500 characters)

Good takeaway examples:
- "AlphaFold2 achieves near-experimental accuracy for single-domain proteins, making it viable for my structure-based drug design pipeline."
- "This meta-analysis challenges the consensus on X, suggesting I need to re-evaluate my core assumption about Y."
- "The protocol described here could replace our current approach with 3x faster processing time."

Bad takeaway examples:
- "This paper is about protein folding." (too generic)
- "Interesting paper on machine learning." (doesn't capture insight)
- "The authors present results." (no specific value)`;

/**
 * Main prompt template for suggesting a takeaway
 */
export function buildTakeawaySuggestionPrompt(context: AIRequestContext): string {
  const { thesis, targetPaper, relatedPapers, highlights } = context;

  if (!targetPaper) {
    throw new Error('Target paper is required for takeaway suggestions');
  }

  // Format related papers for context
  const relatedContext = relatedPapers
    .filter(p => p.id !== targetPaper.id)
    .slice(0, 5) // Limit to 5 most relevant
    .map(p => `- "${p.takeaway}" (${p.thesisRole})`)
    .join('\n');

  // Format highlights if available
  let highlightsSection = '';
  if (highlights && highlights.length > 0) {
    const highlightTexts = highlights
      .slice(0, 10) // Limit highlights
      .map(h => {
        const comment = h.comment ? ` [Note: ${h.comment}]` : '';
        return `  • "${h.text}"${comment}`;
      })
      .join('\n');
    highlightsSection = `\n\nRESEARCHER'S PDF HIGHLIGHTS:\n${highlightTexts}`;
  }

  return `RESEARCHER'S THESIS:
"${thesis.title}"
${thesis.description}

PAPER TO SUMMARIZE:
Title: ${targetPaper.title}
Authors: ${targetPaper.authors}
Year: ${targetPaper.year || 'Unknown'}
${targetPaper.abstract ? `\nAbstract: ${targetPaper.abstract}` : ''}

RELATED PAPERS IN COLLECTION (for context and style):
${relatedContext || 'No other papers yet'}
${highlightsSection}

Generate a takeaway that:
1. Is ONE clear sentence (10-500 characters)
2. Focuses on what matters for THIS researcher's thesis: "${thesis.title}"
3. Captures the main finding/contribution, not just the topic
4. Is specific enough to be useful 6 months from now
5. Uses language consistent with the related paper takeaways above

Return JSON:
{
  "suggestion": "The main takeaway text (10-500 chars)...",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this framing is relevant to the thesis...",
  "alternatives": [
    "Alternative framing 1...",
    "Alternative framing 2..."
  ]
}`;
}

/**
 * Prompt for refining an existing takeaway
 */
export function buildTakeawayRefinementPrompt(
  context: AIRequestContext,
  currentTakeaway: string
): string {
  const { thesis, targetPaper, relatedPapers } = context;

  if (!targetPaper) {
    throw new Error('Target paper is required for takeaway refinement');
  }

  const relatedContext = relatedPapers
    .filter(p => p.id !== targetPaper.id)
    .slice(0, 5)
    .map(p => `- "${p.takeaway}" (${p.thesisRole})`)
    .join('\n');

  return `RESEARCHER'S THESIS:
"${thesis.title}"
${thesis.description}

PAPER:
Title: ${targetPaper.title}
${targetPaper.abstract ? `Abstract: ${targetPaper.abstract.substring(0, 500)}...` : ''}

CURRENT TAKEAWAY (researcher's draft):
"${currentTakeaway}"

RELATED PAPER TAKEAWAYS (for style reference):
${relatedContext || 'No other papers yet'}

The researcher wants to improve their takeaway. Suggest a refined version that:
1. Maintains their core insight
2. Better connects to their thesis: "${thesis.title}"
3. Is more specific and actionable
4. Stays within 10-500 characters

Return JSON:
{
  "suggestion": "The refined takeaway...",
  "confidence": 0.0-1.0,
  "reasoning": "What was improved and why...",
  "alternatives": [
    "Alternative refinement 1...",
    "Alternative refinement 2..."
  ]
}`;
}

/**
 * Parse AI response into TakeawaySuggestion object
 */
export function parseTakeawaySuggestion(
  response: Record<string, unknown>,
  paperId: string,
  context: AIRequestContext
): TakeawaySuggestion {
  const now = new Date().toISOString();

  return {
    id: `takeaway-sugg-${Date.now()}`,
    paperId,
    suggestion: String(response.suggestion || ''),
    confidence: typeof response.confidence === 'number' ? response.confidence : 0.5,
    reasoning: String(response.reasoning || ''),
    alternatives: Array.isArray(response.alternatives)
      ? response.alternatives.map(String)
      : [],
    basedOn: {
      thesis: true,
      abstract: !!context.targetPaper?.abstract,
      relatedPapers: context.relatedPapers.map(p => p.id),
      highlights: context.highlights && context.highlights.length > 0,
    },
    createdAt: now,
  };
}
