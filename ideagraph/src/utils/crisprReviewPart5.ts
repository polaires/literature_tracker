// ============================================================================
// CRISPR REVIEW SAMPLE DATA - PART 5: Load Function & Workflow Summary
// ============================================================================

import type {
  Paper,
  Connection,
  SynthesisTheme,
  ResearchGap,
  EvidenceSynthesis,
  ReviewSection,
  PaperCluster,
} from '../types';

import {
  crisprThesis,
  crisprPapersPart1,
  PART1_PAPER_COUNT,
} from './crisprReviewSampleData';

import { crisprPapersPart2, PART2_PAPER_COUNT } from './crisprReviewPart2';
import { crisprPapersPart3, PART3_PAPER_COUNT } from './crisprReviewPart3';

import {
  crisprPapersPart4,
  PART4_PAPER_COUNT,
  crisprConnections,
  connectionMappings,
  crisprThemes,
  themePaperMappings,
  crisprGaps,
  gapPaperMappings,
  crisprEvidenceSyntheses,
  evidenceSynthesisMappings,
  crisprReviewSections,
  sectionPaperMappings,
  crisprClusters,
  clusterPaperMappings,
} from './crisprReviewPart4';

// ============================================================================
// COMBINED PAPERS ARRAY
// ============================================================================

export const allCrisprPapers = [
  ...crisprPapersPart1,
  ...crisprPapersPart2,
  ...crisprPapersPart3,
  ...crisprPapersPart4,
];

export const TOTAL_PAPER_COUNT = allCrisprPapers.length;

// ============================================================================
// LOAD RESULT TYPE
// ============================================================================

export interface LoadCrisprSampleResult {
  thesisId: string;
  paperCount: number;
  connectionCount: number;
  themeCount: number;
  gapCount: number;
  sectionCount: number;
  clusterCount: number;
  evidenceSynthesisCount: number;
}

// ============================================================================
// MAIN LOAD FUNCTION
// ============================================================================

export function loadCrisprReviewSampleData(
  createThesis: (thesis: typeof crisprThesis) => { id: string },
  addPaper: (paper: Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'>) => { id: string },
  createConnection: (connection: Omit<Connection, 'id' | 'createdAt'>) => void,
  createTheme?: (theme: Omit<SynthesisTheme, 'id' | 'createdAt'>) => { id: string },
  createGap?: (gap: Omit<ResearchGap, 'id' | 'createdAt'>) => { id: string },
  createSection?: (section: Omit<ReviewSection, 'id' | 'createdAt'>) => { id: string },
  createEvidenceSynthesis?: (synthesis: Omit<EvidenceSynthesis, 'id' | 'createdAt'>) => { id: string },
  createCluster?: (cluster: Omit<PaperCluster, 'id' | 'createdAt'>) => { id: string }
): LoadCrisprSampleResult {
  // 1. Create thesis
  const thesis = createThesis(crisprThesis);
  const thesisId = thesis.id;

  // 2. Create all papers (55 total)
  const paperIds: string[] = [];
  for (const paperData of allCrisprPapers) {
    const paper = addPaper({ ...paperData, thesisId });
    paperIds.push(paper.id);
  }

  // 3. Create connections with correct paper IDs
  let connectionCount = 0;
  for (let i = 0; i < crisprConnections.length && i < connectionMappings.length; i++) {
    const mapping = connectionMappings[i];
    const conn = crisprConnections[i];
    if (mapping.from < paperIds.length && mapping.to < paperIds.length) {
      createConnection({
        ...conn,
        thesisId,
        fromPaperId: paperIds[mapping.from],
        toPaperId: paperIds[mapping.to],
      });
      connectionCount++;
    }
  }

  // 4. Create synthesis themes
  let themeCount = 0;
  if (createTheme) {
    for (let i = 0; i < crisprThemes.length; i++) {
      const theme = crisprThemes[i];
      const paperIndices = themePaperMappings[i] || [];
      const themePaperIds = paperIndices
        .filter(idx => idx < paperIds.length)
        .map(idx => paperIds[idx]);

      createTheme({
        ...theme,
        thesisId,
        paperIds: themePaperIds,
      });
      themeCount++;
    }
  }

  // 5. Create research gaps
  let gapCount = 0;
  if (createGap) {
    for (let i = 0; i < crisprGaps.length; i++) {
      const gap = crisprGaps[i];
      const paperIndices = gapPaperMappings[i] || [];
      const gapPaperIds = paperIndices
        .filter(idx => idx < paperIds.length)
        .map(idx => paperIds[idx]);

      createGap({
        ...gap,
        thesisId,
        relatedPaperIds: gapPaperIds,
      });
      gapCount++;
    }
  }

  // 6. Create review sections
  let sectionCount = 0;
  if (createSection) {
    for (let i = 0; i < crisprReviewSections.length; i++) {
      const section = crisprReviewSections[i];
      const paperIndices = sectionPaperMappings[i] || [];
      const sectionPaperIds = paperIndices
        .filter(idx => idx < paperIds.length)
        .map(idx => paperIds[idx]);

      createSection({
        ...section,
        thesisId,
        paperIds: sectionPaperIds,
      });
      sectionCount++;
    }
  }

  // 7. Create evidence syntheses
  let evidenceSynthesisCount = 0;
  if (createEvidenceSynthesis) {
    for (let i = 0; i < crisprEvidenceSyntheses.length; i++) {
      const synthesis = crisprEvidenceSyntheses[i];
      const mapping = evidenceSynthesisMappings[i];

      const supportingIds = (mapping?.supporting || [])
        .filter(idx => idx < paperIds.length)
        .map(idx => paperIds[idx]);
      const contradictingIds = (mapping?.contradicting || [])
        .filter(idx => idx < paperIds.length)
        .map(idx => paperIds[idx]);

      createEvidenceSynthesis({
        ...synthesis,
        thesisId,
        supportingPaperIds: supportingIds,
        contradictingPaperIds: contradictingIds,
      });
      evidenceSynthesisCount++;
    }
  }

  // 8. Create paper clusters
  let clusterCount = 0;
  if (createCluster) {
    for (let i = 0; i < crisprClusters.length; i++) {
      const cluster = crisprClusters[i];
      const paperIndices = clusterPaperMappings[i] || [];
      const clusterPaperIds = paperIndices
        .filter(idx => idx < paperIds.length)
        .map(idx => paperIds[idx]);

      createCluster({
        ...cluster,
        thesisId,
        paperIds: clusterPaperIds,
      });
      clusterCount++;
    }
  }

  return {
    thesisId,
    paperCount: paperIds.length,
    connectionCount,
    themeCount,
    gapCount,
    sectionCount,
    clusterCount,
    evidenceSynthesisCount,
  };
}

// ============================================================================
// WORKFLOW SUMMARY - Dr. Chen's Research Journey
// ============================================================================

export const crisprWorkflowSummary = {
  totalPapers: TOTAL_PAPER_COUNT,
  totalConnections: connectionMappings.length,
  totalThemes: crisprThemes.length,
  totalGaps: crisprGaps.length,
  totalSections: crisprReviewSections.length,
  totalClusters: crisprClusters.length,

  papersByPhase: {
    'Discovery & Mechanism (Part 1)': PART1_PAPER_COUNT,
    'Applications & Delivery (Part 2)': PART2_PAPER_COUNT,
    'Limitations & Ethics (Part 3)': PART3_PAPER_COUNT,
    'Future Directions (Part 4)': PART4_PAPER_COUNT,
  },

  estimatedTime: {
    scoping: '3 days',
    seedCollection: '1 day',
    snowballSearch: '2 weeks',
    systematicSearch: '3 weeks',
    deepReading: '6 weeks',
    connectionMapping: 'Ongoing',
    themeEmergence: '1 week',
    gapIdentification: '2 weeks',
    evidenceSynthesis: '3 weeks',
    writing: '8 weeks',
    totalProject: '4-6 months',
  },

  keyDifficulties: [
    // From workflow documentation
    'Formulating specific enough research question without being too narrow',
    'Identifying foundational vs. derivative papers in massive literature',
    'Maintaining consistent screening criteria across hundreds of abstracts',
    'Writing meaningful takeaways vs. just paraphrasing abstracts',
    'Deciding connection directions and types for complex relationships',
    'Managing "hairball" graph as collection grows beyond 30 papers',
    'Articulating emergent themes that cut across papers',
    'Noticing what is MISSING (gaps) rather than what is present',
    'Weighing conflicting evidence with different methods and sample sizes',
    'Revisiting old papers when new knowledge changes interpretation',
    'Transforming structured notes into flowing narrative prose',
  ],

  topFeatureRequests: [
    // "What if we have..." from workflow
    'AI-assisted thesis refinement based on literature analysis',
    'Auto-detect foundational/highly-cited papers for a topic',
    'AI pre-screening with explanations for include/exclude decisions',
    'AI-suggested takeaways as editable starting points',
    'Side-by-side paper comparison view for creating connections',
    'Automatic duplicate/similar paper detection',
    'Clustering similar papers visually on graph',
    'AI gap detection: "No papers address X"',
    'Evidence table generator with automatic method comparison',
    'Version history for evolving understanding over time',
    'Export as structured literature review draft',
  ],

  workflowPatterns: [
    // Observed patterns from simulated workflow
    'Start with 2-3 landmark papers (Nobel Prize level citations)',
    'Follow citation trails backward (references) and forward (citing articles)',
    'Use systematic database search to fill gaps missed by snowballing',
    'Screen in batches of 20-30 to maintain consistency',
    'Create connections immediately after reading second related paper',
    'Let themes emerge organically; formalize after ~30 papers',
    'Identify gaps only after substantial collection (50+ papers)',
    'Synthesize evidence for major claims before writing',
    'Organize by theme for writing, not by paper or chronology',
    'Iterate between reading and writing; don\'t wait until "done"',
  ],

  emotionalJourney: [
    { phase: 'Scoping', emotion: 'Anxious but excited', note: 'This could define my career' },
    { phase: 'Seed Collection', emotion: 'Confident', note: 'I know this territory' },
    { phase: 'Snowball Search', emotion: 'Overwhelmed', note: 'The literature is infinite' },
    { phase: 'Systematic Search', emotion: 'Tedious', note: 'This is the boring part of science' },
    { phase: 'Deep Reading', emotion: 'Exhausted but determined', note: 'Where the real work happens' },
    { phase: 'Connection Mapping', emotion: 'Intellectually engaged', note: 'Fun synthesis part' },
    { phase: 'Theme Emergence', emotion: 'Excited', note: 'Structure taking shape!' },
    { phase: 'Gap Identification', emotion: 'Critical', note: 'Adding value as expert' },
    { phase: 'Evidence Synthesis', emotion: 'Stressed', note: 'My interpretation could be wrong' },
    { phase: 'Writing', emotion: 'Creative but anxious', note: 'Where it all comes together' },
  ],

  lessonsLearned: [
    'Start taking notes from day 1 - memory fails after 50 papers',
    'Don\'t read everything at the same depth - triage is essential',
    'Connections are easier to see when you force yourself to articulate them',
    'Themes often span what you thought were separate topics',
    'Gaps are where YOU can contribute - don\'t just summarize',
    'Other reviewers will find what you missed - it\'s okay',
    'Writing clarifies thinking - start drafting sections early',
    'Your first takeaways will be terrible - revise as understanding deepens',
    'The graph view reveals structure invisible in linear reading',
    'Breaks are productive - insights often come when not actively working',
  ],
};

// ============================================================================
// DETAILED DIFFICULTIES & IMPROVEMENT STRATEGIES
// ============================================================================
// Elaborating on pain points from Dr. Chen's workflow with concrete solutions

export interface DifficultyWithStrategy {
  id: string;
  phase: string;
  difficulty: string;
  severity: 'minor' | 'moderate' | 'major' | 'blocking';
  frequencyForUsers: 'rare' | 'occasional' | 'common' | 'universal';
  currentWorkaround: string;
  proposedSolutions: {
    shortTerm: string;   // Can be implemented quickly
    mediumTerm: string;  // Requires moderate effort
    longTerm: string;    // Requires significant investment
  };
  implementationPriority: 'high' | 'medium' | 'low';
  userImpact: string;
  technicalNotes: string;
}

export const detailedDifficulties: DifficultyWithStrategy[] = [
  // ============================================================================
  // PHASE 1: SCOPING DIFFICULTIES
  // ============================================================================
  {
    id: 'scope-1',
    phase: 'Scoping',
    difficulty: 'Formulating specific enough research question without being too narrow',
    severity: 'major',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Read 5-10 existing reviews to see how others framed the topic',
    proposedSolutions: {
      shortTerm: 'Add a "Review Landscape" panel showing existing reviews on similar topics with their scope/framing. Import from Semantic Scholar review papers.',
      mediumTerm: 'AI-assisted scope suggestion: analyze 20+ reviews in the field and suggest differentiated angles. Show a 2D map of existing review coverage (x: breadth, y: recency).',
      longTerm: 'Dynamic scope refinement: as user adds papers, AI suggests thesis adjustments ("Your collection suggests a focus on X - consider narrowing thesis"). Track thesis evolution over time.',
    },
    implementationPriority: 'high',
    userImpact: 'Prevents weeks of false starts. A well-scoped thesis saves 20-30% of total project time.',
    technicalNotes: 'Requires Semantic Scholar API for review paper detection (isReview field). LLM call for scope analysis. Store thesis history with timestamps.',
  },
  {
    id: 'scope-2',
    phase: 'Scoping',
    difficulty: 'Balancing historical context vs. cutting-edge developments',
    severity: 'moderate',
    frequencyForUsers: 'common',
    currentWorkaround: 'Manually count papers by year and adjust',
    proposedSolutions: {
      shortTerm: 'Add year distribution histogram to collection stats. Show "temporal coverage" metric.',
      mediumTerm: 'Smart suggestions: "Your collection is 80% post-2020. Consider adding foundational papers from 2010-2015 for historical context."',
      longTerm: 'AI-curated "essential history" bundles for major topics. One-click import of foundational papers with pre-written historical narrative.',
    },
    implementationPriority: 'medium',
    userImpact: 'Ensures reviews have proper historical grounding without being outdated.',
    technicalNotes: 'Year histogram is straightforward. "Essential history" requires curated datasets per topic.',
  },

  // ============================================================================
  // PHASE 2: SEED COLLECTION DIFFICULTIES
  // ============================================================================
  {
    id: 'seed-1',
    phase: 'Seed Collection',
    difficulty: 'Identifying truly foundational vs. derivative papers',
    severity: 'moderate',
    frequencyForUsers: 'common',
    currentWorkaround: 'Use citation counts as proxy, but this favors old papers',
    proposedSolutions: {
      shortTerm: 'Show citation velocity (citations/year) alongside total count. Highlight "highly cited relative to age".',
      mediumTerm: 'PageRank-style importance score based on citation graph. Papers cited by many important papers score higher. Show "influence score" badge.',
      longTerm: 'AI-powered "foundational paper detection" that identifies conceptual originality, not just citation metrics. Distinguish "first to discover X" from "popularized X".',
    },
    implementationPriority: 'high',
    userImpact: 'Starting with the right seeds makes snowball search 3x more efficient.',
    technicalNotes: 'Citation velocity = citationCount / (currentYear - publicationYear). PageRank requires building citation graph from Semantic Scholar references.',
  },
  {
    id: 'seed-2',
    phase: 'Seed Collection',
    difficulty: 'Multiple versions: preprints, corrections, follow-ups',
    severity: 'minor',
    frequencyForUsers: 'occasional',
    currentWorkaround: 'Manually track versions, often miss corrections',
    proposedSolutions: {
      shortTerm: 'Show "versions" indicator on papers with known preprints (via DOI/arXiv matching).',
      mediumTerm: 'Auto-link preprint to published version. Alert: "This paper has 2 corrections - view latest."',
      longTerm: 'Full version history with diff highlighting. "Changes from v1: Methods section revised, Figure 3 corrected."',
    },
    implementationPriority: 'low',
    userImpact: 'Prevents citing outdated or corrected findings.',
    technicalNotes: 'CrossRef has version/correction metadata. bioRxiv API has preprint-publication links.',
  },

  // ============================================================================
  // PHASE 3: SNOWBALL SEARCH DIFFICULTIES
  // ============================================================================
  {
    id: 'snowball-1',
    phase: 'Snowball Search',
    difficulty: 'Citation trails are backward-looking - miss recent papers',
    severity: 'major',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Supplement with keyword searches for recent years',
    proposedSolutions: {
      shortTerm: 'Add "Citing Papers" tab (forward citations from Semantic Scholar). Show papers that cite your collection.',
      mediumTerm: 'Bidirectional snowballing: auto-expand both references AND citing papers. Alert: "15 papers published in 2024 cite your collection."',
      longTerm: 'Living search: subscribe to new papers citing your collection. Weekly digest: "3 new papers relevant to your thesis."',
    },
    implementationPriority: 'high',
    userImpact: 'Reviews missing recent papers (post-2022) appear outdated immediately.',
    technicalNotes: 'Semantic Scholar citations endpoint. For living search, need background job or webhook (future feature).',
  },
  {
    id: 'snowball-2',
    phase: 'Snowball Search',
    difficulty: 'Following every citation is a rabbit hole - need stopping rules',
    severity: 'major',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Set arbitrary limits (only follow top 20% by citation count)',
    proposedSolutions: {
      shortTerm: 'Show "depth" metric for each paper (generations from seed). Color-code: seed=0, reference=1, reference-of-reference=2.',
      mediumTerm: 'Diminishing returns detector: "Adding papers at depth 3+ rarely changes your themes. Consider stopping snowball expansion."',
      longTerm: 'AI-guided snowballing: "This reference is essential (high conceptual overlap). This one is tangential (only methodology borrowed)." Prioritized queue.',
    },
    implementationPriority: 'high',
    userImpact: 'Prevents literature review scope creep. Saves 1-2 weeks of unnecessary reading.',
    technicalNotes: 'Track paper.discoveryPath = [seedPaperId, intermediatePaperId, ...]. "Conceptual overlap" needs embedding similarity.',
  },
  {
    id: 'snowball-3',
    phase: 'Snowball Search',
    difficulty: 'Papers cite in webs - hard to see trunk vs. branches',
    severity: 'moderate',
    frequencyForUsers: 'common',
    currentWorkaround: 'Manually trace citation chains, often get lost',
    proposedSolutions: {
      shortTerm: 'Improve graph visualization: thicker edges for multiple citation paths. Highlight "convergence papers" cited by many in collection.',
      mediumTerm: 'Tree view option: show citation lineage as expandable tree. Collapse branches to see main trunk.',
      longTerm: 'AI-identified "intellectual genealogy": "The specificity engineering branch stems from Zhang 2016, while delivery innovations trace to Langer lab."',
    },
    implementationPriority: 'medium',
    userImpact: 'Understanding the intellectual structure accelerates theme identification.',
    technicalNotes: 'Cytoscape.js supports edge weight styling. Tree view requires hierarchical layout algorithm.',
  },

  // ============================================================================
  // PHASE 4: SYSTEMATIC SEARCH DIFFICULTIES
  // ============================================================================
  {
    id: 'systematic-1',
    phase: 'Systematic Search',
    difficulty: 'Different database syntax (PubMed vs. WoS vs. Scopus)',
    severity: 'moderate',
    frequencyForUsers: 'common',
    currentWorkaround: 'Maintain separate search strategies, manually translate',
    proposedSolutions: {
      shortTerm: 'Provide syntax cheat sheets for major databases in help section.',
      mediumTerm: 'Query translator: write in natural language, export to PubMed/WoS/Scopus syntax.',
      longTerm: 'Unified search API: search all databases from IdeaGraph. Merge and deduplicate results automatically.',
    },
    implementationPriority: 'medium',
    userImpact: 'Saves hours of query reformulation across databases.',
    technicalNotes: 'Query translation is rule-based for simple cases, LLM-assisted for complex boolean logic. Unified API requires database partnerships.',
  },
  {
    id: 'systematic-2',
    phase: 'Systematic Search',
    difficulty: 'Screening 3000+ abstracts is impossible to do manually',
    severity: 'blocking',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Random sampling, or narrow search terms (lose recall)',
    proposedSolutions: {
      shortTerm: 'Batch import with AI relevance scoring. Sort by "likely relevant" first. Show: "High confidence: 120, Medium: 340, Low: 2540".',
      mediumTerm: 'Active learning screening: AI learns from your first 50 decisions, auto-classifies rest with confidence. "Include 89 (95%+ confident), Review 156 (70-95%), Exclude 2755 (70%-)."',
      longTerm: 'Near-zero screening: AI pre-filters with <5% false negative rate. Human reviews only borderline cases (~200 instead of 3000).',
    },
    implementationPriority: 'high',
    userImpact: 'Transforms 2-week screening marathon into 2-day focused review. Game-changer for systematic reviews.',
    technicalNotes: 'Relevance scoring: embed query + abstract, compute similarity. Active learning: retrain classifier after each batch. Need confidence calibration.',
  },
  {
    id: 'systematic-3',
    phase: 'Systematic Search',
    difficulty: 'Duplicate detection across databases is tedious',
    severity: 'moderate',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Manual comparison by title, DOI when available',
    proposedSolutions: {
      shortTerm: 'Auto-detect duplicates on import via DOI match. Warn: "This paper is already in your collection."',
      mediumTerm: 'Fuzzy duplicate detection: title similarity + author overlap + year. "Possible duplicate found (92% match). Merge?"',
      longTerm: 'Intelligent merge: keep best metadata from each source. "Taking abstract from PubMed (more complete), PDF link from Semantic Scholar."',
    },
    implementationPriority: 'high',
    userImpact: 'Prevents confusion and duplicate effort. Essential for PRISMA compliance.',
    technicalNotes: 'DOI matching is exact. Fuzzy: Jaccard similarity on title tokens + author last names. Merge logic needs metadata quality heuristics.',
  },

  // ============================================================================
  // PHASE 5: DEEP READING DIFFICULTIES
  // ============================================================================
  {
    id: 'reading-1',
    phase: 'Deep Reading',
    difficulty: 'Writing meaningful takeaways vs. just paraphrasing abstracts',
    severity: 'major',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Multiple revision passes, often settle for mediocre',
    proposedSolutions: {
      shortTerm: 'Takeaway quality hints: "Your takeaway is very similar to the abstract. Try: What does this mean for YOUR thesis specifically?"',
      mediumTerm: 'AI-suggested takeaways with different framings: (1) For your thesis, (2) Key methodological insight, (3) Novel finding summary. User picks and edits.',
      longTerm: 'Evolving takeaways: AI notices when later papers change interpretation. "Your takeaway for Paper A might need updating based on Paper B\'s contradictory findings."',
    },
    implementationPriority: 'high',
    userImpact: 'Good takeaways are the core value of IdeaGraph. Quality here cascades to all downstream synthesis.',
    technicalNotes: 'Abstract similarity: embed both, threshold on cosine distance. AI suggestions: provide thesis + paper abstract + existing collection context.',
  },
  {
    id: 'reading-2',
    phase: 'Deep Reading',
    difficulty: 'Some papers need domain expertise user lacks',
    severity: 'moderate',
    frequencyForUsers: 'common',
    currentWorkaround: 'Ask colleagues, skip technical details',
    proposedSolutions: {
      shortTerm: 'Link to domain glossaries: detect technical terms, show definitions on hover.',
      mediumTerm: 'AI explainer mode: "Explain this paper\'s methods to someone from [user\'s background]." Level selector: undergraduate/graduate/expert.',
      longTerm: 'Expert network: connect users with similar collections. "Dr. Smith has 40 papers on protein structure and might help explain this."',
    },
    implementationPriority: 'medium',
    userImpact: 'Removes barriers to cross-disciplinary synthesis - increasingly important in science.',
    technicalNotes: 'Term detection: NER for scientific terms + Wikipedia/PubMed lookup. Expert network requires user profiles and opt-in.',
  },
  {
    id: 'reading-3',
    phase: 'Deep Reading',
    difficulty: 'Keep forgetting details of papers read weeks ago',
    severity: 'major',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Re-read papers multiple times',
    proposedSolutions: {
      shortTerm: 'Paper summary cards: show takeaway, key arguments, and your highlights at a glance. "Last read: 3 weeks ago."',
      mediumTerm: 'Spaced repetition: surface papers for "memory refresh" before they fade. "You haven\'t revisited Jinek 2012 in 4 weeks. Quick review?"',
      longTerm: 'Personal knowledge graph: link concepts across papers. "This paper mentions off-target effects. Here\'s what 5 other papers in your collection say about this."',
    },
    implementationPriority: 'high',
    userImpact: 'Reduces re-reading time by 50%+. Memory is a real bottleneck in large reviews.',
    technicalNotes: 'lastAccessedAt already tracked. Spaced repetition: SM-2 algorithm or simpler interval-based. Knowledge graph: entity extraction + linking.',
  },

  // ============================================================================
  // PHASE 6: CONNECTION MAPPING DIFFICULTIES
  // ============================================================================
  {
    id: 'connection-1',
    phase: 'Connection Mapping',
    difficulty: 'Connection types feel limiting - need nuance',
    severity: 'moderate',
    frequencyForUsers: 'common',
    currentWorkaround: 'Use notes field to add nuance',
    proposedSolutions: {
      shortTerm: 'Add connection strength slider: weak/moderate/strong for each type.',
      mediumTerm: 'Allow custom connection types: user-defined labels. Suggest from common patterns.',
      longTerm: 'Rich connection model: type + strength + context + temporal relationship. "A strongly supports B in the context of in vitro studies, but this was before C\'s contradicting in vivo data."',
    },
    implementationPriority: 'medium',
    userImpact: 'Captures real scholarly relationships better. Improves evidence synthesis.',
    technicalNotes: 'Connection model already has note field. Add: strength (1-5), context (string), conditional (boolean + condition).',
  },
  {
    id: 'connection-2',
    phase: 'Connection Mapping',
    difficulty: 'Some connections only visible after reading both papers closely',
    severity: 'moderate',
    frequencyForUsers: 'common',
    currentWorkaround: 'Make multiple passes through collection',
    proposedSolutions: {
      shortTerm: 'Side-by-side comparison view: see two papers\' takeaways and arguments simultaneously.',
      mediumTerm: 'AI connection suggestions with explanation: "These papers both study X but reach different conclusions. Consider adding a \'contradicts\' connection."',
      longTerm: 'Proactive connection prompts: after reading paper B, system shows: "Paper B might connect to Paper A (added 2 weeks ago) - both mention off-target detection methods."',
    },
    implementationPriority: 'high',
    userImpact: 'Discovers hidden connections user would miss. Key for comprehensive synthesis.',
    technicalNotes: 'Connection suggestions: embed takeaways, find similar pairs, LLM evaluates relationship type. Need background processing after each paper add.',
  },
  {
    id: 'connection-3',
    phase: 'Connection Mapping',
    difficulty: 'Graph becomes hairball as collection grows past 30 papers',
    severity: 'major',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Stop using graph view, revert to list',
    proposedSolutions: {
      shortTerm: 'Add filtering to graph: show only selected themes/clusters. Hide papers with no connections.',
      mediumTerm: 'Hierarchical zoom: cluster → theme → paper. Click cluster to expand. Overview + detail pattern.',
      longTerm: 'Intelligent layout: detect communities, arrange in semantic neighborhoods. "Force-directed but with theme awareness." Interactive expansion/collapse.',
    },
    implementationPriority: 'high',
    userImpact: 'Graph view is a core differentiator. Unusable graphs = lost value. This is the issue shown in user\'s screenshot.',
    technicalNotes: 'Current Cytoscape layout works for <30 nodes. Need: (1) cluster-aware layout, (2) LOD rendering, (3) interactive collapse. Consider cola.js or d3-force with constraints.',
  },

  // ============================================================================
  // PHASE 7: THEME EMERGENCE DIFFICULTIES
  // ============================================================================
  {
    id: 'theme-1',
    phase: 'Theme Emergence',
    difficulty: 'Themes are fuzzy at first - take time to crystallize',
    severity: 'moderate',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Wait until collection is large, then batch-organize',
    proposedSolutions: {
      shortTerm: 'Allow "draft themes" with ? prefix. Low commitment organization.',
      mediumTerm: 'AI-suggested themes based on paper tags and arguments. "Your papers cluster into 4 natural groups. Suggested names: [...]."',
      longTerm: 'Theme evolution tracking: show how themes emerged and merged over time. "This theme started as two separate clusters that merged at paper 35."',
    },
    implementationPriority: 'medium',
    userImpact: 'Reduces anxiety about premature organization. Themes emerge naturally.',
    technicalNotes: 'Draft themes: theme.isDraft flag. AI clustering: embed takeaways, run k-means or hierarchical clustering, LLM names clusters.',
  },
  {
    id: 'theme-2',
    phase: 'Theme Emergence',
    difficulty: 'Some papers span multiple themes - where to place them?',
    severity: 'minor',
    frequencyForUsers: 'common',
    currentWorkaround: 'Pick one theme, mention others in notes',
    proposedSolutions: {
      shortTerm: 'Allow papers in multiple themes. Show multi-theme papers with badge.',
      mediumTerm: 'Primary/secondary theme distinction. Primary for organization, secondary for cross-referencing.',
      longTerm: 'Theme overlap visualization: Venn-like diagram showing papers at theme intersections. These are often the most interesting synthesis opportunities.',
    },
    implementationPriority: 'low',
    userImpact: 'Better captures reality of interdisciplinary papers.',
    technicalNotes: 'Data model already supports paper in multiple themes (theme.paperIds is array). UI needs to show this clearly.',
  },

  // ============================================================================
  // PHASE 8: GAP IDENTIFICATION DIFFICULTIES
  // ============================================================================
  {
    id: 'gap-1',
    phase: 'Gap Identification',
    difficulty: 'Gaps are absences - hard to notice what ISN\'T there',
    severity: 'major',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Compare to other reviews, rely on domain intuition',
    proposedSolutions: {
      shortTerm: 'Gap prompt questions: "What populations are missing? What methods haven\'t been tried? What time periods are underrepresented?"',
      mediumTerm: 'AI gap detection: analyze collection for missing combinations. "All your clinical papers use HEK293 cells. No primary human cell studies found."',
      longTerm: 'Cross-collection gap detection: compare your collection to 1000+ other reviews on similar topics. "90% of reviews on this topic include X, which you\'re missing."',
    },
    implementationPriority: 'high',
    userImpact: 'Gaps are where reviewers add original value. AI assistance here directly improves review quality.',
    technicalNotes: 'Gap detection: extract entities (cell types, methods, populations) from collection, find expected entities from topic model, compute difference.',
  },
  {
    id: 'gap-2',
    phase: 'Gap Identification',
    difficulty: 'Distinguishing gap from "not interesting enough to study"',
    severity: 'moderate',
    frequencyForUsers: 'common',
    currentWorkaround: 'Use domain expertise to judge',
    proposedSolutions: {
      shortTerm: 'Gap validation checklist: "Is this technically feasible? Would it change clinical practice? Is there a reason it hasn\'t been done?"',
      mediumTerm: 'AI gap importance scoring: estimate citation impact if gap were filled based on related work patterns.',
      longTerm: 'Community gap validation: show gaps identified by multiple reviewers as "community-recognized gaps."',
    },
    implementationPriority: 'low',
    userImpact: 'Prevents embarrassing "gaps" that reveal reviewer naivety.',
    technicalNotes: 'Gap scoring is speculative. Community validation requires anonymized gap sharing (privacy-preserving).',
  },

  // ============================================================================
  // PHASE 9: EVIDENCE SYNTHESIS DIFFICULTIES
  // ============================================================================
  {
    id: 'synthesis-1',
    phase: 'Evidence Synthesis',
    difficulty: 'Different methods give different answers - who to believe?',
    severity: 'major',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Default to larger studies or more recent papers',
    proposedSolutions: {
      shortTerm: 'Evidence table generator: auto-create table with Paper | Method | N | Key Finding | Direction. Sortable by any column.',
      mediumTerm: 'Method quality indicators: flag studies with small N, no controls, industry funding, pre-registration status.',
      longTerm: 'AI-assisted meta-summary: "Across 12 studies, 8 find positive effect (pooled N=1,240), 4 find no effect (pooled N=380). Effect size heterogeneity is high (I²=78%)."',
    },
    implementationPriority: 'high',
    userImpact: 'Transforms subjective synthesis into rigorous evidence mapping. Key for credible reviews.',
    technicalNotes: 'Method/N extraction: structured LLM prompt on abstract + methods section. Meta-analysis: beyond current scope but table generation is feasible.',
  },
  {
    id: 'synthesis-2',
    phase: 'Evidence Synthesis',
    difficulty: 'Industry-funded studies might be biased but also higher quality',
    severity: 'moderate',
    frequencyForUsers: 'common',
    currentWorkaround: 'Disclose funding in review, weight subjectively',
    proposedSolutions: {
      shortTerm: 'Auto-extract funding/conflict statements. Show badge: "Industry funded" or "NIH funded."',
      mediumTerm: 'Funding pattern analysis: "5/7 positive studies are industry funded. 2/3 negative studies are academic."',
      longTerm: 'Bias-adjusted synthesis: weight evidence by funding source and registration status in summary statistics.',
    },
    implementationPriority: 'medium',
    userImpact: 'Transparency about funding improves review credibility.',
    technicalNotes: 'Funding extraction: look for Funding, Acknowledgments, Conflict sections in PDF. Pattern is usually recognizable.',
  },

  // ============================================================================
  // PHASE 10: WRITING DIFFICULTIES
  // ============================================================================
  {
    id: 'writing-1',
    phase: 'Writing',
    difficulty: 'Writing transitions between papers is hard',
    severity: 'moderate',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Use template phrases: "Building on this work...", "In contrast..."',
    proposedSolutions: {
      shortTerm: 'Transition phrase library: categorized suggestions for different connection types.',
      mediumTerm: 'AI transition generator: given two papers and their connection, suggest 3 transition sentences.',
      longTerm: 'Full paragraph drafting: user provides paper sequence, AI drafts synthesis paragraph with proper transitions. User edits.',
    },
    implementationPriority: 'medium',
    userImpact: 'Reduces writer\'s block. Writing flows faster with scaffolding.',
    technicalNotes: 'Transition generation: provide connection type + both takeaways + thesis context. Short LLM call.',
  },
  {
    id: 'writing-2',
    phase: 'Writing',
    difficulty: 'Transforming structured notes into flowing narrative',
    severity: 'major',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Manual rewriting, often losing structured insights',
    proposedSolutions: {
      shortTerm: 'Export as structured outline: themes → papers → takeaways → connections. Clear hierarchy for manual writing.',
      mediumTerm: 'Section draft generator: given a theme, generate 500-word draft synthesizing its papers. User heavily edits.',
      longTerm: 'Interactive writing assistant: user writes, AI suggests citations: "This claim might be supported by [Paper X]." Real-time synthesis support.',
    },
    implementationPriority: 'high',
    userImpact: 'The final writing phase is where all synthesis pays off. Good export = good review.',
    technicalNotes: 'Export is straightforward JSON/markdown conversion. Draft generation needs careful prompting to avoid hallucination. Citation suggestion: embed user sentence, find similar takeaways.',
  },
  {
    id: 'writing-3',
    phase: 'Writing',
    difficulty: 'Citation format changes between journals',
    severity: 'minor',
    frequencyForUsers: 'universal',
    currentWorkaround: 'Use reference manager (Zotero, EndNote) with styles',
    proposedSolutions: {
      shortTerm: 'Export in common formats: BibTeX, RIS, EndNote XML. Import to reference manager.',
      mediumTerm: 'Built-in citation formatting: select journal, get formatted bibliography.',
      longTerm: 'Direct journal submission integration: export formatted manuscript with citations ready for submission.',
    },
    implementationPriority: 'low',
    userImpact: 'Nice-to-have but not core value. Reference managers exist.',
    technicalNotes: 'CSL (Citation Style Language) library can format citations. 9000+ journal styles available.',
  },
];

// ============================================================================
// IMPROVEMENT ROADMAP - Prioritized Implementation Plan
// ============================================================================

export const improvementRoadmap = {
  phase1: {
    name: 'Foundation (Current Sprint)',
    focus: 'Fix critical usability issues',
    items: [
      { id: 'connection-3', effort: 'large', impact: 'high', description: 'Fix hairball graph - implement cluster-aware layout' },
      { id: 'systematic-2', effort: 'medium', impact: 'high', description: 'AI relevance scoring for batch import' },
      { id: 'systematic-3', effort: 'small', impact: 'medium', description: 'Duplicate detection on import' },
    ],
  },
  phase2: {
    name: 'Core AI Features (Next Sprint)',
    focus: 'Enhance AI-assisted synthesis',
    items: [
      { id: 'reading-1', effort: 'medium', impact: 'high', description: 'AI-suggested takeaways' },
      { id: 'connection-2', effort: 'medium', impact: 'high', description: 'AI connection suggestions with explanation' },
      { id: 'gap-1', effort: 'large', impact: 'high', description: 'AI gap detection' },
    ],
  },
  phase3: {
    name: 'Discovery & Memory (Future)',
    focus: 'Help users find and remember papers',
    items: [
      { id: 'snowball-1', effort: 'small', impact: 'high', description: 'Forward citations (citing papers)' },
      { id: 'snowball-2', effort: 'medium', impact: 'high', description: 'Depth tracking and stopping suggestions' },
      { id: 'reading-3', effort: 'medium', impact: 'high', description: 'Spaced repetition for paper memory' },
    ],
  },
  phase4: {
    name: 'Writing Support (Future)',
    focus: 'Help users write their reviews',
    items: [
      { id: 'synthesis-1', effort: 'medium', impact: 'high', description: 'Evidence table generator' },
      { id: 'writing-2', effort: 'large', impact: 'high', description: 'Section draft generator' },
      { id: 'writing-1', effort: 'small', impact: 'medium', description: 'Transition phrase suggestions' },
    ],
  },
};

// ============================================================================
// GRAPH VISUALIZATION SPECIFIC FIXES
// ============================================================================
// Addressing the disconnected graph shown in user's screenshot

export const graphVisualizationFixes = {
  problem: 'Papers appear disconnected even with many connections',
  rootCauses: [
    'Force-directed layout spreads nodes too far apart',
    'Papers without connections float to edges',
    'Cluster boundaries not visually clear',
    'Connection density varies by region',
  ],
  implementedFix: {
    description: 'Increased connection density from 18 to 68 connections',
    ratio: '68 connections / 55 papers = 1.24 connections per paper',
    expectedOutcome: 'All papers should have at least one connection path to main graph',
  },
  proposedEnhancements: [
    {
      name: 'Cluster-aware layout',
      description: 'Group papers by cluster first, then apply force-directed within clusters',
      implementation: 'Use Cytoscape.js cola or cose-bilkent layout with clustering constraints',
      priority: 'high',
    },
    {
      name: 'Minimum connection visualization',
      description: 'Draw dashed "similarity" edges between papers with no explicit connections',
      implementation: 'Compute embedding similarity, show edges above 0.7 threshold',
      priority: 'medium',
    },
    {
      name: 'Thesis as gravity center',
      description: 'Place thesis node at center, arrange clusters radially around it',
      implementation: 'Custom layout with thesis as fixed node at (0,0)',
      priority: 'high',
    },
    {
      name: 'LOD (Level of Detail) rendering',
      description: 'Show clusters at high zoom, expand to papers on zoom in',
      implementation: 'Compound nodes in Cytoscape.js with zoom-based expansion',
      priority: 'medium',
    },
    {
      name: 'Edge bundling',
      description: 'Bundle edges going to same cluster to reduce visual clutter',
      implementation: 'Cytoscape.js edge-bundling extension or post-processing',
      priority: 'low',
    },
  ],
};

// ============================================================================
// EXPORT WORKFLOW DOCUMENTATION
// ============================================================================

export { biologistWorkflowDocumentation } from './crisprReviewSampleData';
export { crisprThesis } from './crisprReviewSampleData';
