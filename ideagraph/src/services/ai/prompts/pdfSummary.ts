// PDF Summary Prompts
// Tailored prompts for AI-assisted PDF reading

/**
 * PDF AI action types
 */
export type PDFAIAction =
  | 'summarize'
  | 'key-findings'
  | 'thesis-relevance'
  | 'methodology'
  | 'takeaway';

/**
 * System prompt for PDF reading assistant
 */
export const PDF_ASSISTANT_SYSTEM_PROMPT = `You are a research assistant helping academics understand papers efficiently. Your responses should be:

1. Accurate - Only state what the paper actually claims
2. Concise - Respect the researcher's time
3. Specific - Include concrete details, numbers, and findings
4. Academic - Use appropriate scholarly language
5. Honest - Acknowledge when information is unclear or missing

Do not make up information. If a section is not available, work with what you have.`;

/**
 * Context for PDF AI prompts
 */
export interface PDFPromptContext {
  title: string;
  authors?: string;
  abstract?: string | null;
  fullText?: string;
  sections?: {
    abstract?: string;
    introduction?: string;
    methods?: string;
    results?: string;
    discussion?: string;
    conclusion?: string;
  };
  thesis?: {
    title: string;
    description: string;
  };
  existingPapersSummary?: string;
}

/**
 * Build prompt for quick summary
 */
export function buildQuickSummaryPrompt(context: PDFPromptContext): string {
  const contentParts: string[] = [];

  if (context.abstract) {
    contentParts.push(`Abstract:\n${context.abstract}`);
  }

  if (context.sections?.introduction) {
    const intro = context.sections.introduction.slice(0, 2000);
    contentParts.push(`Introduction (excerpt):\n${intro}`);
  } else if (context.fullText) {
    const firstPages = context.fullText.slice(0, 3000);
    contentParts.push(`First pages:\n${firstPages}`);
  }

  return `Summarize this paper in 3-4 sentences.

PAPER:
Title: ${context.title}
${context.authors ? `Authors: ${context.authors}` : ''}

${contentParts.join('\n\n')}

Provide a summary that covers:
1. The main research question or objective
2. The approach or methodology used
3. Key findings or contributions

Keep your response between 100-200 words. Be specific and avoid generic statements.`;
}

/**
 * Build prompt for key findings extraction
 */
export function buildKeyFindingsPrompt(context: PDFPromptContext): string {
  const contentParts: string[] = [];

  if (context.abstract) {
    contentParts.push(`Abstract:\n${context.abstract}`);
  }

  if (context.sections?.results) {
    const results = context.sections.results.slice(0, 4000);
    contentParts.push(`Results Section:\n${results}`);
  }

  if (context.sections?.conclusion) {
    const conclusion = context.sections.conclusion.slice(0, 2000);
    contentParts.push(`Conclusion:\n${conclusion}`);
  }

  if (contentParts.length < 2 && context.fullText) {
    // Fallback to full text if sections not detected
    const text = context.fullText.slice(0, 5000);
    contentParts.push(`Paper content:\n${text}`);
  }

  return `Extract the key findings from this paper.

PAPER: ${context.title}

${contentParts.join('\n\n')}

List 3-6 key findings in order of importance. For each finding:
- State the finding clearly in one sentence
- Note the evidence type (experimental, computational, theoretical, meta-analysis)
- Include any quantitative results (percentages, p-values, effect sizes)

Format your response as a numbered list. Be specific and cite actual numbers from the paper when available.`;
}

/**
 * Build prompt for thesis relevance analysis
 */
export function buildThesisRelevancePrompt(context: PDFPromptContext): string {
  if (!context.thesis) {
    throw new Error('Thesis context required for relevance analysis');
  }

  const paperSummary = context.abstract || context.fullText?.slice(0, 2000) || '';

  return `Analyze how this paper relates to the researcher's thesis.

RESEARCHER'S THESIS:
"${context.thesis.title}"
${context.thesis.description}

${context.existingPapersSummary ? `EXISTING COLLECTION:\n${context.existingPapersSummary}\n` : ''}
PAPER BEING EVALUATED:
Title: ${context.title}
${context.authors ? `Authors: ${context.authors}` : ''}

${paperSummary}

Analyze and provide:

1. RELEVANCE SCORE (1-10): How directly does this paper address the thesis?

2. SUGGESTED ROLE: What role would this paper play?
   - supports: Provides evidence for the thesis
   - contradicts: Argues against or complicates the thesis
   - method: Provides methodology or techniques
   - background: General context or foundational knowledge
   - other: Tangentially related

3. KEY CONNECTIONS: What specific aspects connect to the thesis?

4. RECOMMENDATION: Should the researcher include this paper?
   - essential: Core paper for the thesis
   - recommended: Valuable addition
   - optional: Useful but not critical
   - skip: Not relevant enough

Be concise but specific. Focus on actionable insights.`;
}

/**
 * Build prompt for methodology extraction
 */
export function buildMethodologyPrompt(context: PDFPromptContext): string {
  const contentParts: string[] = [];

  if (context.abstract) {
    contentParts.push(`Abstract:\n${context.abstract}`);
  }

  if (context.sections?.methods) {
    const methods = context.sections.methods.slice(0, 5000);
    contentParts.push(`Methods Section:\n${methods}`);
  } else if (context.fullText) {
    // Try to find methods content in full text
    const text = context.fullText.slice(0, 6000);
    contentParts.push(`Paper content:\n${text}`);
  }

  return `Extract the methodology from this paper.

PAPER: ${context.title}

${contentParts.join('\n\n')}

Extract and structure the methodology:

1. STUDY DESIGN: What type of study is this?
   (experimental, observational, computational, theoretical, meta-analysis, review, etc.)

2. KEY METHODS: List the main methods or techniques used (3-5 items)

3. DATA/SAMPLES: What data sources, samples, or subjects were used?

4. ANALYSIS: How was the data analyzed?

5. TOOLS: Any specific software, tools, or protocols mentioned?

6. LIMITATIONS: Any methodological limitations acknowledged?

Be specific and use the paper's own terminology when possible.`;
}

/**
 * Build prompt for takeaway generation
 */
export function buildTakeawayPrompt(context: PDFPromptContext): string {
  if (!context.thesis) {
    // Generic takeaway without thesis context
    return `Generate a one-sentence takeaway for this paper.

PAPER: ${context.title}
${context.authors ? `Authors: ${context.authors}` : ''}

${context.abstract || context.fullText?.slice(0, 2000) || ''}

Write a single sentence (50-200 characters) that captures:
- The main contribution or finding
- Why it matters

The takeaway should be specific enough to be useful 6 months from now. Avoid generic statements like "This paper studies X."`;
  }

  const paperContent = context.abstract || context.fullText?.slice(0, 2000) || '';

  return `Generate a thesis-relevant takeaway for this paper.

RESEARCHER'S THESIS:
"${context.thesis.title}"
${context.thesis.description}

PAPER:
Title: ${context.title}
${context.authors ? `Authors: ${context.authors}` : ''}

${paperContent}

Generate a takeaway that:
1. Is ONE clear sentence (50-200 characters)
2. Frames the insight relative to THIS researcher's thesis
3. Captures the main contribution, not just the topic
4. Is specific enough to be useful 6 months from now

Also provide 2 alternative framings.

Format:
TAKEAWAY: [Your main takeaway]

ALTERNATIVES:
1. [Alternative framing 1]
2. [Alternative framing 2]`;
}

/**
 * Parse takeaway response into structured format
 */
export interface TakeawayResponse {
  takeaway: string;
  alternatives: string[];
}

export function parseTakeawayResponse(response: string): TakeawayResponse {
  const lines = response.split('\n');
  let takeaway = '';
  const alternatives: string[] = [];
  let inAlternatives = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('TAKEAWAY:')) {
      takeaway = trimmed.replace('TAKEAWAY:', '').trim();
    } else if (trimmed.startsWith('ALTERNATIVES:')) {
      inAlternatives = true;
    } else if (inAlternatives && /^[12]\./.test(trimmed)) {
      alternatives.push(trimmed.replace(/^[12]\.\s*/, '').trim());
    }
  }

  // Fallback: if no structured format, use the whole response as takeaway
  if (!takeaway && response.trim()) {
    takeaway = response.trim().split('\n')[0];
  }

  return { takeaway, alternatives };
}

/**
 * Get prompt builder for action type
 */
export function getPromptBuilder(action: PDFAIAction): (context: PDFPromptContext) => string {
  switch (action) {
    case 'summarize':
      return buildQuickSummaryPrompt;
    case 'key-findings':
      return buildKeyFindingsPrompt;
    case 'thesis-relevance':
      return buildThesisRelevancePrompt;
    case 'methodology':
      return buildMethodologyPrompt;
    case 'takeaway':
      return buildTakeawayPrompt;
    default:
      throw new Error(`Unknown PDF AI action: ${action}`);
  }
}

/**
 * Estimate token usage for an action
 */
export function estimateTokenUsage(action: PDFAIAction, context: PDFPromptContext): number {
  const prompt = getPromptBuilder(action)(context);
  // Rough estimate: 1 token per 4 characters
  const inputTokens = Math.ceil(prompt.length / 4);

  // Estimated output tokens by action
  const outputEstimates: Record<PDFAIAction, number> = {
    'summarize': 200,
    'key-findings': 400,
    'thesis-relevance': 350,
    'methodology': 400,
    'takeaway': 150,
  };

  return inputTokens + outputEstimates[action];
}

/**
 * Recommended model for each action
 */
export function getRecommendedModel(action: PDFAIAction): 'fast' | 'standard' | 'advanced' {
  switch (action) {
    case 'summarize':
    case 'methodology':
    case 'takeaway':
      return 'fast'; // Haiku - quick, focused tasks
    case 'key-findings':
      return 'fast'; // Haiku - structured extraction
    case 'thesis-relevance':
      return 'standard'; // Sonnet - needs more reasoning
    default:
      return 'fast';
  }
}
