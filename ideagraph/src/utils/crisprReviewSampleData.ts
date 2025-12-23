// ============================================================================
// CRISPR-Cas9 REVIEW SAMPLE DATA - Mimicking a Real Biologist's Workflow
// ============================================================================
//
// This example recreates the literature review process for writing a comprehensive
// review paper on: "CRISPR-Cas9: From Bacterial Immunity to Genome Engineering"
//
// CHOSEN PAPER RATIONALE:
// - CRISPR is a transformative technology with clear intellectual lineage
// - Papers naturally cluster into themes (discovery, mechanism, applications, ethics)
// - Shows how understanding evolves over time (2007-2024)
// - Includes supporting AND contradicting evidence (off-target effects debate)
// - Real review authors must synthesize 50+ papers to write comprehensively
//
// USER PERSONA: Dr. Sarah Chen, postdoc writing her first major review for
// "Annual Review of Biochemistry". She has 6 months and needs to synthesize
// the field comprehensively while adding her own perspective on future directions.
//
// ============================================================================

import type {
  Thesis,
  Paper,
  Argument,
  Evidence
} from '../types';

const generateId = () => crypto.randomUUID();

// ============================================================================
// WORKFLOW DOCUMENTATION - Dr. Chen's Research Journey
// ============================================================================

export interface BiologistWorkflowStep {
  step: number;
  phase: string;
  action: string;
  userThought: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'frustrating';
  timeSpent: string;
  painPoints: string[];
  wishList: string[]; // "What if we have..."
  emotionalState: string; // Real researchers have feelings!
}

export const biologistWorkflowDocumentation: BiologistWorkflowStep[] = [
  {
    step: 1,
    phase: 'Scoping',
    action: 'Define review scope and thesis',
    userThought: 'I want to write THE definitive CRISPR review, but the field is massive. Should I focus on mechanism, applications, or both? The editor wants "comprehensive but focused"...',
    difficulty: 'hard',
    timeSpent: '3 days of thinking + reading existing reviews',
    painPoints: [
      'Existing reviews are either too narrow (just Cas9) or too broad (all genome editing)',
      'Hard to find the "gap" in the review literature itself',
      'Unsure how to balance historical context vs. cutting-edge developments',
      'Editor feedback is vague: "make it your own perspective"',
    ],
    wishList: [
      'Show me gaps in existing review coverage',
      'Suggest unique angles based on my expertise',
      'Map the "review landscape" for my topic',
      'AI-assisted thesis refinement with literature backing',
    ],
    emotionalState: 'Anxious but excited - this could define my career',
  },
  {
    step: 2,
    phase: 'Seed Collection',
    action: 'Gather foundational papers everyone cites',
    userThought: 'Starting with the "big three": Doudna/Charpentier 2012, Jinek 2012, and Zhang 2013. These are the papers EVERYONE cites.',
    difficulty: 'easy',
    timeSpent: '1 day',
    painPoints: [
      'I already know these papers well, but need to re-read with fresh eyes',
      'So many versions - preprints, original papers, corrections, follow-ups',
      'Citation counts are misleading - old papers have more time to accumulate',
    ],
    wishList: [
      'Auto-import "canonical papers" for a topic',
      'Show me the citation network BEFORE I start adding',
      'Flag different versions/corrections of the same paper',
    ],
    emotionalState: 'Confident - I know this territory',
  },
  {
    step: 3,
    phase: 'Snowball Search',
    action: 'Follow citation trails from seed papers',
    userThought: 'The Jinek 2012 paper cites 42 references. Some are essential (CRISPR discovery), some are tangential (general RNA biology). How do I decide?',
    difficulty: 'hard',
    timeSpent: '2 weeks',
    painPoints: [
      'Citation counts are backward-looking - don\'t find new papers',
      'Some crucial methodological papers have low citations',
      'Following every citation is a rabbit hole - need to stop somewhere',
      'Papers cite each other in webs, hard to see the "trunk" vs "branches"',
      'Different subfields cite different foundational papers',
    ],
    wishList: [
      'AI-powered "essential citation" detection',
      'Show citation network with importance weighting',
      'Suggest "you\'re missing this highly-cited paper"',
      'Group citations by reason (method, background, comparison)',
      'Detect circular citation clusters (self-citation networks)',
    ],
    emotionalState: 'Overwhelmed - the literature is infinite',
  },
  {
    step: 4,
    phase: 'Systematic Search',
    action: 'Structured database searches to fill gaps',
    userThought: 'I\'ve been following citations but might be missing whole subfields. Need to do proper PubMed/WoS searches with inclusion criteria.',
    difficulty: 'frustrating',
    timeSpent: '1 week for searching, 2 weeks for screening',
    painPoints: [
      'Each database has different syntax (PubMed vs WoS vs Scopus)',
      'Search returns 3000+ results - impossible to screen all abstracts',
      'Duplicate detection across databases is tedious',
      'Keep adjusting search terms to balance precision/recall',
      'PRISMA requirements mean documenting everything',
    ],
    wishList: [
      'Unified search across databases',
      'AI-assisted abstract screening with explanations',
      'Automatic duplicate detection and merging',
      'Save and refine search strategies over time',
      'Generate PRISMA flow diagram automatically',
    ],
    emotionalState: 'Tedious but necessary - this is the boring part of science',
  },
  {
    step: 5,
    phase: 'Deep Reading',
    action: 'Read and synthesize each included paper',
    userThought: 'I have 80 papers to read carefully. Each takes 1-2 hours to really understand. That\'s 80-160 hours of reading alone...',
    difficulty: 'hard',
    timeSpent: '6 weeks (part-time, alongside other work)',
    painPoints: [
      'Writing good takeaways is HARD - first attempts are just abstract rewording',
      'Some papers need domain expertise I don\'t have (e.g., structural biology)',
      'Arguments blur together across papers - who said what first?',
      'Physical and mental fatigue from intense reading',
      'Keep forgetting details of papers read weeks ago',
    ],
    wishList: [
      'AI-suggested takeaways I can edit and personalize',
      'Side-by-side comparison of similar papers',
      'Spaced repetition reminders to revisit old papers',
      'Auto-extract key figures and tables for quick reference',
      'Link PDF highlights directly to arguments/evidence',
    ],
    emotionalState: 'Determined but exhausted - this is where the real work happens',
  },
  {
    step: 6,
    phase: 'Connection Mapping',
    action: 'Identify relationships between papers',
    userThought: 'Paper A extends Paper B\'s findings, but also contradicts Paper C\'s interpretation. Paper D tried to replicate A but failed. How do I track all this?',
    difficulty: 'hard',
    timeSpent: 'Ongoing throughout reading phase',
    painPoints: [
      'Connection types feel limiting - need "partially supports" or "different context"',
      'Direction matters: A extends B is different from B inspires A',
      'Some connections are obvious only after reading both papers closely',
      'Temporal ordering matters - can\'t critique a paper that came after you',
      'Meta-analyses and reviews connect to everything',
    ],
    wishList: [
      'AI-suggested connections with confidence scores',
      'Bidirectional connection detection',
      'Temporal validation (no citing future papers)',
      'Connection strength/importance rating',
      'Group connections by type for section writing',
    ],
    emotionalState: 'Intellectually engaged - this is the fun synthesis part',
  },
  {
    step: 7,
    phase: 'Theme Emergence',
    action: 'Recognize patterns across papers',
    userThought: 'Three themes keep appearing: (1) specificity improvements, (2) delivery challenges, (3) ethical debates. These could be my review sections.',
    difficulty: 'medium',
    timeSpent: '1 week of reflection and reorganization',
    painPoints: [
      'Themes are fuzzy at first - take time to crystallize',
      'Some papers span multiple themes - where to place them?',
      'Want to organize by theme, not chronology, but editors want both',
      'My themes might not match how others organize the field',
    ],
    wishList: [
      'AI-detected themes from paper arguments',
      'Drag-drop papers into theme clusters',
      'Show coverage gaps per theme',
      'Compare my themes to published reviews',
      'Auto-generate theme summaries for each cluster',
    ],
    emotionalState: 'Excited - the review structure is taking shape!',
  },
  {
    step: 8,
    phase: 'Gap Identification',
    action: 'Find what\'s MISSING in the literature',
    userThought: 'Everyone studies HEK293 cells. Nobody studies primary human cells from diverse populations. That\'s a gap I can highlight!',
    difficulty: 'hard',
    timeSpent: '2 weeks (ongoing reflection)',
    painPoints: [
      'Gaps are absences - hard to notice what ISN\'T there',
      'Some gaps exist because the experiments are too hard/expensive',
      'Distinguishing "gap" from "not interesting enough to study"',
      'Need deep domain knowledge to identify methodological gaps',
      'Reviewers will challenge my gap claims - need to defend them',
    ],
    wishList: [
      'AI gap detection: "No papers address X population"',
      'Show missing combinations (all studies use Y, none use Z)',
      'Compare my gaps to those in other reviews',
      'Link gaps to specific missing evidence types',
      'Suggest priority based on field importance',
    ],
    emotionalState: 'Critical thinking mode - this is where I add value as an expert',
  },
  {
    step: 9,
    phase: 'Evidence Synthesis',
    action: 'Weigh conflicting evidence across papers',
    userThought: 'Five papers say Cas9 has low off-target effects. Three papers say off-targets are a major concern. How do I synthesize this disagreement?',
    difficulty: 'frustrating',
    timeSpent: '3 weeks for major controversies',
    painPoints: [
      'Different methods give different answers - who to believe?',
      'Sample sizes vary wildly - some N=3, some N=300',
      'Statistical approaches differ - can\'t directly compare p-values',
      'Industry-funded studies might be biased - but also higher quality',
      'My synthesis could be seen as "taking sides" in controversies',
    ],
    wishList: [
      'Evidence table generator (paper, N, method, result)',
      'Automatic sample size and method comparison',
      'Bias and funding source flagging',
      'Visual consensus/disagreement mapping',
      'Template for writing "the evidence suggests..." paragraphs',
    ],
    emotionalState: 'Stressed - my interpretation matters and could be wrong',
  },
  {
    step: 10,
    phase: 'Writing',
    action: 'Draft review sections from synthesis',
    userThought: 'I have all my notes. Now I need to transform them into flowing prose that tells a story. The "Methods" section is straightforward, but "Implications" requires real creativity.',
    difficulty: 'hard',
    timeSpent: '4 weeks of writing + 4 weeks of revision',
    painPoints: [
      'Writing transitions between papers is hard',
      'Citation format changes between journals - annoying!',
      'Some sections are dense with citations, others sparse',
      'Balancing depth vs. accessibility for broad audience',
      'Figures need to be created from scratch or licensed',
    ],
    wishList: [
      'Export as structured draft with placeholders',
      'Auto-generate evidence summary tables',
      'Citation style auto-conversion',
      'Suggest papers for under-cited sections',
      'Draft figure captions from linked papers',
    ],
    emotionalState: 'Creative but anxious - this is where it all comes together',
  },
];

// ============================================================================
// SAMPLE THESIS - CRISPR Review
// ============================================================================

export const crisprThesis: Omit<Thesis, 'id' | 'createdAt' | 'updatedAt' | 'paperIds' | 'connectionIds'> = {
  title: 'How has CRISPR-Cas9 evolved from a bacterial defense mechanism to a transformative genome editing platform, and what are its current limitations and future directions?',
  description: `A comprehensive review for Annual Review of Biochemistry examining CRISPR-Cas9 from multiple perspectives:

1. HISTORICAL CONTEXT: Discovery of CRISPR repeats, identification of Cas proteins, understanding of adaptive immunity
2. MOLECULAR MECHANISM: Structure, function, and specificity determinants of Cas9
3. ENGINEERING ADVANCES: Modifications for improved specificity, orthogonal systems, base/prime editing
4. APPLICATIONS: Therapeutics, agriculture, diagnostics, gene drives
5. LIMITATIONS: Off-target effects, delivery challenges, immune responses
6. ETHICAL CONSIDERATIONS: Germline editing, equity of access, dual-use concerns
7. FUTURE DIRECTIONS: Next-generation systems, clinical translation, regulatory frameworks

Target audience: Graduate students and researchers entering the field who need comprehensive grounding.
Word limit: 15,000 words with ~200 citations.`,
  isArchived: false,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const arg = (claim: string, strength: Argument['strength'], assessment: Argument['yourAssessment']): Argument => ({
  id: generateId(),
  claim,
  strength,
  yourAssessment: assessment,
});

const ev = (description: string, type: Evidence['type'], argumentId?: string): Evidence => ({
  id: generateId(),
  description,
  type,
  linkedArgumentId: argumentId || null,
});

// ============================================================================
// PAPERS PART 1: DISCOVERY & EARLY MECHANISM (Papers 1-15)
// ============================================================================
// These are the foundational papers that established CRISPR as a field
// User thought: "These are the papers EVERYONE cites - I need to understand the intellectual lineage"

export const crisprPapersPart1: Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'>[] = [
  // -------------------------------------------------------------------------
  // Paper 1: The Original CRISPR Discovery (Ishino 1987)
  // User thought: "Nobody reads this, but I should cite it for historical completeness"
  // Difficulty: Finding and reading a 1987 paper in Japanese context
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1128/jb.169.12.5429-5433.1987',
    title: 'Nucleotide sequence of the iap gene, responsible for alkaline phosphatase isozyme conversion in Escherichia coli, and identification of the gene product',
    authors: [
      { name: 'Yoshizumi Ishino' },
      { name: 'Hideo Shinagawa' },
      { name: 'Kozo Makino' },
      { name: 'Mitsuko Amemura' },
      { name: 'Atsuo Nakata' },
    ],
    year: 1987,
    journal: 'Journal of Bacteriology',
    volume: '169',
    issue: '12',
    pages: '5429-5433',
    abstract: 'We sequenced the iap gene and found an unusual series of 29-nucleotide repeats in the 3\' flanking region.',
    url: 'https://doi.org/10.1128/jb.169.12.5429-5433.1987',
    pdfUrl: null,
    citationCount: 850,
    takeaway: 'First observation of CRISPR repeats, though their function was unknown - a serendipitous discovery buried in a paper about something else entirely.',
    arguments: [
      arg('Unusual repeat sequences exist downstream of iap gene', 'strong', 'agree'),
      arg('The biological significance of these repeats is unknown', 'moderate', 'agree'),
    ],
    evidence: [
      ev('29 nt repeats with 32 nt spacers identified by Sanger sequencing', 'experimental'),
    ],
    assessment: 'Historically important but the authors had no idea what they found. This is a lesson in how discoveries often precede understanding by decades.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['crispr-discovery', 'historical', 'e-coli', 'repeats'],
    readAt: '2024-01-05T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-05T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 2: CRISPR Naming and Bioinformatics (Jansen 2002)
  // User thought: "This is where the name 'CRISPR' was coined - important for terminology"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1046/j.1365-2958.2002.02839.x',
    title: 'Identification of genes that are associated with DNA repeats in prokaryotes',
    authors: [
      { name: 'Ruud Jansen' },
      { name: 'Jan D.A. van Embden' },
      { name: 'Wim J.R. Gaastra' },
      { name: 'Leo M. Schouls' },
    ],
    year: 2002,
    journal: 'Molecular Microbiology',
    volume: '43',
    issue: '6',
    pages: '1565-1575',
    abstract: 'We propose to name these repeats Clustered Regularly Interspaced Short Palindromic Repeats (CRISPR) and identify associated cas genes.',
    url: 'https://doi.org/10.1046/j.1365-2958.2002.02839.x',
    pdfUrl: null,
    citationCount: 2100,
    takeaway: 'Coined the CRISPR acronym and identified cas (CRISPR-associated) genes through bioinformatics, unifying scattered observations into a coherent system.',
    arguments: [
      arg('CRISPR repeats are found in many bacterial and archaeal species', 'strong', 'agree'),
      arg('cas genes are consistently found adjacent to CRISPR arrays', 'strong', 'agree'),
      arg('The CRISPR-Cas system likely has a common evolutionary origin', 'moderate', 'agree'),
    ],
    evidence: [
      ev('CRISPR found in 40/67 archaea and 25/155 bacteria analyzed', 'computational'),
      ev('Four cas genes (cas1-4) identified by sequence conservation', 'computational'),
    ],
    assessment: 'Critical nomenclature paper. The bioinformatic approach predicted functionality before it was experimentally verified.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['crispr-discovery', 'bioinformatics', 'nomenclature', 'cas-genes'],
    readAt: '2024-01-06T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-06T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 3: Spacers Match Viral Sequences (Mojica 2005)
  // User thought: "This is THE conceptual breakthrough - spacers come from phages!"
  // Difficulty: Hard to appreciate how radical this hypothesis was at the time
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1016/j.jmb.2004.12.055',
    title: 'Intervening sequences of regularly spaced prokaryotic repeats derive from foreign genetic elements',
    authors: [
      { name: 'Francisco J.M. Mojica' },
      { name: 'ChCésar Díez-Villaseñor' },
      { name: 'Jesús García-Martínez' },
      { name: 'Elena Soria' },
    ],
    year: 2005,
    journal: 'Journal of Molecular Evolution',
    volume: '60',
    issue: '2',
    pages: '174-182',
    abstract: 'We show that spacer sequences within CRISPR loci derive from preexisting sequences, including bacteriophages and plasmids.',
    url: 'https://doi.org/10.1016/j.jmb.2004.12.055',
    pdfUrl: null,
    citationCount: 3200,
    takeaway: 'Revolutionary insight: CRISPR spacers match phage and plasmid sequences, suggesting an adaptive immune memory system in bacteria.',
    arguments: [
      arg('CRISPR spacers derive from foreign genetic elements (phages, plasmids)', 'strong', 'agree'),
      arg('This represents a form of acquired immunity in prokaryotes', 'strong', 'agree'),
      arg('New spacers are acquired upon infection', 'moderate', 'agree'),
    ],
    evidence: [
      ev('88 spacers matched known extrachromosomal elements', 'computational'),
      ev('Strains with matching spacers were resistant to cognate phage', 'computational'),
    ],
    assessment: 'The "eureka" paper of the field. Mojica deserves more credit - he figured out the function before anyone else but struggled to publish.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['crispr-discovery', 'adaptive-immunity', 'phage', 'conceptual-breakthrough'],
    readAt: '2024-01-07T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-07T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 4: Experimental Proof of Immunity (Barrangou 2007)
  // User thought: "This is the experimental validation that changed everything"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.1138140',
    title: 'CRISPR provides acquired resistance against viruses in prokaryotes',
    authors: [
      { name: 'Rodolphe Barrangou' },
      { name: 'Christophe Fremaux' },
      { name: 'Hélène Deveau' },
      { name: 'Melissa Richards' },
      { name: 'Patrick Boyaval' },
      { name: 'Sylvain Moineau' },
      { name: 'Dennis A. Romero' },
      { name: 'Philippe Horvath' },
    ],
    year: 2007,
    journal: 'Science',
    volume: '315',
    issue: '5819',
    pages: '1709-1712',
    abstract: 'We show that after viral challenge, bacteria integrate new spacers derived from phage DNA, which provides specific resistance to future infection.',
    url: 'https://doi.org/10.1126/science.1138140',
    pdfUrl: null,
    citationCount: 5800,
    takeaway: 'First experimental proof that CRISPR-Cas provides adaptive immunity: new spacers are acquired from phages and confer resistance.',
    arguments: [
      arg('CRISPR provides sequence-specific viral resistance', 'strong', 'agree'),
      arg('Resistance is acquired through spacer incorporation from invaders', 'strong', 'agree'),
      arg('cas genes are required for both acquisition and interference', 'strong', 'agree'),
    ],
    evidence: [
      ev('Phage-resistant mutants acquired new spacers matching phage DNA', 'experimental'),
      ev('Deleting spacers eliminated resistance; adding spacers restored it', 'experimental'),
      ev('cas7 deletion abolished resistance despite spacer presence', 'experimental'),
    ],
    assessment: 'Landmark Science paper from Danisco (yogurt company!). Industrial application drove basic science - a great example of applied research leading to fundamental discoveries.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['crispr-discovery', 'adaptive-immunity', 'experimental-proof', 'landmark'],
    readAt: '2024-01-08T14:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-08T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 5: tracrRNA Discovery (Deltcheva 2011)
  // User thought: "This explains how Cas9 systems work - critical for engineering"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nature09886',
    title: 'CRISPR RNA maturation by trans-encoded small RNA and host factor RNase III',
    authors: [
      { name: 'Elitza Deltcheva' },
      { name: 'Krzysztof Chylinski' },
      { name: 'Cynthia M. Sharma' },
      { name: 'Karine Gonzales' },
      { name: 'Yanjie Chao' },
      { name: 'Zaid A. Pirzada' },
      { name: 'Maria R. Eckert' },
      { name: 'Jörg Vogel' },
      { name: 'Emmanuelle Charpentier' },
    ],
    year: 2011,
    journal: 'Nature',
    volume: '471',
    issue: '7340',
    pages: '602-607',
    abstract: 'We identify tracrRNA (trans-activating CRISPR RNA) as essential for crRNA maturation and Cas9 function.',
    url: 'https://doi.org/10.1038/nature09886',
    pdfUrl: null,
    citationCount: 3900,
    takeaway: 'Discovery of tracrRNA - a trans-encoded RNA essential for crRNA processing and Cas9 function, which enabled the later sgRNA design.',
    arguments: [
      arg('tracrRNA is required for crRNA maturation in Type II systems', 'strong', 'agree'),
      arg('tracrRNA base-pairs with the repeat region of pre-crRNA', 'strong', 'agree'),
      arg('RNase III processes the tracrRNA:crRNA duplex', 'strong', 'agree'),
    ],
    evidence: [
      ev('tracrRNA identified by deep sequencing of Streptococcus small RNAs', 'experimental'),
      ev('tracrRNA deletion abolished crRNA maturation and immunity', 'experimental'),
      ev('RNase III mutants showed unprocessed tracrRNA:crRNA duplexes', 'experimental'),
    ],
    assessment: 'Critical mechanistic insight from Charpentier\'s lab. Understanding tracrRNA was key to designing single-guide RNAs for biotechnology.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['mechanism', 'tracrRNA', 'rna-processing', 'charpentier'],
    readAt: '2024-01-09T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-09T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 6: THE Jinek 2012 Paper - Programmable DNA Endonuclease
  // User thought: "This is THE paper - the one that launched a revolution"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.1225829',
    title: 'A programmable dual-RNA-guided DNA endonuclease in adaptive bacterial immunity',
    authors: [
      { name: 'Martin Jinek' },
      { name: 'Krzysztof Chylinski' },
      { name: 'Ines Fonfara' },
      { name: 'Michael Hauer' },
      { name: 'Jennifer A. Doudna' },
      { name: 'Emmanuelle Charpentier' },
    ],
    year: 2012,
    journal: 'Science',
    volume: '337',
    issue: '6096',
    pages: '816-821',
    abstract: 'Cas9 is a dual-RNA-guided DNA endonuclease that can be programmed to cleave any DNA sequence. We show that a single chimeric guide RNA can direct Cas9 cleavage.',
    url: 'https://doi.org/10.1126/science.1225829',
    pdfUrl: null,
    citationCount: 15200,
    takeaway: 'The breakthrough: Cas9 is a programmable DNA cutter requiring only a single guide RNA - biotechnology implications were immediately obvious.',
    arguments: [
      arg('Cas9 requires both crRNA and tracrRNA for DNA cleavage', 'strong', 'agree'),
      arg('A single chimeric guide RNA (sgRNA) can replace the dual-RNA system', 'strong', 'agree'),
      arg('Cas9 creates blunt-ended double-strand breaks 3 bp upstream of PAM', 'strong', 'agree'),
      arg('The system can be programmed to target any sequence with a PAM', 'strong', 'agree'),
    ],
    evidence: [
      ev('In vitro cleavage assays with purified Cas9 and guide RNAs', 'experimental'),
      ev('sgRNA works as efficiently as dual crRNA:tracrRNA', 'experimental'),
      ev('Cleavage specificity determined by 20 nt guide sequence', 'experimental'),
    ],
    assessment: 'Nobel Prize-worthy work. The insight that sgRNA works was the key to practical applications. Every genome editing paper traces back here.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['mechanism', 'landmark', 'sgRNA', 'doudna', 'charpentier', 'programmable'],
    readAt: '2024-01-10T08:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-10T07:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 7: Cas9 Crystal Structure (Jinek 2014)
  // User thought: "Structure helps understand specificity - important for engineering"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.1247997',
    title: 'Structures of Cas9 endonucleases reveal RNA-mediated conformational activation',
    authors: [
      { name: 'Martin Jinek' },
      { name: 'Fuguo Jiang' },
      { name: 'David W. Taylor' },
      { name: 'Samuel H. Sternberg' },
      { name: 'Emine Kaya' },
      { name: 'Enbo Ma' },
      { name: 'Carolin Anders' },
      { name: 'Michael Hauer' },
      { name: 'Kaihong Zhou' },
      { name: 'Steven Lin' },
      { name: 'Matteo Kaber' },
      { name: 'Eva Nogales' },
      { name: 'Jennifer A. Doudna' },
    ],
    year: 2014,
    journal: 'Science',
    volume: '343',
    issue: '6176',
    pages: '1247997',
    abstract: 'Crystal structures of Cas9 reveal a bilobed architecture and show how RNA binding induces large conformational changes.',
    url: 'https://doi.org/10.1126/science.1247997',
    pdfUrl: null,
    citationCount: 2800,
    takeaway: 'First high-resolution Cas9 structure reveals bilobed architecture and explains how sgRNA binding reorganizes the enzyme for DNA recognition.',
    arguments: [
      arg('Cas9 has a bilobed structure with REC and NUC domains', 'strong', 'agree'),
      arg('sgRNA binding causes major conformational changes', 'strong', 'agree'),
      arg('HNH and RuvC domains cleave complementary and non-complementary strands respectively', 'strong', 'agree'),
    ],
    evidence: [
      ev('2.6 Å crystal structure of apo-Cas9', 'experimental'),
      ev('3.0 Å structure of Cas9-sgRNA complex', 'experimental'),
      ev('Comparison shows 28 Å displacement upon RNA binding', 'experimental'),
    ],
    assessment: 'Beautiful structural work. Essential for understanding how to engineer improved Cas9 variants.',
    thesisRole: 'method',
    readingStatus: 'read',
    tags: ['structure', 'mechanism', 'crystallography', 'conformational-change'],
    readAt: '2024-01-12T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-12T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 8: Mammalian Genome Editing (Cong 2013)
  // User thought: "This showed it works in human cells - the race was on"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.1231143',
    title: 'Multiplex genome engineering using CRISPR/Cas systems',
    authors: [
      { name: 'Le Cong' },
      { name: 'F. Ann Ran' },
      { name: 'David Cox' },
      { name: 'Shuailiang Lin' },
      { name: 'Robert Barretto' },
      { name: 'Naomi Habib' },
      { name: 'Patrick D. Hsu' },
      { name: 'Xuebing Wu' },
      { name: 'Wenyan Jiang' },
      { name: 'Luciano A. Marraffini' },
      { name: 'Feng Zhang' },
    ],
    year: 2013,
    journal: 'Science',
    volume: '339',
    issue: '6121',
    pages: '819-823',
    abstract: 'We engineered CRISPR/Cas systems for multiplex genome editing in mammalian cells, demonstrating efficient gene targeting and chromosomal deletions.',
    url: 'https://doi.org/10.1126/science.1231143',
    pdfUrl: null,
    citationCount: 12500,
    takeaway: 'First demonstration that CRISPR-Cas9 works efficiently in human cells, with multiplex capability - sparked the genome editing revolution.',
    arguments: [
      arg('Type II CRISPR systems can be reconstituted in human cells', 'strong', 'agree'),
      arg('Multiple genes can be targeted simultaneously (multiplex)', 'strong', 'agree'),
      arg('Nickase mutations reduce off-target effects', 'moderate', 'agree'),
    ],
    evidence: [
      ev('15-25% indel rates at endogenous loci (EMX1, PVALB)', 'experimental'),
      ev('Simultaneous targeting of 2+ genes in single cells', 'experimental'),
      ev('D10A nickase showed reduced off-targets with paired guides', 'experimental'),
    ],
    assessment: 'Published same day as Mali et al. - the race was tight. Zhang lab\'s contribution to mammalian applications was crucial.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['mammalian', 'genome-editing', 'multiplex', 'zhang-lab', 'landmark'],
    readAt: '2024-01-13T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-13T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 9: Mali Human Cell Editing (Mali 2013)
  // User thought: "Published same day as Cong - shows convergent thinking"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.1232033',
    title: 'RNA-guided human genome engineering via Cas9',
    authors: [
      { name: 'Prashant Mali' },
      { name: 'Luhan Yang' },
      { name: 'Kevin M. Esvelt' },
      { name: 'John Aach' },
      { name: 'Marc Guell' },
      { name: 'James E. DiCarlo' },
      { name: 'Julie E. Norville' },
      { name: 'George M. Church' },
    ],
    year: 2013,
    journal: 'Science',
    volume: '339',
    issue: '6121',
    pages: '823-826',
    abstract: 'We describe a simple and efficient method for genome editing in human cells using RNA-guided Cas9.',
    url: 'https://doi.org/10.1126/science.1232033',
    pdfUrl: null,
    citationCount: 8900,
    takeaway: 'Independent demonstration of CRISPR in human cells, emphasizing simplicity and showing HDR-based precise editing.',
    arguments: [
      arg('Cas9 can be codon-optimized for efficient mammalian expression', 'strong', 'agree'),
      arg('Homology-directed repair enables precise sequence insertion', 'strong', 'agree'),
      arg('The system is remarkably simple to implement', 'strong', 'agree'),
    ],
    evidence: [
      ev('10-25% HDR rates with ssODN donors', 'experimental'),
      ev('Editing at AAVS1 safe harbor locus demonstrated', 'experimental'),
      ev('Works in human iPS cells', 'experimental'),
    ],
    assessment: 'Church lab\'s parallel demonstration. Together with Cong, established that CRISPR editing is robust and reproducible.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['mammalian', 'genome-editing', 'hdr', 'church-lab'],
    readAt: '2024-01-13T14:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-13T10:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 10: SpCas9 PAM Flexibility Study (Kleinstiver 2015 - SpCas9-VRER)
  // User thought: "PAM restriction is a key limitation - this addresses it"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nature14592',
    title: 'Engineered CRISPR-Cas9 nucleases with altered PAM specificities',
    authors: [
      { name: 'Benjamin P. Kleinstiver' },
      { name: 'Michelle S. Prew' },
      { name: 'Shengdar Q. Tsai' },
      { name: 'Ved V. Topkar' },
      { name: 'Nhu T. Nguyen' },
      { name: 'Zongli Zheng' },
      { name: 'Andrew P.W. Gonzales' },
      { name: 'Zhuyun Li' },
      { name: 'Randall T. Peterson' },
      { name: 'J. Keith Joung' },
      { name: 'Martin J. Aryee' },
    ],
    year: 2015,
    journal: 'Nature',
    volume: '523',
    issue: '7561',
    pages: '481-485',
    abstract: 'We engineered SpCas9 variants with altered PAM recognition, expanding the targeting range of CRISPR-Cas9.',
    url: 'https://doi.org/10.1038/nature14592',
    pdfUrl: null,
    citationCount: 2100,
    takeaway: 'First engineered Cas9 variants with altered PAM requirements, expanding targetable sequence space - a key engineering advance.',
    arguments: [
      arg('PAM-interacting domain mutations can alter PAM specificity', 'strong', 'agree'),
      arg('VQR, EQR, and VRER variants recognize different PAMs', 'strong', 'agree'),
      arg('Some variants maintain high activity with new PAMs', 'moderate', 'agree'),
    ],
    evidence: [
      ev('VQR variant cleaves NGAN PAMs (vs NGG for wild-type)', 'experimental'),
      ev('VRER variant cleaves NGCG PAMs', 'experimental'),
      ev('Activity validated in human cells at multiple loci', 'experimental'),
    ],
    assessment: 'Important engineering work. Addressed a major limitation (PAM restriction) that prevented targeting some sequences.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['engineering', 'pam', 'specificity', 'variants'],
    readAt: '2024-01-15T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-15T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 11: High-Fidelity Cas9 (Kleinstiver 2016 - SpCas9-HF1)
  // User thought: "Off-targets are THE major concern - this is a key solution"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nature16526',
    title: 'High-fidelity CRISPR-Cas9 nucleases with no detectable genome-wide off-target effects',
    authors: [
      { name: 'Benjamin P. Kleinstiver' },
      { name: 'Vikram Pattanayak' },
      { name: 'Michelle S. Prew' },
      { name: 'Shengdar Q. Tsai' },
      { name: 'Nhu T. Nguyen' },
      { name: 'Zongli Zheng' },
      { name: 'J. Keith Joung' },
    ],
    year: 2016,
    journal: 'Nature',
    volume: '529',
    issue: '7587',
    pages: '490-495',
    abstract: 'We engineered SpCas9-HF1, a high-fidelity variant with no detectable off-target cleavage at loci examined.',
    url: 'https://doi.org/10.1038/nature16526',
    pdfUrl: null,
    citationCount: 3200,
    takeaway: 'SpCas9-HF1 achieves near-zero detectable off-targets by reducing non-specific DNA contacts, a major safety improvement.',
    arguments: [
      arg('Reducing DNA-enzyme contacts increases specificity without losing on-target activity', 'strong', 'agree'),
      arg('Off-target effects are primarily due to excess binding energy', 'strong', 'agree'),
      arg('GUIDE-seq shows no detectable genome-wide off-targets', 'moderate', 'uncertain'),
    ],
    evidence: [
      ev('4 alanine substitutions in SpCas9 (N497A, R661A, Q695A, Q926A)', 'experimental'),
      ev('GUIDE-seq at 7 target sites showed no off-targets', 'experimental'),
      ev('On-target activity preserved (>70% of wild-type)', 'experimental'),
    ],
    assessment: 'Landmark safety engineering. However, "no detectable off-targets" depends on detection method sensitivity - caveat emptor.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['engineering', 'specificity', 'off-target', 'safety', 'high-fidelity'],
    readAt: '2024-01-16T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-16T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 12: eSpCas9 - Enhanced Specificity (Slaymaker 2016)
  // User thought: "Alternative high-fidelity approach - important to compare"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.aad5227',
    title: 'Rationally engineered Cas9 nucleases with improved specificity',
    authors: [
      { name: 'Ian M. Slaymaker' },
      { name: 'Linyi Gao' },
      { name: 'Bernd Zetsche' },
      { name: 'David A. Scott' },
      { name: 'Winston X. Yan' },
      { name: 'Feng Zhang' },
    ],
    year: 2016,
    journal: 'Science',
    volume: '351',
    issue: '6268',
    pages: '84-88',
    abstract: 'We developed eSpCas9 variants with improved specificity through structure-guided engineering of the non-target strand groove.',
    url: 'https://doi.org/10.1126/science.aad5227',
    pdfUrl: null,
    citationCount: 2400,
    takeaway: 'eSpCas9 reduces off-targets via a different mechanism (weakening non-target strand binding) than SpCas9-HF1, offering an alternative engineering approach.',
    arguments: [
      arg('Non-target strand interactions contribute to off-target cleavage', 'strong', 'agree'),
      arg('Positive charges in the groove stabilize non-target strand', 'strong', 'agree'),
      arg('eSpCas9(1.0) and (1.1) show reduced off-targets', 'strong', 'agree'),
    ],
    evidence: [
      ev('3 mutations (K848A, K1003A, R1060A) create eSpCas9(1.1)', 'experimental'),
      ev('10-100 fold reduction in off-target cleavage', 'experimental'),
      ev('On-target activity comparable to wild-type', 'experimental'),
    ],
    assessment: 'Zhang lab\'s parallel solution. Good to have multiple high-fidelity options; best choice may be target-dependent.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['engineering', 'specificity', 'off-target', 'zhang-lab'],
    readAt: '2024-01-17T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-17T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 13: Cas12a/Cpf1 Discovery (Zetsche 2015)
  // User thought: "Alternative to Cas9 - different properties might be useful"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1016/j.cell.2015.09.038',
    title: 'Cpf1 is a single RNA-guided endonuclease of a class 2 CRISPR-Cas system',
    authors: [
      { name: 'Bernd Zetsche' },
      { name: 'Jonathan S. Gootenberg' },
      { name: 'Omar O. Abudayyeh' },
      { name: 'Ian M. Slaymaker' },
      { name: 'Kira S. Makarova' },
      { name: 'Patrick Essletzbichler' },
      { name: 'Sara E. Volz' },
      { name: 'Julia Joung' },
      { name: 'John van der Oost' },
      { name: 'Aviv Regev' },
      { name: 'Eugene V. Koonin' },
      { name: 'Feng Zhang' },
    ],
    year: 2015,
    journal: 'Cell',
    volume: '163',
    issue: '3',
    pages: '759-771',
    abstract: 'We characterize Cpf1, a type V CRISPR effector that uses a T-rich PAM, requires only crRNA, and creates staggered cuts.',
    url: 'https://doi.org/10.1016/j.cell.2015.09.038',
    pdfUrl: null,
    citationCount: 4100,
    takeaway: 'Cas12a (Cpf1) offers distinct advantages: T-rich PAM, staggered cuts, no tracrRNA needed - expanding the CRISPR toolkit.',
    arguments: [
      arg('Cpf1 is a single-effector system without tracrRNA', 'strong', 'agree'),
      arg('T-rich PAM (TTTV) complements Cas9\'s G-rich PAM', 'strong', 'agree'),
      arg('Staggered cuts may improve HDR efficiency', 'moderate', 'uncertain'),
    ],
    evidence: [
      ev('AsCpf1 and LbCpf1 active in human cells', 'experimental'),
      ev('Staggered cut with 4-5 nt 5\' overhangs', 'experimental'),
      ev('Self-processes crRNA array for multiplexing', 'experimental'),
    ],
    assessment: 'Important diversification of the toolkit. Cpf1 is better for some applications; choice depends on target sequence and edit type.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['cas12a', 'cpf1', 'type-v', 'alternative-nuclease'],
    readAt: '2024-01-18T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-18T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 14: Base Editing (Komor 2016)
  // User thought: "Game-changer - precise editing without double-strand breaks!"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nature17946',
    title: 'Programmable editing of a target base in genomic DNA without double-stranded DNA cleavage',
    authors: [
      { name: 'Alexis C. Komor' },
      { name: 'Yongjoo B. Kim' },
      { name: 'Michael S. Packer' },
      { name: 'John A. Zuris' },
      { name: 'David R. Liu' },
    ],
    year: 2016,
    journal: 'Nature',
    volume: '533',
    issue: '7603',
    pages: '420-424',
    abstract: 'We developed base editors that convert C to T (or G to A) without requiring double-strand breaks or donor templates.',
    url: 'https://doi.org/10.1038/nature17946',
    pdfUrl: null,
    citationCount: 4600,
    takeaway: 'Base editors enable precise C→T conversion without DSBs, avoiding indels and p53 activation - potentially safer than nucleases.',
    arguments: [
      arg('Cytidine deaminase fused to dCas9 enables C→T conversion', 'strong', 'agree'),
      arg('No double-strand breaks means no indels at target site', 'strong', 'agree'),
      arg('UGI domain prevents base excision repair of the edit', 'strong', 'agree'),
    ],
    evidence: [
      ev('BE3 achieves 15-75% C→T conversion in human cells', 'experimental'),
      ev('<1% indel formation (vs 20-50% with nucleases)', 'experimental'),
      ev('5 bp editing window (positions 4-8 of protospacer)', 'experimental'),
    ],
    assessment: 'Brilliant engineering from David Liu\'s lab. Circumvents major safety concerns of DSBs. However, bystander edits within window are a limitation.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['base-editing', 'cbe', 'liu-lab', 'no-dsb', 'precision'],
    readAt: '2024-01-19T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-19T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 15: Prime Editing (Anzalone 2019)
  // User thought: "The holy grail - any edit without DSBs? Need to read carefully"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/s41586-019-1711-4',
    title: 'Search-and-replace genome editing without double-strand breaks or donor DNA',
    authors: [
      { name: 'Andrew V. Anzalone' },
      { name: 'Peyton B. Randolph' },
      { name: 'Jessie R. Davis' },
      { name: 'Alexander A. Sousa' },
      { name: 'Luke W. Koblan' },
      { name: 'Jonathan M. Levy' },
      { name: 'Peter J. Chen' },
      { name: 'Christopher Wilson' },
      { name: 'Gregory A. Newby' },
      { name: 'Aditya Raguram' },
      { name: 'David R. Liu' },
    ],
    year: 2019,
    journal: 'Nature',
    volume: '576',
    issue: '7785',
    pages: '149-157',
    abstract: 'Prime editing uses a reverse transcriptase fused to nickase Cas9 and a prime editing guide RNA (pegRNA) to directly write new genetic information into a specified DNA site.',
    url: 'https://doi.org/10.1038/s41586-019-1711-4',
    pdfUrl: null,
    citationCount: 3800,
    takeaway: 'Prime editing enables any small edit (all 12 transitions/transversions, insertions up to 44bp, deletions up to 80bp) without DSBs - the most versatile editing tool yet.',
    arguments: [
      arg('Prime editing can make all 12 types of point mutations', 'strong', 'agree'),
      arg('No DSBs means reduced large deletions and translocations', 'strong', 'agree'),
      arg('pegRNA design is complex but systematic', 'moderate', 'agree'),
      arg('Efficiency is lower than nucleases for some edits', 'moderate', 'agree'),
    ],
    evidence: [
      ev('PE3 achieves 20-50% editing at various loci', 'experimental'),
      ev('Tested 175+ edits across multiple cell types', 'experimental'),
      ev('Correction of sickle cell and Tay-Sachs mutations demonstrated', 'experimental'),
    ],
    assessment: 'Transformative technology. The complexity of pegRNA design is a barrier, but the precision is unmatched. Future of therapeutics?',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['prime-editing', 'liu-lab', 'no-dsb', 'versatile', 'precision'],
    readAt: '2024-01-20T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-20T08:00:00Z',
    semanticScholarId: null,
  },
];

// Export paper count for reference
export const PART1_PAPER_COUNT = crisprPapersPart1.length; // 15 papers
