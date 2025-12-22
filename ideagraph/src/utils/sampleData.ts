// Sample data for testing IdeaGraph
import type { Thesis, Paper, Connection } from '../types';

const generateId = () => crypto.randomUUID();

// Sample thesis about AlphaFold
export const sampleThesis: Omit<Thesis, 'id' | 'createdAt' | 'updatedAt' | 'paperIds' | 'connectionIds'> = {
  title: 'What are the limitations of AlphaFold for drug discovery?',
  description: 'Investigating where AlphaFold2 predictions fall short for practical pharmaceutical applications, including protein-ligand interactions, conformational dynamics, and disordered regions.',
  isArchived: false,
};

// Sample papers with real DOIs
export const samplePapers: Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'>[] = [
  {
    thesisId: '', // Will be set when creating
    doi: '10.1038/s41586-021-03819-2',
    title: 'Highly accurate protein structure prediction with AlphaFold',
    authors: [
      { name: 'John Jumper' },
      { name: 'Richard Evans' },
      { name: 'Alexander Pritzel' },
    ],
    year: 2021,
    journal: 'Nature',
    volume: '596',
    issue: '7873',
    pages: '583-589',
    abstract: 'Proteins are essential to life, and understanding their structure can facilitate understanding of their function. Through an enormous experimental effort, the structures of around 100,000 unique proteins have been determined, but this represents a small fraction of the billions of known protein sequences.',
    url: 'https://doi.org/10.1038/s41586-021-03819-2',
    pdfUrl: null,
    citationCount: 15000,
    takeaway: 'AlphaFold2 achieves near-experimental accuracy (GDT > 90) for most protein structure predictions using deep learning with attention mechanisms.',
    arguments: [
      {
        id: generateId(),
        claim: 'Deep learning can solve the protein folding problem',
        strength: 'strong',
        yourAssessment: 'agree',
      },
      {
        id: generateId(),
        claim: 'Attention mechanisms effectively capture evolutionary covariance',
        strength: 'strong',
        yourAssessment: 'agree',
      },
    ],
    evidence: [
      {
        id: generateId(),
        description: 'Median GDT-TS of 92.4 on CASP14 free-modeling targets',
        type: 'computational',
        linkedArgumentId: null,
      },
    ],
    assessment: 'Groundbreaking work, but focuses on static structures',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['alphafold', 'deep-learning', 'casp14'],
    readAt: '2024-01-15T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-15T10:00:00Z',
    semanticScholarId: null,
  },
  {
    thesisId: '',
    doi: '10.1038/s41594-022-00849-w',
    title: 'AlphaFold2 fails to predict protein fold switching',
    authors: [
      { name: 'Devlina Chakravarty' },
      { name: 'Lauren L. Porter' },
    ],
    year: 2022,
    journal: 'Protein Science',
    volume: '31',
    issue: '12',
    pages: null,
    abstract: 'Fold-switching proteins challenge the traditional one-sequence-one-structure paradigm. We show that AlphaFold2 cannot predict alternative folds.',
    url: 'https://doi.org/10.1038/s41594-022-00849-w',
    pdfUrl: null,
    citationCount: 245,
    takeaway: 'AlphaFold2 cannot predict fold-switching proteins because it assumes a single dominant conformation per sequence.',
    arguments: [
      {
        id: generateId(),
        claim: 'AF2 is trained on single structures, missing conformational diversity',
        strength: 'strong',
        yourAssessment: 'agree',
      },
    ],
    evidence: [
      {
        id: generateId(),
        description: 'Tested on 98 fold-switching proteins, AF2 predicted only one fold',
        type: 'computational',
        linkedArgumentId: null,
      },
    ],
    assessment: 'Critical limitation for drug discovery where conformational changes matter',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['alphafold', 'limitations', 'fold-switching'],
    readAt: '2024-02-01T14:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-01T14:00:00Z',
    semanticScholarId: null,
  },
  {
    thesisId: '',
    doi: '10.1021/acs.jcim.2c01270',
    title: 'How good is AlphaFold at predicting protein-ligand binding sites?',
    authors: [
      { name: 'Ruibin Liu' },
      { name: 'Xiwen Jia' },
    ],
    year: 2023,
    journal: 'Journal of Chemical Information and Modeling',
    volume: '63',
    issue: '3',
    pages: '866-876',
    abstract: 'We systematically evaluate AlphaFold2 structures for protein-ligand binding site prediction.',
    url: 'https://doi.org/10.1021/acs.jcim.2c01270',
    pdfUrl: null,
    citationCount: 89,
    takeaway: 'AlphaFold structures have lower accuracy for ligand binding site prediction compared to experimental structures, especially for flexible binding sites.',
    arguments: [
      {
        id: generateId(),
        claim: 'AF2 structures show displaced side chains at binding sites',
        strength: 'moderate',
        yourAssessment: 'agree',
      },
      {
        id: generateId(),
        claim: 'pLDDT scores correlate with binding site accuracy',
        strength: 'strong',
        yourAssessment: 'agree',
      },
    ],
    evidence: [
      {
        id: generateId(),
        description: 'Binding site RMSD 1.5-2.0Å higher than experimental structures on average',
        type: 'computational',
        linkedArgumentId: null,
      },
    ],
    assessment: null,
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['alphafold', 'drug-discovery', 'binding-sites'],
    readAt: '2024-02-10T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-10T09:00:00Z',
    semanticScholarId: null,
  },
  {
    thesisId: '',
    doi: '10.1038/s41573-022-00465-x',
    title: 'The impact of AlphaFold on drug discovery',
    authors: [
      { name: 'Michelle Gill' },
      { name: 'Alexander Brown' },
    ],
    year: 2022,
    journal: 'Nature Reviews Drug Discovery',
    volume: '21',
    issue: null,
    pages: '323-324',
    abstract: 'A perspective on how AlphaFold is changing structure-based drug design.',
    url: 'https://doi.org/10.1038/s41573-022-00465-x',
    pdfUrl: null,
    citationCount: 412,
    takeaway: 'AlphaFold accelerates early-stage drug discovery by providing starting structures, but experimental validation remains essential for lead optimization.',
    arguments: [
      {
        id: generateId(),
        claim: 'AF2 structures are useful for virtual screening campaigns',
        strength: 'moderate',
        yourAssessment: 'agree',
      },
    ],
    evidence: [],
    assessment: 'Good overview but somewhat optimistic',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['alphafold', 'drug-discovery', 'review'],
    readAt: '2024-01-20T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-20T11:00:00Z',
    semanticScholarId: null,
  },
  {
    thesisId: '',
    doi: '10.1016/j.str.2022.04.012',
    title: 'Intrinsically disordered regions in AlphaFold predictions',
    authors: [
      { name: 'R. Piovesan' },
      { name: 'S. Tosatto' },
    ],
    year: 2022,
    journal: 'Structure',
    volume: '30',
    issue: '7',
    pages: '1011-1021',
    abstract: 'We analyze how AlphaFold2 handles intrinsically disordered proteins and regions.',
    url: 'https://doi.org/10.1016/j.str.2022.04.012',
    pdfUrl: null,
    citationCount: 178,
    takeaway: 'AlphaFold correctly identifies disordered regions via low pLDDT scores but cannot predict their functional conformational ensembles.',
    arguments: [
      {
        id: generateId(),
        claim: 'pLDDT < 50 reliably indicates disorder',
        strength: 'strong',
        yourAssessment: 'agree',
      },
      {
        id: generateId(),
        claim: 'Disordered regions often have functional roles in drug targets',
        strength: 'strong',
        yourAssessment: 'agree',
      },
    ],
    evidence: [
      {
        id: generateId(),
        description: '93% of known IDRs have pLDDT < 50 in AlphaFold predictions',
        type: 'computational',
        linkedArgumentId: null,
      },
    ],
    assessment: null,
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['alphafold', 'disorder', 'idr'],
    readAt: '2024-02-15T16:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-15T16:00:00Z',
    semanticScholarId: null,
  },
];

// Sample connections between papers
export const sampleConnections: Omit<Connection, 'id' | 'createdAt'>[] = [
  {
    thesisId: '',
    fromPaperId: '', // AlphaFold original
    toPaperId: '',   // Fold-switching paper
    type: 'critiques',
    note: 'Shows a fundamental limitation of the AlphaFold approach',
    aiSuggested: false,
    aiConfidence: null,
    userApproved: true,
  },
  {
    thesisId: '',
    fromPaperId: '', // Binding sites paper
    toPaperId: '',   // AlphaFold original
    type: 'extends',
    note: 'Evaluates AlphaFold for a specific drug discovery application',
    aiSuggested: false,
    aiConfidence: null,
    userApproved: true,
  },
  {
    thesisId: '',
    fromPaperId: '', // IDR paper
    toPaperId: '',   // Fold-switching paper
    type: 'supports',
    note: 'Both papers highlight conformational flexibility as a limitation',
    aiSuggested: true,
    aiConfidence: 0.85,
    userApproved: true,
  },
  {
    thesisId: '',
    fromPaperId: '', // Review
    toPaperId: '',   // Binding sites paper
    type: 'reviews',
    note: 'Review discusses these binding site findings',
    aiSuggested: false,
    aiConfidence: null,
    userApproved: true,
  },
];

// Function to load sample data into the store
export function loadSampleData(
  createThesis: (thesis: typeof sampleThesis) => { id: string },
  addPaper: (paper: Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'>) => { id: string },
  createConnection: (connection: Omit<Connection, 'id' | 'createdAt'>) => void
) {
  // Create thesis
  const thesis = createThesis(sampleThesis);

  // Create papers
  const paperIds: string[] = [];
  for (const paperData of samplePapers) {
    const paper = addPaper({ ...paperData, thesisId: thesis.id });
    paperIds.push(paper.id);
  }

  // Create connections with correct paper IDs
  // Connection 0: Paper 0 (AlphaFold) <- Paper 1 (Fold-switching) critiques
  createConnection({
    ...sampleConnections[0],
    thesisId: thesis.id,
    fromPaperId: paperIds[1],
    toPaperId: paperIds[0],
  });

  // Connection 1: Paper 2 (Binding sites) extends Paper 0 (AlphaFold)
  createConnection({
    ...sampleConnections[1],
    thesisId: thesis.id,
    fromPaperId: paperIds[2],
    toPaperId: paperIds[0],
  });

  // Connection 2: Paper 4 (IDR) supports Paper 1 (Fold-switching)
  createConnection({
    ...sampleConnections[2],
    thesisId: thesis.id,
    fromPaperId: paperIds[4],
    toPaperId: paperIds[1],
  });

  // Connection 3: Paper 3 (Review) reviews Paper 2 (Binding sites)
  createConnection({
    ...sampleConnections[3],
    thesisId: thesis.id,
    fromPaperId: paperIds[3],
    toPaperId: paperIds[2],
  });

  return thesis.id;
}
