/**
 * Similarity Engine for Hybrid Graph Layout
 *
 * Computes paper-to-paper similarity for creating phantom edges
 * that enable Connected Papers-style natural clustering.
 */

import type { Paper, Connection, PaperSimilarity } from '../types';

// ============================================================================
// SIMILARITY COMPUTATION
// ============================================================================

/**
 * Compute Jaccard similarity between two sets
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Compute cosine similarity between two vectors
 * (Reserved for future embedding-based similarity)
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length || vec1.length === 0) return 0;

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  if (norm1 === 0 || norm2 === 0) return 0;

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Common academic stopwords to filter out
 */
const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her',
  'was', 'one', 'our', 'out', 'has', 'have', 'been', 'were', 'being', 'their',
  'this', 'that', 'with', 'they', 'from', 'which', 'will', 'would', 'there',
  'what', 'about', 'into', 'more', 'other', 'than', 'then', 'these', 'some',
  'could', 'them', 'also', 'only', 'such', 'both', 'most', 'very', 'just',
  'using', 'used', 'study', 'studies', 'research', 'results', 'method', 'methods',
  'based', 'however', 'therefore', 'although', 'thus', 'show', 'shown', 'shows',
  'found', 'present', 'analysis', 'data', 'effect', 'effects', 'model', 'system',
]);

/**
 * Compute tag similarity using Jaccard index
 */
export function computeTagSimilarity(paper1: Paper, paper2: Paper): number {
  const tags1 = new Set(paper1.tags?.map(t => t.toLowerCase()) || []);
  const tags2 = new Set(paper2.tags?.map(t => t.toLowerCase()) || []);

  return jaccardSimilarity(tags1, tags2);
}

/**
 * Compute text similarity from title and abstract
 */
export function computeTextSimilarity(paper1: Paper, paper2: Paper): number {
  // Combine title and abstract
  const text1 = `${paper1.title} ${paper1.abstract || ''}`;
  const text2 = `${paper2.title} ${paper2.abstract || ''}`;

  // Tokenize and filter
  const words1 = normalizeText(text1).filter(w => !STOPWORDS.has(w));
  const words2 = normalizeText(text2).filter(w => !STOPWORDS.has(w));

  if (words1.length === 0 || words2.length === 0) return 0;

  // Use word frequency for better comparison
  const freq1 = new Map<string, number>();
  const freq2 = new Map<string, number>();

  words1.forEach(w => freq1.set(w, (freq1.get(w) || 0) + 1));
  words2.forEach(w => freq2.set(w, (freq2.get(w) || 0) + 1));

  // Compute overlap score
  let overlap = 0;
  let total = 0;

  const allWords = new Set([...freq1.keys(), ...freq2.keys()]);
  allWords.forEach(word => {
    const count1 = freq1.get(word) || 0;
    const count2 = freq2.get(word) || 0;
    overlap += Math.min(count1, count2);
    total += Math.max(count1, count2);
  });

  return total > 0 ? overlap / total : 0;
}

/**
 * Compute year proximity (closer years = higher similarity)
 */
export function computeYearProximity(paper1: Paper, paper2: Paper): number {
  if (!paper1.year || !paper2.year) return 0.5; // Unknown years get neutral score

  const yearDiff = Math.abs(paper1.year - paper2.year);

  // Exponential decay: same year = 1.0, 5 years apart = ~0.37, 10 years = ~0.14
  return Math.exp(-yearDiff / 5);
}

/**
 * Compute role similarity (same thesis role = bonus)
 */
export function computeRoleSimilarity(paper1: Paper, paper2: Paper): number {
  if (paper1.thesisRole === paper2.thesisRole) {
    // Same role gets high similarity
    return 1.0;
  }

  // Related roles get partial similarity
  const relatedPairs: [string, string][] = [
    ['supports', 'background'],
    ['contradicts', 'background'],
    ['method', 'supports'],
    ['method', 'contradicts'],
  ];

  for (const [role1, role2] of relatedPairs) {
    if (
      (paper1.thesisRole === role1 && paper2.thesisRole === role2) ||
      (paper1.thesisRole === role2 && paper2.thesisRole === role1)
    ) {
      return 0.5;
    }
  }

  return 0;
}

/**
 * Compute connection overlap (shared connections = bibliographic coupling-lite)
 */
export function computeConnectionOverlap(
  paper1: Paper,
  paper2: Paper,
  connections: Connection[]
): number {
  // Get all papers connected to paper1
  const connected1 = new Set<string>();
  connections.forEach(c => {
    if (c.fromPaperId === paper1.id) connected1.add(c.toPaperId);
    if (c.toPaperId === paper1.id) connected1.add(c.fromPaperId);
  });

  // Get all papers connected to paper2
  const connected2 = new Set<string>();
  connections.forEach(c => {
    if (c.fromPaperId === paper2.id) connected2.add(c.toPaperId);
    if (c.toPaperId === paper2.id) connected2.add(c.fromPaperId);
  });

  // If both have no connections, return 0
  if (connected1.size === 0 && connected2.size === 0) return 0;

  return jaccardSimilarity(connected1, connected2);
}

/**
 * Compute combined similarity score with configurable weights
 */
export function computeCombinedSimilarity(
  paper1: Paper,
  paper2: Paper,
  connections: Connection[],
  weights: {
    tag?: number;
    text?: number;
    year?: number;
    role?: number;
    connection?: number;
  } = {}
): PaperSimilarity {
  // Default weights optimized for academic paper clustering
  const w = {
    tag: weights.tag ?? 0.25,
    text: weights.text ?? 0.30,
    year: weights.year ?? 0.15,
    role: weights.role ?? 0.15,
    connection: weights.connection ?? 0.15,
  };

  const tagSimilarity = computeTagSimilarity(paper1, paper2);
  const textSimilarity = computeTextSimilarity(paper1, paper2);
  const yearProximity = computeYearProximity(paper1, paper2);
  const roleSimilarity = computeRoleSimilarity(paper1, paper2);
  const connectionOverlap = computeConnectionOverlap(paper1, paper2, connections);

  const similarity =
    w.tag * tagSimilarity +
    w.text * textSimilarity +
    w.year * yearProximity +
    w.role * roleSimilarity +
    w.connection * connectionOverlap;

  return {
    paper1Id: paper1.id,
    paper2Id: paper2.id,
    similarity,
    components: {
      tagSimilarity,
      textSimilarity,
      yearProximity,
      roleSimilarity,
      connectionOverlap,
    },
  };
}

// ============================================================================
// SIMILARITY MATRIX & PHANTOM EDGES
// ============================================================================

/**
 * Compute similarity matrix for all paper pairs
 */
export function computeSimilarityMatrix(
  papers: Paper[],
  connections: Connection[]
): Map<string, PaperSimilarity> {
  const matrix = new Map<string, PaperSimilarity>();

  for (let i = 0; i < papers.length; i++) {
    for (let j = i + 1; j < papers.length; j++) {
      const similarity = computeCombinedSimilarity(papers[i], papers[j], connections);
      const key = `${papers[i].id}:${papers[j].id}`;
      matrix.set(key, similarity);
    }
  }

  return matrix;
}

/**
 * Get top N most similar papers for a given paper
 */
export function getTopSimilarPapers(
  paperId: string,
  papers: Paper[],
  connections: Connection[],
  topN: number = 5,
  minSimilarity: number = 0.2
): PaperSimilarity[] {
  const targetPaper = papers.find(p => p.id === paperId);
  if (!targetPaper) return [];

  const similarities: PaperSimilarity[] = [];

  for (const paper of papers) {
    if (paper.id === paperId) continue;

    const similarity = computeCombinedSimilarity(targetPaper, paper, connections);
    if (similarity.similarity >= minSimilarity) {
      similarities.push(similarity);
    }
  }

  // Sort by similarity descending and take top N
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}

/**
 * Phantom edge for graph visualization
 */
export interface PhantomEdge {
  id: string;
  source: string;
  target: string;
  similarity: number;
  isPhantom: true;
}

/**
 * Generate phantom edges for similar papers that aren't explicitly connected
 */
export function generatePhantomEdges(
  papers: Paper[],
  connections: Connection[],
  similarityThreshold: number = 0.3,
  maxPhantomEdgesPerPaper: number = 3
): PhantomEdge[] {
  const phantomEdges: PhantomEdge[] = [];

  // Build set of existing connections for quick lookup
  const existingConnections = new Set<string>();
  connections.forEach(c => {
    existingConnections.add(`${c.fromPaperId}:${c.toPaperId}`);
    existingConnections.add(`${c.toPaperId}:${c.fromPaperId}`);
  });

  // Track phantom edges per paper to limit count
  const phantomCountByPaper = new Map<string, number>();

  // Compute similarities and create phantom edges
  const allSimilarities: { pair: [string, string]; similarity: number }[] = [];

  for (let i = 0; i < papers.length; i++) {
    for (let j = i + 1; j < papers.length; j++) {
      const paper1 = papers[i];
      const paper2 = papers[j];

      // Skip if already connected
      if (existingConnections.has(`${paper1.id}:${paper2.id}`)) continue;

      const similarity = computeCombinedSimilarity(paper1, paper2, connections);

      if (similarity.similarity >= similarityThreshold) {
        allSimilarities.push({
          pair: [paper1.id, paper2.id],
          similarity: similarity.similarity,
        });
      }
    }
  }

  // Sort by similarity descending
  allSimilarities.sort((a, b) => b.similarity - a.similarity);

  // Create phantom edges, respecting max per paper
  for (const { pair, similarity } of allSimilarities) {
    const [id1, id2] = pair;

    const count1 = phantomCountByPaper.get(id1) || 0;
    const count2 = phantomCountByPaper.get(id2) || 0;

    if (count1 < maxPhantomEdgesPerPaper && count2 < maxPhantomEdgesPerPaper) {
      phantomEdges.push({
        id: `phantom_${id1}_${id2}`,
        source: id1,
        target: id2,
        similarity,
        isPhantom: true,
      });

      phantomCountByPaper.set(id1, count1 + 1);
      phantomCountByPaper.set(id2, count2 + 1);
    }
  }

  return phantomEdges;
}

// ============================================================================
// CLUSTERING SUGGESTIONS
// ============================================================================

/**
 * Suggest paper clusters based on similarity
 */
export function suggestClusters(
  papers: Paper[],
  connections: Connection[],
  minClusterSize: number = 2,
  similarityThreshold: number = 0.4
): { paperId: string; clusterId: number }[] {
  if (papers.length < minClusterSize) return [];

  // Simple agglomerative clustering
  const clusters: Set<string>[] = papers.map(p => new Set([p.id]));
  const clusterOf = new Map<string, number>();
  papers.forEach((p, i) => clusterOf.set(p.id, i));

  // Compute all similarities above threshold
  const similarities: { i: number; j: number; sim: number }[] = [];

  for (let i = 0; i < papers.length; i++) {
    for (let j = i + 1; j < papers.length; j++) {
      const sim = computeCombinedSimilarity(papers[i], papers[j], connections);
      if (sim.similarity >= similarityThreshold) {
        similarities.push({ i, j, sim: sim.similarity });
      }
    }
  }

  // Sort by similarity descending
  similarities.sort((a, b) => b.sim - a.sim);

  // Merge clusters
  for (const { i, j } of similarities) {
    const cluster1 = clusterOf.get(papers[i].id)!;
    const cluster2 = clusterOf.get(papers[j].id)!;

    if (cluster1 !== cluster2) {
      // Merge smaller into larger
      const [smaller, larger] =
        clusters[cluster1].size < clusters[cluster2].size
          ? [cluster1, cluster2]
          : [cluster2, cluster1];

      clusters[smaller].forEach(paperId => {
        clusters[larger].add(paperId);
        clusterOf.set(paperId, larger);
      });
      clusters[smaller].clear();
    }
  }

  // Return cluster assignments for papers in clusters with minClusterSize
  const result: { paperId: string; clusterId: number }[] = [];
  const validClusters = clusters.filter(c => c.size >= minClusterSize);

  validClusters.forEach((cluster, clusterId) => {
    cluster.forEach(paperId => {
      result.push({ paperId, clusterId });
    });
  });

  return result;
}

// ============================================================================
// EXPORT
// ============================================================================

export const similarityEngine = {
  cosineSimilarity,
  computeTagSimilarity,
  computeTextSimilarity,
  computeYearProximity,
  computeRoleSimilarity,
  computeConnectionOverlap,
  computeCombinedSimilarity,
  computeSimilarityMatrix,
  getTopSimilarPapers,
  generatePhantomEdges,
  suggestClusters,
};

export default similarityEngine;
