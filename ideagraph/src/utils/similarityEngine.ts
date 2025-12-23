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
 * Check if a paper has meaningful text content for similarity
 */
function hasTextContent(paper: Paper): boolean {
  return !!(paper.abstract && paper.abstract.length > 50);
}

/**
 * Check if a paper has tags for similarity
 */
function hasTags(paper: Paper): boolean {
  return !!(paper.tags && paper.tags.length > 0);
}

/**
 * Compute combined similarity score with configurable weights
 * Dynamically adjusts weights when metadata is sparse
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
  // Check metadata availability for this pair
  const hasText1 = hasTextContent(paper1);
  const hasText2 = hasTextContent(paper2);
  const hasTags1 = hasTags(paper1);
  const hasTags2 = hasTags(paper2);

  const textAvailable = hasText1 && hasText2;
  const tagsAvailable = hasTags1 && hasTags2;

  // Dynamic weight adjustment based on available metadata
  // When text/tags are missing, redistribute their weight to other signals
  let w = {
    tag: weights.tag ?? 0.25,
    text: weights.text ?? 0.30,
    year: weights.year ?? 0.15,
    role: weights.role ?? 0.15,
    connection: weights.connection ?? 0.15,
  };

  if (!textAvailable || !tagsAvailable) {
    // Calculate how much weight needs redistribution
    let redistributeWeight = 0;

    if (!textAvailable) {
      redistributeWeight += w.text;
      w.text = 0;
    }

    if (!tagsAvailable) {
      redistributeWeight += w.tag;
      w.tag = 0;
    }

    // Redistribute to remaining signals proportionally
    const remainingWeight = w.year + w.role + w.connection + w.text + w.tag;
    if (remainingWeight > 0) {
      const scale = 1 + redistributeWeight / remainingWeight;
      w.year *= scale;
      w.role *= scale;
      w.connection *= scale;
      if (textAvailable) w.text *= scale;
      if (tagsAvailable) w.tag *= scale;
    } else {
      // Fallback if all weights are zero
      w = { tag: 0, text: 0, year: 0.4, role: 0.4, connection: 0.2 };
    }
  }

  const tagSimilarity = tagsAvailable ? computeTagSimilarity(paper1, paper2) : 0;
  const textSimilarity = textAvailable ? computeTextSimilarity(paper1, paper2) : 0;
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

/**
 * Analyze metadata quality across a collection of papers
 * Useful for UI feedback about similarity computation reliability
 */
export function analyzeMetadataQuality(papers: Paper[]): {
  textCoverage: number;
  tagCoverage: number;
  yearCoverage: number;
  overallQuality: 'excellent' | 'good' | 'limited' | 'poor';
} {
  if (papers.length === 0) {
    return { textCoverage: 0, tagCoverage: 0, yearCoverage: 0, overallQuality: 'poor' };
  }

  const textCoverage = papers.filter(hasTextContent).length / papers.length;
  const tagCoverage = papers.filter(hasTags).length / papers.length;
  const yearCoverage = papers.filter(p => p.year != null).length / papers.length;

  // Overall quality based on weighted average
  const avgCoverage = textCoverage * 0.4 + tagCoverage * 0.3 + yearCoverage * 0.3;

  let overallQuality: 'excellent' | 'good' | 'limited' | 'poor';
  if (avgCoverage >= 0.8) {
    overallQuality = 'excellent';
  } else if (avgCoverage >= 0.5) {
    overallQuality = 'good';
  } else if (avgCoverage >= 0.25) {
    overallQuality = 'limited';
  } else {
    overallQuality = 'poor';
  }

  return { textCoverage, tagCoverage, yearCoverage, overallQuality };
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
 * Auto-generated cluster with smart naming and representative paper
 */
export interface AutoCluster {
  id: string;
  paperIds: string[];
  representativePaperId: string;  // Most cited/connected paper in cluster
  name: string;                    // Auto-generated from common terms
  avgSimilarity: number;           // Internal cohesion
  dominantRole: string;            // Most common thesis role
  yearRange: { min: number; max: number };
  totalCitations: number;
}

/**
 * Extract common keywords from paper titles for cluster naming
 */
function extractCommonTerms(papers: Paper[]): string[] {
  // Stopwords to ignore
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
    'using', 'based', 'study', 'analysis', 'approach', 'method', 'methods',
    'results', 'effect', 'effects', 'impact', 'role', 'new', 'novel',
  ]);

  // Count word frequencies across all titles
  const wordCounts = new Map<string, number>();

  papers.forEach(paper => {
    const words = paper.title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopwords.has(w));

    // Use Set to count each word only once per paper
    const uniqueWords = new Set(words);
    uniqueWords.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
  });

  // Find words that appear in at least 50% of papers (or 2+ if small cluster)
  const minOccurrence = Math.max(2, Math.floor(papers.length * 0.5));

  return [...wordCounts.entries()]
    .filter(([, count]) => count >= minOccurrence)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
}

/**
 * Generate a smart name for a cluster based on its papers
 */
function generateClusterName(papers: Paper[]): string {
  const commonTerms = extractCommonTerms(papers);

  if (commonTerms.length > 0) {
    // Capitalize first letter of each term
    return commonTerms
      .map(term => term.charAt(0).toUpperCase() + term.slice(1))
      .join(' & ');
  }

  // Fallback: use dominant role + year range
  const roles = papers.map(p => p.thesisRole);
  const roleCounts = new Map<string, number>();
  roles.forEach(role => roleCounts.set(role, (roleCounts.get(role) || 0) + 1));

  const dominantRole = [...roleCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'papers';

  const years = papers.map(p => p.year).filter((y): y is number => y != null);
  if (years.length > 0) {
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    return `${dominantRole} (${minYear}-${maxYear})`;
  }

  return `${papers.length} ${dominantRole}`;
}

/**
 * Find the representative paper for a cluster (most cited, then most connected)
 */
function findRepresentativePaper(papers: Paper[], connections: Connection[]): string {
  if (papers.length === 0) return '';
  if (papers.length === 1) return papers[0].id;

  // Count connections for each paper
  const connectionCounts = new Map<string, number>();
  const paperIdSet = new Set(papers.map(p => p.id));

  connections.forEach(conn => {
    if (paperIdSet.has(conn.fromPaperId)) {
      connectionCounts.set(conn.fromPaperId, (connectionCounts.get(conn.fromPaperId) || 0) + 1);
    }
    if (paperIdSet.has(conn.toPaperId)) {
      connectionCounts.set(conn.toPaperId, (connectionCounts.get(conn.toPaperId) || 0) + 1);
    }
  });

  // Sort by citations (primary) then connections (secondary)
  const sorted = [...papers].sort((a, b) => {
    const citeDiff = (b.citationCount || 0) - (a.citationCount || 0);
    if (citeDiff !== 0) return citeDiff;
    return (connectionCounts.get(b.id) || 0) - (connectionCounts.get(a.id) || 0);
  });

  return sorted[0].id;
}

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

/**
 * Generate auto-clusters with smart naming and representative papers
 * Used for the "Similar" layout's clustering mode
 */
export function generateAutoClusters(
  papers: Paper[],
  connections: Connection[],
  options: {
    minClusterSize?: number;
    similarityThreshold?: number;
    maxClusters?: number;
  } = {}
): AutoCluster[] {
  const {
    minClusterSize = 2,
    similarityThreshold = 0.45,
    maxClusters = 10,
  } = options;

  if (papers.length < minClusterSize) return [];

  // Use agglomerative clustering
  const clusters: Set<string>[] = papers.map(p => new Set([p.id]));
  const clusterOf = new Map<string, number>();
  papers.forEach((p, i) => clusterOf.set(p.id, i));

  // Store similarity scores for cohesion calculation
  const pairSimilarities = new Map<string, number>();

  // Compute all similarities
  const similarities: { i: number; j: number; sim: number }[] = [];
  for (let i = 0; i < papers.length; i++) {
    for (let j = i + 1; j < papers.length; j++) {
      const sim = computeCombinedSimilarity(papers[i], papers[j], connections);
      pairSimilarities.set(`${papers[i].id}:${papers[j].id}`, sim.similarity);
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

  // Build AutoCluster objects for valid clusters
  const validClusters = clusters.filter(c => c.size >= minClusterSize);
  const paperById = new Map(papers.map(p => [p.id, p]));

  const autoClusters: AutoCluster[] = validClusters
    .map((clusterIds, idx) => {
      const clusterPapers = [...clusterIds].map(id => paperById.get(id)!).filter(Boolean);

      if (clusterPapers.length < minClusterSize) return null;

      // Calculate average internal similarity
      let totalSim = 0;
      let pairCount = 0;
      const idArray = [...clusterIds];
      for (let i = 0; i < idArray.length; i++) {
        for (let j = i + 1; j < idArray.length; j++) {
          const key = `${idArray[i]}:${idArray[j]}`;
          const reverseKey = `${idArray[j]}:${idArray[i]}`;
          const sim = pairSimilarities.get(key) ?? pairSimilarities.get(reverseKey) ?? 0;
          totalSim += sim;
          pairCount++;
        }
      }
      const avgSimilarity = pairCount > 0 ? totalSim / pairCount : 0;

      // Find dominant role
      const roleCounts = new Map<string, number>();
      clusterPapers.forEach(p => {
        roleCounts.set(p.thesisRole, (roleCounts.get(p.thesisRole) || 0) + 1);
      });
      const dominantRole = [...roleCounts.entries()]
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';

      // Calculate year range
      const years = clusterPapers.map(p => p.year).filter((y): y is number => y != null);
      const yearRange = years.length > 0
        ? { min: Math.min(...years), max: Math.max(...years) }
        : { min: 0, max: 0 };

      // Total citations
      const totalCitations = clusterPapers.reduce((sum, p) => sum + (p.citationCount || 0), 0);

      return {
        id: `auto_cluster_${idx}`,
        paperIds: [...clusterIds],
        representativePaperId: findRepresentativePaper(clusterPapers, connections),
        name: generateClusterName(clusterPapers),
        avgSimilarity,
        dominantRole,
        yearRange,
        totalCitations,
      };
    })
    .filter((c): c is AutoCluster => c !== null)
    .sort((a, b) => b.totalCitations - a.totalCitations)
    .slice(0, maxClusters);

  return autoClusters;
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
  generateAutoClusters,
  analyzeMetadataQuality,
};

export default similarityEngine;
