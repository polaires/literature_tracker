// Adaptive AI Behavior
// Adjusts AI behavior and messaging based on collection size

import type { Paper } from '../../../types';

/**
 * Collection size tiers for adaptive behavior
 */
export type CollectionTier = 'cold-start' | 'growing' | 'established' | 'large';

/**
 * Configuration for adaptive AI behavior
 */
export interface AdaptiveConfig {
  tier: CollectionTier;
  paperCount: number;
  maxContextPapers: number;
  includeAbstracts: boolean;
  autoTrigger: boolean;
  showConnectionSuggestions: boolean;
  showRoleSuggestion: boolean;
  showTakeawaySuggestion: boolean;
  priorityFeatures: string[];
  guidance: string | null;
}

/**
 * Determine collection tier from paper count
 */
export function getCollectionTier(paperCount: number): CollectionTier {
  if (paperCount <= 2) return 'cold-start';
  if (paperCount <= 10) return 'growing';
  if (paperCount <= 50) return 'established';
  return 'large';
}

/**
 * Get adaptive configuration based on collection state
 */
export function getAdaptiveConfig(papers: Paper[]): AdaptiveConfig {
  const paperCount = papers.length;
  const tier = getCollectionTier(paperCount);

  switch (tier) {
    case 'cold-start':
      return {
        tier,
        paperCount,
        maxContextPapers: 10,
        includeAbstracts: true,
        autoTrigger: false, // Not enough context to provide meaningful suggestions
        showConnectionSuggestions: false, // Need papers to connect to
        showRoleSuggestion: false, // Need thesis context built up
        showTakeawaySuggestion: true, // Can always help with takeaway
        priorityFeatures: ['takeaway'],
        guidance: 'Add 3+ papers to unlock AI-powered role and connection suggestions.',
      };

    case 'growing':
      return {
        tier,
        paperCount,
        maxContextPapers: 15,
        includeAbstracts: true,
        autoTrigger: true, // Good time to start helping
        showConnectionSuggestions: true,
        showRoleSuggestion: true,
        showTakeawaySuggestion: true,
        priorityFeatures: ['takeaway', 'role', 'connections'],
        guidance: null,
      };

    case 'established':
      return {
        tier,
        paperCount,
        maxContextPapers: 20,
        includeAbstracts: false, // Use takeaways to save tokens
        autoTrigger: true,
        showConnectionSuggestions: true,
        showRoleSuggestion: true,
        showTakeawaySuggestion: true,
        priorityFeatures: ['connections', 'role', 'takeaway'],
        guidance: null,
      };

    case 'large':
      return {
        tier,
        paperCount,
        maxContextPapers: 15, // Limit context to manage tokens
        includeAbstracts: false,
        autoTrigger: false, // Let user decide to avoid token costs
        showConnectionSuggestions: true,
        showRoleSuggestion: true,
        showTakeawaySuggestion: true,
        priorityFeatures: ['connections', 'role'],
        guidance: 'Large collection: AI uses selective context. Click to analyze.',
      };
  }
}

/**
 * Get prompt enhancements based on collection tier
 */
export function getAdaptivePromptEnhancements(
  tier: CollectionTier,
  _papers?: Paper[]
): {
  contextStrategy: string;
  confidenceAdjustment: string;
  focusAreas: string[];
} {
  switch (tier) {
    case 'cold-start':
      return {
        contextStrategy: 'This is a new literature collection with very few papers. Focus on general academic classification rather than thesis-specific roles.',
        confidenceAdjustment: 'Express lower confidence in role suggestions since there are few papers to compare against.',
        focusAreas: ['Generate a high-quality takeaway', 'Provide general topic categorization'],
      };

    case 'growing':
      return {
        contextStrategy: 'This is a developing collection. The researcher is building their literature base.',
        confidenceAdjustment: 'Moderate confidence - there is enough context for meaningful suggestions.',
        focusAreas: [
          'Suggest how this paper relates to existing papers',
          'Identify potential connections',
          'Help establish thesis roles',
        ],
      };

    case 'established':
      return {
        contextStrategy: 'This is an established collection. Focus on identifying specific connections and gaps.',
        confidenceAdjustment: 'Higher confidence based on rich context.',
        focusAreas: [
          'Identify specific connections to existing papers',
          'Suggest precise thesis role based on existing coverage',
          'Note if paper fills gaps or provides redundant coverage',
        ],
      };

    case 'large':
      return {
        contextStrategy: 'This is a large collection. Context has been sampled. Focus on the most relevant comparisons.',
        confidenceAdjustment: 'Confidence may be limited since only a sample of papers is included for analysis.',
        focusAreas: [
          'Compare to the most relevant existing papers',
          'Identify if this adds unique value or overlaps',
          'Suggest connections to related clusters',
        ],
      };
  }
}

/**
 * Determine if AI should auto-trigger based on context
 */
export function shouldAutoTriggerAI(
  papers: Paper[],
  hasAbstract: boolean
): boolean {
  const config = getAdaptiveConfig(papers);

  // Need abstract for meaningful analysis
  if (!hasAbstract) return false;

  return config.autoTrigger;
}

/**
 * Get appropriate cold start message
 */
export function getColdStartMessage(
  tier: CollectionTier,
  feature: 'role' | 'connection' | 'takeaway' | 'full'
): string | null {
  if (tier !== 'cold-start') return null;

  switch (feature) {
    case 'role':
      return 'Add 3+ papers to enable AI role suggestions. The AI needs context from your collection to suggest appropriate thesis roles.';
    case 'connection':
      return 'Add 3+ papers to see connection suggestions. Connections are suggested between papers in your collection.';
    case 'takeaway':
      return null; // Takeaway is always available
    case 'full':
      return 'Your collection is just starting! AI features become more powerful with 3+ papers. For now, focus on adding papers and writing takeaways.';
  }
}

/**
 * Select papers to include in context based on tier and relevance
 */
export function selectContextPapers(
  allPapers: Paper[],
  targetPaper: { title: string; abstract?: string | null },
  config: AdaptiveConfig
): Paper[] {
  if (allPapers.length <= config.maxContextPapers) {
    return allPapers;
  }

  // Score papers by relevance to target
  const targetWords = new Set(
    `${targetPaper.title} ${targetPaper.abstract || ''}`
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3)
  );

  const scored = allPapers.map(paper => {
    let score = 0;

    // Word overlap
    const paperWords = new Set(
      `${paper.title} ${paper.takeaway}`
        .toLowerCase()
        .split(/\W+/)
        .filter(w => w.length > 3)
    );
    const overlap = [...targetWords].filter(w => paperWords.has(w)).length;
    score += overlap * 2;

    // Recency bonus
    if (paper.year) {
      const yearsOld = new Date().getFullYear() - paper.year;
      if (yearsOld <= 2) score += 5;
      else if (yearsOld <= 5) score += 2;
    }

    // Role diversity (include variety)
    if (paper.thesisRole === 'method') score += 3;
    if (paper.thesisRole === 'contradicts') score += 4; // Important to include

    return { paper, score };
  });

  // Sort by score and take top N
  scored.sort((a, b) => b.score - a.score);

  // Ensure role diversity in selection
  const selected: Paper[] = [];
  const selectedRoles = new Set<string>();

  // First pass: one of each role
  for (const role of ['supports', 'contradicts', 'method', 'background'] as const) {
    const candidate = scored.find(
      s => s.paper.thesisRole === role && !selected.includes(s.paper)
    );
    if (candidate && selected.length < config.maxContextPapers) {
      selected.push(candidate.paper);
      selectedRoles.add(role);
    }
  }

  // Second pass: fill with highest scoring
  for (const { paper } of scored) {
    if (selected.length >= config.maxContextPapers) break;
    if (!selected.includes(paper)) {
      selected.push(paper);
    }
  }

  return selected;
}
