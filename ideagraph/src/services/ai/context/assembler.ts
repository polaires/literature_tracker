// Context Assembler
// Builds context objects from app store data for AI prompts

import type {
  AIRequestContext,
  ThesisContext,
  PaperContext,
  ConnectionContext,
  HighlightContext,
} from '../types';
import type {
  Thesis,
  Paper,
  Connection,
  PDFAnnotation,
} from '../../../types';

/**
 * Build complete AI request context from app data
 */
export function buildAIContext(params: {
  thesis: Thesis;
  papers: Paper[];
  connections: Connection[];
  targetPaperId?: string;
  annotations?: PDFAnnotation[];
  citationData?: {
    papersCitedByTarget: string[];
    papersCitingTarget: string[];
  };
}): AIRequestContext {
  const { thesis, papers, connections, targetPaperId, annotations, citationData } = params;

  // Build thesis context
  const thesisContext: ThesisContext = {
    id: thesis.id,
    title: thesis.title,
    description: thesis.description,
  };

  // Find target paper if specified
  const targetPaper = targetPaperId
    ? papers.find(p => p.id === targetPaperId)
    : undefined;

  // Build paper contexts
  const paperContexts = papers.map(p => buildPaperContext(p));

  // Build connection contexts
  const connectionContexts = connections.map(c =>
    buildConnectionContext(c, papers)
  );

  // Build highlight contexts if annotations provided
  const highlights = annotations
    ? annotations
        .filter(a => a.type === 'highlight' && a.selectedText)
        .map(a => buildHighlightContext(a))
    : undefined;

  return {
    thesis: thesisContext,
    targetPaper: targetPaper ? buildPaperContext(targetPaper) : undefined,
    relatedPapers: paperContexts,
    existingConnections: connectionContexts,
    citationData,
    highlights,
  };
}

/**
 * Build context for a single paper
 */
export function buildPaperContext(paper: Paper): PaperContext {
  return {
    id: paper.id,
    title: paper.title,
    authors: formatAuthors(paper.authors),
    year: paper.year,
    abstract: paper.abstract,
    takeaway: paper.takeaway,
    thesisRole: paper.thesisRole,
    arguments: paper.arguments.map(a => ({
      id: a.id,
      claim: a.claim,
      strength: a.strength,
      yourAssessment: a.yourAssessment,
    })),
    evidence: paper.evidence.map(e => ({
      id: e.id,
      description: e.description,
      type: e.type,
      linkedArgumentId: e.linkedArgumentId,
    })),
  };
}

/**
 * Build context for a connection
 */
export function buildConnectionContext(
  connection: Connection,
  papers: Paper[]
): ConnectionContext {
  const fromPaper = papers.find(p => p.id === connection.fromPaperId);
  const toPaper = papers.find(p => p.id === connection.toPaperId);

  return {
    fromPaperId: connection.fromPaperId,
    fromPaperTitle: fromPaper?.title || 'Unknown Paper',
    toPaperId: connection.toPaperId,
    toPaperTitle: toPaper?.title || 'Unknown Paper',
    type: connection.type,
    note: connection.note,
  };
}

/**
 * Build context for a PDF highlight
 */
export function buildHighlightContext(annotation: PDFAnnotation): HighlightContext {
  return {
    text: annotation.selectedText || '',
    comment: annotation.comment || null,
    color: annotation.color,
    pageNumber: annotation.position?.pageNumber,
  };
}

/**
 * Format authors array into a string
 */
function formatAuthors(authors: Paper['authors']): string {
  if (!authors || authors.length === 0) {
    return 'Unknown';
  }

  if (authors.length === 1) {
    return authors[0].name;
  }

  if (authors.length === 2) {
    return `${authors[0].name} and ${authors[1].name}`;
  }

  return `${authors[0].name} et al.`;
}

/**
 * Estimate token count for context (for budget management)
 */
export function estimateContextTokens(context: AIRequestContext): number {
  let tokens = 0;

  // Thesis context
  tokens += Math.ceil((context.thesis.title.length + context.thesis.description.length) / 4);

  // Target paper
  if (context.targetPaper) {
    tokens += estimatePaperTokens(context.targetPaper);
  }

  // Related papers
  for (const paper of context.relatedPapers) {
    tokens += estimatePaperTokens(paper);
  }

  // Connections
  for (const conn of context.existingConnections) {
    tokens += Math.ceil((conn.fromPaperTitle.length + conn.toPaperTitle.length + (conn.note?.length || 0)) / 4);
  }

  // Highlights
  if (context.highlights) {
    for (const h of context.highlights) {
      tokens += Math.ceil((h.text.length + (h.comment?.length || 0)) / 4);
    }
  }

  // Add overhead for formatting
  return Math.ceil(tokens * 1.2);
}

function estimatePaperTokens(paper: PaperContext): number {
  let tokens = 0;

  tokens += Math.ceil(paper.title.length / 4);
  tokens += Math.ceil(paper.authors.length / 4);
  tokens += Math.ceil(paper.takeaway.length / 4);

  if (paper.abstract) {
    tokens += Math.ceil(paper.abstract.length / 4);
  }

  for (const arg of paper.arguments) {
    tokens += Math.ceil(arg.claim.length / 4);
  }

  for (const ev of paper.evidence) {
    tokens += Math.ceil(ev.description.length / 4);
  }

  return tokens;
}

/**
 * Trim context to fit within token budget
 * Prioritizes: thesis > target paper > related papers (by relevance) > abstracts
 */
export function trimContextToBudget(
  context: AIRequestContext,
  maxTokens: number
): AIRequestContext {
  let currentTokens = estimateContextTokens(context);

  if (currentTokens <= maxTokens) {
    return context;
  }

  const trimmedContext = { ...context };

  // Step 1: Remove abstracts from related papers (not target)
  if (currentTokens > maxTokens) {
    trimmedContext.relatedPapers = context.relatedPapers.map(p => ({
      ...p,
      abstract: null,
    }));
    currentTokens = estimateContextTokens(trimmedContext);
  }

  // Step 2: Limit related papers
  if (currentTokens > maxTokens) {
    const maxPapers = Math.max(5, Math.floor(context.relatedPapers.length / 2));
    trimmedContext.relatedPapers = trimmedContext.relatedPapers.slice(0, maxPapers);
    currentTokens = estimateContextTokens(trimmedContext);
  }

  // Step 3: Remove evidence from related papers
  if (currentTokens > maxTokens) {
    trimmedContext.relatedPapers = trimmedContext.relatedPapers.map(p => ({
      ...p,
      evidence: [],
    }));
    currentTokens = estimateContextTokens(trimmedContext);
  }

  // Step 4: Limit arguments in related papers
  if (currentTokens > maxTokens) {
    trimmedContext.relatedPapers = trimmedContext.relatedPapers.map(p => ({
      ...p,
      arguments: p.arguments.slice(0, 2),
    }));
    currentTokens = estimateContextTokens(trimmedContext);
  }

  // Step 5: Truncate target paper abstract
  if (currentTokens > maxTokens && trimmedContext.targetPaper?.abstract) {
    trimmedContext.targetPaper = {
      ...trimmedContext.targetPaper,
      abstract: trimmedContext.targetPaper.abstract.substring(0, 1000) + '...',
    };
  }

  return trimmedContext;
}

/**
 * Get papers most relevant to the target for context
 * Uses connection proximity and role matching
 */
export function getRelevantPapers(
  targetPaperId: string,
  papers: Paper[],
  connections: Connection[],
  maxPapers = 10
): Paper[] {
  const targetPaper = papers.find(p => p.id === targetPaperId);
  if (!targetPaper) return papers.slice(0, maxPapers);

  // Score papers by relevance
  const scores = new Map<string, number>();

  for (const paper of papers) {
    if (paper.id === targetPaperId) continue;

    let score = 0;

    // Same thesis role gets a bonus
    if (paper.thesisRole === targetPaper.thesisRole) {
      score += 2;
    }

    // Connected papers get a bonus
    const isConnected = connections.some(
      c =>
        (c.fromPaperId === targetPaperId && c.toPaperId === paper.id) ||
        (c.toPaperId === targetPaperId && c.fromPaperId === paper.id)
    );
    if (isConnected) {
      score += 5;
    }

    // Similar year gets a small bonus
    if (paper.year && targetPaper.year) {
      const yearDiff = Math.abs(paper.year - targetPaper.year);
      if (yearDiff <= 2) score += 1;
    }

    scores.set(paper.id, score);
  }

  // Sort by score and return top N
  return papers
    .filter(p => p.id !== targetPaperId)
    .sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0))
    .slice(0, maxPapers);
}
