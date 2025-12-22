// Argument Extraction Prompts
// These prompts extract claims and evidence from papers

import type { AIRequestContext, ArgumentSuggestion } from '../types';

/**
 * System prompt for argument extraction
 */
export const ARGUMENT_SYSTEM_PROMPT = `You are an expert research assistant helping academics identify and evaluate claims made in academic papers.

Your role is to extract the key arguments (claims) from papers and classify their supporting evidence.

Key principles:
1. Focus on claims that are central to the paper's contribution
2. Distinguish between strong claims (with solid evidence) and weak claims (speculative)
3. Classify evidence types accurately
4. Extract verbatim quotes when possible
5. Prioritize claims relevant to the researcher's focus

Evidence types:
- experimental: Lab experiments, clinical trials, empirical measurements
- computational: Simulations, modeling, in silico analysis
- theoretical: Mathematical proofs, logical arguments, framework development
- meta-analysis: Systematic reviews, pooled analyses
- other: Case studies, expert opinion, qualitative data

Strength indicators:
- strong: Clear evidence, statistical significance, replicated results
- moderate: Good evidence but with limitations, single study
- weak: Preliminary findings, small samples, speculative conclusions`;

/**
 * Main prompt template for extracting arguments
 */
export function buildArgumentExtractionPrompt(context: AIRequestContext): string {
  const { thesis, targetPaper, highlights } = context;

  if (!targetPaper) {
    throw new Error('Target paper is required for argument extraction');
  }

  // Format highlights if available
  let highlightsSection = '';
  if (highlights && highlights.length > 0) {
    const highlightTexts = highlights
      .map(h => {
        const comment = h.comment ? ` [Researcher note: ${h.comment}]` : '';
        return `  • "${h.text}"${comment}`;
      })
      .join('\n');
    highlightsSection = `\n\nRESEARCHER'S PDF HIGHLIGHTS (pay special attention to these):\n${highlightTexts}`;
  }

  return `RESEARCHER'S THESIS:
"${thesis.title}"
${thesis.description}

PAPER TO ANALYZE:
Title: ${targetPaper.title}
Authors: ${targetPaper.authors}
Year: ${targetPaper.year || 'Unknown'}

RESEARCHER'S TAKEAWAY:
"${targetPaper.takeaway}"

${targetPaper.abstract ? `ABSTRACT:\n${targetPaper.abstract}` : ''}
${highlightsSection}

Extract the key arguments (claims) from this paper. For each argument:

1. Identify the specific claim being made
2. Assess the strength based on language and evidence
3. Find supporting evidence snippets from the abstract or highlights
4. Classify the evidence type

Focus on:
- Claims central to the paper's contribution
- Claims relevant to the researcher's thesis
- Claims the researcher highlighted in their PDF

Return a JSON array of arguments:
[
  {
    "claim": "The specific claim text (1-2 sentences)",
    "strengthSuggestion": "strong" | "moderate" | "weak",
    "confidence": 0.0-1.0,
    "evidenceSnippets": ["Quote 1...", "Quote 2..."],
    "evidenceType": "experimental" | "computational" | "theoretical" | "meta-analysis" | "other",
    "source": "abstract" | "highlights" | "combined"
  }
]

Maximum 5 arguments, ordered by relevance to the thesis.
If no clear arguments can be extracted, return an empty array: []`;
}

/**
 * Prompt for classifying evidence type from a description
 */
export function buildEvidenceClassificationPrompt(evidenceDescription: string): string {
  return `Classify the following evidence description into one of these types:
- experimental: Lab experiments, clinical trials, empirical measurements
- computational: Simulations, modeling, in silico analysis
- theoretical: Mathematical proofs, logical arguments, framework development
- meta-analysis: Systematic reviews, pooled analyses
- other: Case studies, expert opinion, qualitative data

Evidence description:
"${evidenceDescription}"

Return JSON:
{
  "type": "experimental" | "computational" | "theoretical" | "meta-analysis" | "other",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation..."
}`;
}

/**
 * Parse AI response into ArgumentSuggestion objects
 */
export function parseArgumentSuggestions(
  response: unknown[],
  paperId: string
): ArgumentSuggestion[] {
  return response
    .filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null
    )
    .map((item, index) => ({
      id: `arg-sugg-${Date.now()}-${index}`,
      paperId,
      claim: String(item.claim || ''),
      strengthSuggestion: validateStrength(item.strengthSuggestion),
      confidence: typeof item.confidence === 'number' ? item.confidence : 0.5,
      evidenceSnippets: Array.isArray(item.evidenceSnippets)
        ? item.evidenceSnippets.map(String)
        : [],
      evidenceType: validateEvidenceType(item.evidenceType),
      source: validateSource(item.source),
    }))
    .filter(a => a.claim.length > 0);
}

function validateStrength(value: unknown): 'strong' | 'moderate' | 'weak' | null {
  if (value === 'strong' || value === 'moderate' || value === 'weak') {
    return value;
  }
  return null;
}

function validateEvidenceType(
  value: unknown
): 'experimental' | 'computational' | 'theoretical' | 'meta-analysis' | 'other' {
  const validTypes = ['experimental', 'computational', 'theoretical', 'meta-analysis', 'other'];
  if (typeof value === 'string' && validTypes.includes(value)) {
    return value as ArgumentSuggestion['evidenceType'];
  }
  return 'other';
}

function validateSource(value: unknown): 'abstract' | 'highlights' | 'combined' {
  if (value === 'abstract' || value === 'highlights' || value === 'combined') {
    return value;
  }
  return 'abstract';
}
