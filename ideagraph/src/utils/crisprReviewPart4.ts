// ============================================================================
// CRISPR REVIEW SAMPLE DATA - PART 4: Future Directions, Connections, Themes, Gaps & Clusters
// ============================================================================

import type { Paper, Connection, SynthesisTheme, ResearchGap, EvidenceSynthesis, ReviewSection, PaperCluster, Argument, Evidence } from '../types';

const generateId = () => crypto.randomUUID();

const arg = (claim: string, strength: Argument['strength'], assessment: Argument['yourAssessment']): Argument => ({
  id: generateId(),
  claim,
  strength,
  yourAssessment: assessment,
});

const ev = (description: string, type: Evidence['type']): Evidence => ({
  id: generateId(),
  description,
  type,
  linkedArgumentId: null,
});

// ============================================================================
// PAPERS PART 4: FUTURE DIRECTIONS & RECENT ADVANCES (Papers 46-55)
// ============================================================================

export const crisprPapersPart4: Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'>[] = [
  // -------------------------------------------------------------------------
  // Paper 46: Nobel Prize Announcement (2020)
  // User thought: "Historical milestone - recognition of the field"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/d41586-020-02765-9',
    title: 'The CRISPR pioneers who won the chemistry Nobel',
    authors: [
      { name: 'Heidi Ledford' },
      { name: 'Ewen Callaway' },
    ],
    year: 2020,
    journal: 'Nature',
    volume: '586',
    issue: '7829',
    pages: '346-347',
    abstract: 'Emmanuelle Charpentier and Jennifer Doudna win Nobel Prize in Chemistry for CRISPR-Cas9 genome editing.',
    url: 'https://doi.org/10.1038/d41586-020-02765-9',
    pdfUrl: null,
    citationCount: 95,
    takeaway: 'Nobel recognition for Doudna and Charpentier validates CRISPR as one of the most important scientific discoveries of the century.',
    arguments: [
      arg('CRISPR-Cas9 is recognized as a revolutionary technology', 'strong', 'agree'),
      arg('The award highlights basic science leading to applications', 'strong', 'agree'),
      arg('Controversy remains over who else deserved credit', 'moderate', 'uncertain'),
    ],
    evidence: [
      ev('2020 Nobel Prize in Chemistry awarded', 'other'),
      ev('First all-women chemistry Nobel team', 'other'),
    ],
    assessment: 'Milestone for the field. Debate continues about contributions of Mojica, Zhang, and others.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['nobel-prize', 'history', 'recognition', 'milestone'],
    readAt: '2024-02-22T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-22T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 47: CRISPRoff - Epigenetic Silencing (Nunez 2021)
  // User thought: "Heritable silencing without editing sequence - elegant"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1016/j.cell.2021.03.025',
    title: 'Genome-wide programmable transcriptional memory by CRISPR-based epigenome editing',
    authors: [
      { name: 'James K. Nuñez' },
      { name: 'Jin Chen' },
      { name: 'Greg C. Pommier' },
      { name: 'J. Zachery Cogan' },
      { name: 'Joseph M. Replogle' },
      { name: 'Jonathan S. Weissman' },
    ],
    year: 2021,
    journal: 'Cell',
    volume: '184',
    issue: '9',
    pages: '2503-2519',
    abstract: 'CRISPRoff creates heritable gene silencing through DNA methylation without sequence changes.',
    url: 'https://doi.org/10.1016/j.cell.2021.03.025',
    pdfUrl: null,
    citationCount: 380,
    takeaway: 'CRISPRoff enables heritable gene silencing via targeted methylation - no DSBs, no sequence changes, reversible with CRISPRon.',
    arguments: [
      arg('Targeted DNA methylation can silence genes heritably', 'strong', 'agree'),
      arg('Silencing persists through cell division without continued expression', 'strong', 'agree'),
      arg('CRISPRon can reverse CRISPRoff silencing', 'strong', 'agree'),
    ],
    evidence: [
      ev('Gene silencing maintained >50 generations', 'experimental'),
      ev('Works at CpG islands and non-CpG promoters', 'experimental'),
      ev('No detectable off-target methylation changes', 'experimental'),
    ],
    assessment: 'Elegant solution avoiding DNA damage concerns. Potential for reversible therapeutics.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['epigenome', 'crisproff', 'methylation', 'heritable', 'reversible'],
    readAt: '2024-02-23T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-23T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 48: PASTE - Large DNA Insertion (Yarnall 2022)
  // User thought: "Finally efficient large insertions - major advance"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/s41587-022-01527-4',
    title: 'Programmable gene insertion with CRISPR-Cas9 integrases',
    authors: [
      { name: 'Matthew T. N. Yarnall' },
      { name: 'Eleonora I. Ioannidi' },
      { name: 'Cian Schmitt-Ulms' },
      { name: 'Rohan N. Krajeski' },
      { name: 'Justin Lim' },
      { name: 'Omar O. Abudayyeh' },
      { name: 'Jonathan S. Gootenberg' },
    ],
    year: 2022,
    journal: 'Nature Biotechnology',
    volume: '41',
    issue: '3',
    pages: '500-512',
    abstract: 'PASTE enables efficient insertion of large DNA sequences (>5 kb) without double-strand breaks.',
    url: 'https://doi.org/10.1038/s41587-022-01527-4',
    pdfUrl: null,
    citationCount: 180,
    takeaway: 'PASTE (Programmable Addition via Site-specific Targeting Elements) enables large gene insertions up to 36 kb without DSBs.',
    arguments: [
      arg('Serine integrases can insert large DNA at specific sites', 'strong', 'agree'),
      arg('Prime editing + integrase enables programmable insertion', 'strong', 'agree'),
      arg('Avoids DSB-associated risks', 'strong', 'agree'),
    ],
    evidence: [
      ev('Up to 36 kb insertions achieved', 'experimental'),
      ev('~10-50% integration efficiency depending on cargo size', 'experimental'),
      ev('Works in human cells and mouse liver', 'experimental'),
    ],
    assessment: 'Addresses a major limitation of base/prime editing (size). Potential for gene replacement therapy.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['paste', 'large-insertion', 'integrase', 'no-dsb'],
    readAt: '2024-02-24T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-24T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 49: Brain Delivery Advances (Villiger 2023)
  // User thought: "CNS is the hardest target - progress is critical"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/s41593-022-01236-w',
    title: 'In vivo base editing of a disease-causing mutation in adult primate brain',
    authors: [
      { name: 'Lukas Villiger' },
      { name: 'Hiu Man Grisch-Chan' },
      { name: 'Helen Lindsay' },
      { name: 'Florian Rinber' },
      { name: 'Beat Thöny' },
      { name: 'Gerald Schwank' },
    ],
    year: 2023,
    journal: 'Nature Neuroscience',
    volume: '26',
    issue: '4',
    pages: '593-603',
    abstract: 'AAV-delivered base editor corrects a disease-causing mutation in adult primate brain with high efficiency.',
    url: 'https://doi.org/10.1038/s41593-022-01236-w',
    pdfUrl: null,
    citationCount: 85,
    takeaway: 'Brain base editing in primates achieves up to 59% editing efficiency - breakthrough for neurological disease treatment.',
    arguments: [
      arg('AAV9 can deliver base editors to CNS in primates', 'strong', 'agree'),
      arg('Editing efficiency sufficient for therapeutic effect', 'moderate', 'agree'),
      arg('Long-term safety in brain still needs evaluation', 'moderate', 'agree'),
    ],
    evidence: [
      ev('59% A-to-G editing in spinal motor neurons', 'experimental'),
      ev('Sustained editing at 6 months post-treatment', 'experimental'),
      ev('No significant off-target editing detected', 'experimental'),
    ],
    assessment: 'Major advance for neurological diseases. Primate data essential for clinical translation.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['brain', 'cns', 'base-editing', 'primate', 'delivery'],
    readAt: '2024-02-25T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-25T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 50: Cas9 Variants Comparison (Kim 2020 - Review)
  // User thought: "Good overview of all the variants - useful for methods section"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/s41576-020-0212-x',
    title: 'High-fidelity CRISPR-Cas9 variants for precise genome editing',
    authors: [
      { name: 'Daesik Kim' },
      { name: 'Jin-Soo Kim' },
    ],
    year: 2020,
    journal: 'Nature Reviews Genetics',
    volume: '21',
    issue: '2',
    pages: '115-128',
    abstract: 'Review comparing high-fidelity Cas9 variants and their mechanisms of improved specificity.',
    url: 'https://doi.org/10.1038/s41576-020-0212-x',
    pdfUrl: null,
    citationCount: 580,
    takeaway: 'Comprehensive comparison of high-fidelity Cas9 variants (HF1, eSpCas9, HypaCas9, etc.) - choice depends on target and context.',
    arguments: [
      arg('Different HF variants use different specificity mechanisms', 'strong', 'agree'),
      arg('No single variant is best for all targets', 'strong', 'agree'),
      arg('Trade-offs exist between specificity and activity', 'moderate', 'agree'),
    ],
    evidence: [
      ev('Side-by-side comparison at matched loci', 'meta-analysis'),
      ev('Structure-function analysis of mutations', 'theoretical'),
      ev('Guidelines for variant selection', 'other'),
    ],
    assessment: 'Excellent reference for choosing among HF variants. Practical guidance for users.',
    thesisRole: 'method',
    readingStatus: 'read',
    tags: ['high-fidelity', 'variants', 'comparison', 'review'],
    readAt: '2024-02-26T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-26T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 51: Type III CRISPR Systems (Kazlauskiene 2017)
  // User thought: "Alternative CRISPR types - expanding the toolkit"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.aao0100',
    title: 'A cyclic oligonucleotide signaling pathway in type III CRISPR-Cas systems',
    authors: [
      { name: 'Migle Kazlauskiene' },
      { name: 'Georgij Kostiuk' },
      { name: 'Chi Veng' },
      { name: 'Gintautas Tamulaitis' },
      { name: 'Virginijus Siksnys' },
    ],
    year: 2017,
    journal: 'Science',
    volume: '357',
    issue: '6351',
    pages: '605-609',
    abstract: 'Type III CRISPR systems use cyclic oligonucleotide second messengers for immune signaling.',
    url: 'https://doi.org/10.1126/science.aao0100',
    pdfUrl: null,
    citationCount: 290,
    takeaway: 'Type III CRISPR systems use cOA signaling, potentially enabling new biotechnology applications beyond simple cutting.',
    arguments: [
      arg('Type III systems produce cyclic oligoadenylate signals', 'strong', 'agree'),
      arg('cOA activates ancillary nucleases for defense', 'strong', 'agree'),
      arg('Different from Type II mechanisms (Cas9)', 'strong', 'agree'),
    ],
    evidence: [
      ev('cOA production upon target RNA recognition', 'experimental'),
      ev('Structure of Csm6 RNase activated by cOA', 'experimental'),
      ev('Signaling enables amplified immune response', 'experimental'),
    ],
    assessment: 'Expands understanding of CRISPR diversity. Potential for novel applications.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['type-iii', 'signaling', 'coa', 'diversity'],
    readAt: '2024-02-27T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-27T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 52: FDA Guidance on Gene Editing (2022)
  // User thought: "Regulatory framework is critical for translation"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: null,
    title: 'Human Gene Therapy Products Incorporating Human Genome Editing - FDA Guidance',
    authors: [
      { name: 'U.S. Food and Drug Administration' },
    ],
    year: 2022,
    journal: 'FDA Guidance Document',
    volume: null,
    issue: null,
    pages: null,
    abstract: 'FDA guidance on chemistry, manufacturing, controls, and preclinical testing for genome editing products.',
    url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/human-gene-therapy-products-incorporating-human-genome-editing',
    pdfUrl: null,
    citationCount: 50,
    takeaway: 'FDA requires comprehensive off-target analysis, long-term follow-up, and manufacturing controls for genome editing therapies.',
    arguments: [
      arg('Genome-wide off-target assessment is required', 'strong', 'agree'),
      arg('Long-term follow-up (15 years for integrating vectors) is mandated', 'strong', 'agree'),
      arg('Specific controls needed for each editing modality', 'moderate', 'agree'),
    ],
    evidence: [
      ev('Guidance document with specific recommendations', 'other'),
      ev('Requirements for IND submissions', 'other'),
      ev('Addresses both ex vivo and in vivo products', 'other'),
    ],
    assessment: 'Essential reading for anyone translating CRISPR to clinic. Defines regulatory pathway.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['regulatory', 'fda', 'guidance', 'clinical-development'],
    readAt: '2024-02-28T10:00:00Z',
    source: 'url',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-28T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 53: Organoid Applications (Hendriks 2024)
  // User thought: "Emerging application - disease modeling"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/s41576-023-00683-0',
    title: 'CRISPR-Cas genome editing in human organoids',
    authors: [
      { name: 'Delilah Hendriks' },
      { name: 'Hans Clevers' },
    ],
    year: 2024,
    journal: 'Nature Reviews Genetics',
    volume: '25',
    issue: '1',
    pages: '50-66',
    abstract: 'Review of CRISPR applications in organoids for disease modeling and personalized medicine.',
    url: 'https://doi.org/10.1038/s41576-023-00683-0',
    pdfUrl: null,
    citationCount: 45,
    takeaway: 'CRISPR + organoids enables personalized disease modeling and drug testing - bridging bench and bedside.',
    arguments: [
      arg('Organoids recapitulate tissue architecture for relevant testing', 'strong', 'agree'),
      arg('CRISPR enables isogenic disease modeling', 'strong', 'agree'),
      arg('Patient-derived organoids can guide personalized therapy', 'moderate', 'agree'),
    ],
    evidence: [
      ev('Cystic fibrosis organoid drug testing guides patient treatment', 'other'),
      ev('Cancer organoids with specific mutations for drug screening', 'other'),
      ev('Isogenic pairs reveal gene function', 'other'),
    ],
    assessment: 'Exciting convergence of technologies. Personalized medicine becoming reality.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['organoids', 'disease-modeling', 'personalized-medicine', 'review'],
    readAt: '2024-03-01T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-03-01T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 54: Mitochondrial Genome Editing (Mok 2020)
  // User thought: "Last frontier - mitochondrial DNA editing"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/s41586-020-2477-4',
    title: 'A bacterial cytidine deaminase toxin enables CRISPR-free mitochondrial base editing',
    authors: [
      { name: 'Beverly Y. Mok' },
      { name: 'Marcos H. de Moraes' },
      { name: 'Jun Zeng' },
      { name: 'Dustin E. Bosch' },
      { name: 'Anna V. Kotrys' },
      { name: 'David R. Liu' },
    ],
    year: 2020,
    journal: 'Nature',
    volume: '583',
    issue: '7814',
    pages: '631-637',
    abstract: 'DdCBE enables C-to-T editing in mitochondrial DNA, opening new possibilities for treating mtDNA diseases.',
    url: 'https://doi.org/10.1038/s41586-020-2477-4',
    pdfUrl: null,
    citationCount: 420,
    takeaway: 'DdCBE enables mitochondrial base editing - first technology to precisely edit mtDNA, opening therapy for mitochondrial diseases.',
    arguments: [
      arg('DddA toxin from Burkholderia deaminates dsDNA', 'strong', 'agree'),
      arg('Split DddA halves reduce toxicity', 'strong', 'agree'),
      arg('Can edit mtDNA without CRISPR (no guide RNA)', 'strong', 'agree'),
    ],
    evidence: [
      ev('C-to-T editing in mtDNA at various positions', 'experimental'),
      ev('Works in human cells and mouse models', 'experimental'),
      ev('Potential for treating MELAS and LHON', 'experimental'),
    ],
    assessment: 'Breakthrough for mitochondrial medicine. Addresses previously "undruggable" target.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['mitochondria', 'mtdna', 'base-editing', 'ddcbe', 'breakthrough'],
    readAt: '2024-03-02T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-03-02T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 55: Future Perspectives (Doudna 2020)
  // User thought: "Field overview from the pioneer herself"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/s41586-020-2782-6',
    title: 'The promise and challenge of therapeutic genome editing',
    authors: [
      { name: 'Jennifer A. Doudna' },
    ],
    year: 2020,
    journal: 'Nature',
    volume: '578',
    issue: '7794',
    pages: '229-236',
    abstract: 'Perspective on the current state and future directions of therapeutic genome editing.',
    url: 'https://doi.org/10.1038/s41586-020-2782-6',
    pdfUrl: null,
    citationCount: 750,
    takeaway: 'Doudna\'s perspective: CRISPR therapeutics will transform medicine, but delivery, safety, and ethics require continued attention.',
    arguments: [
      arg('Delivery remains the biggest challenge for therapeutics', 'strong', 'agree'),
      arg('Non-DSB editing approaches are preferred for safety', 'strong', 'agree'),
      arg('Ethical frameworks must evolve with technology', 'strong', 'agree'),
    ],
    evidence: [
      ev('Overview of clinical trials in progress', 'other'),
      ev('Analysis of remaining technical challenges', 'theoretical'),
      ev('Discussion of ethical considerations', 'theoretical'),
    ],
    assessment: 'Authoritative overview from field pioneer. Essential for framing the review\'s conclusion.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['perspective', 'doudna', 'future-directions', 'therapeutics'],
    readAt: '2024-03-03T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-03-03T09:00:00Z',
    semanticScholarId: null,
  },
];

export const PART4_PAPER_COUNT = crisprPapersPart4.length; // 10 papers

// ============================================================================
// CONNECTIONS - Comprehensive Relationships Between Papers (80+ connections)
// ============================================================================
// Note: indices refer to combined paper array (0-54)
// Paper Index Reference:
// Part 1 (0-14): Discovery & Mechanism
//   0: Ishino 1987, 1: Jansen 2002, 2: Mojica 2005, 3: Barrangou 2007
//   4: Deltcheva 2011, 5: Jinek 2012, 6: Jinek Structure 2014
//   7: Cong 2013, 8: Mali 2013, 9: PAM variants 2015, 10: SpCas9-HF1 2016
//   11: eSpCas9 2016, 12: Cas12a 2015, 13: Base editing 2016, 14: Prime editing 2019
// Part 2 (15-29): Applications & Delivery
//   15: TTR trial 2021, 16: Sickle cell 2021, 17: CAR-T 2017, 18: DMD 2018
//   19: LNP delivery 2018, 20: SaCas9 2015, 21: Gene drive 2016, 22: Ag review 2021
//   23: SHERLOCK 2017, 24: DETECTR 2018, 25: CRISPR screens 2014, 26: CRISPRi/a 2014
//   27: Epigenome editing 2015, 28: RNA editing 2017, 29: In utero 2018
// Part 3 (30-44): Limitations & Ethics
//   30: GUIDE-seq 2015, 31: CIRCLE-seq 2017, 32: Large deletions 2018
//   33: p53 activation 2018, 34: Immunogenicity 2019, 35: Delivery review 2017
//   36: Chromothripsis 2021, 37: He Jiankui 2019, 38: Int'l Commission 2020
//   39: Equity (Baylis) 2019, 40: Mosaicism 2019, 41: BE off-targets 2019
//   42: PE optimization 2021, 43: Anti-CRISPR 2013, 44: Patents 2017
// Part 4 (45-54): Future Directions
//   45: Nobel 2020, 46: CRISPRoff 2021, 47: PASTE 2022, 48: Brain editing 2023
//   49: HF variants review 2020, 50: Type III 2017, 51: FDA guidance 2022
//   52: Organoids 2024, 53: Mitochondrial 2020, 54: Doudna perspective 2020

export const crisprConnections: Omit<Connection, 'id' | 'createdAt'>[] = [
  // ========== DISCOVERY LINEAGE (Historical chain) ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Named the CRISPR repeats first observed by Ishino', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Proposed immune function for CRISPR spacers', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Experimentally proved adaptive immunity hypothesis', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Discovered tracrRNA essential for Type II systems', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Created programmable sgRNA from tracrRNA discovery', aiSuggested: false, aiConfidence: null, userApproved: true },

  // ========== JINEK 2012 → MAMMALIAN APPLICATIONS ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'First mammalian genome editing with Cas9', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Parallel demonstration in human cells', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Structural basis for Cas9 mechanism', aiSuggested: false, aiConfidence: null, userApproved: true },

  // ========== ENGINEERING DEVELOPMENTS ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Engineered PAM variants for broader targeting', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'High-fidelity variant reduces off-targets', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Alternative HF engineering approach', aiSuggested: true, aiConfidence: 0.88, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Cas12a offers different PAM and cut pattern', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Smaller Cas9 for AAV delivery', aiSuggested: false, aiConfidence: null, userApproved: true },

  // ========== PRECISION EDITING (Base → Prime) ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Base editing avoids DSBs using deaminase', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Prime editing extends beyond point mutations', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'PE optimization improves efficiency', aiSuggested: false, aiConfidence: null, userApproved: true },

  // ========== CLINICAL TRANSLATION ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'First in vivo CRISPR therapy in humans', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Ex vivo HSC editing for sickle cell', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'CRISPR-enhanced CAR-T therapy', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Muscle editing for DMD', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'uses-method', note: 'TTR trial uses LNP delivery', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'uses-method', note: 'DMD uses AAV delivery', aiSuggested: false, aiConfidence: null, userApproved: true },

  // ========== DELIVERY METHODS ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'LNP enables efficient liver delivery', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'SaCas9 fits in single AAV', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'reviews', note: 'Delivery barriers overview', aiSuggested: false, aiConfidence: null, userApproved: true },

  // ========== DIAGNOSTIC APPLICATIONS ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Cas13 collateral cleavage for detection', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Cas12a-based DNA detection', aiSuggested: true, aiConfidence: 0.92, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'same-topic', note: 'Complementary diagnostic platforms', aiSuggested: true, aiConfidence: 0.85, userApproved: true },

  // ========== FUNCTIONAL GENOMICS ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Genome-wide knockout screens', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'CRISPRi/a for reversible regulation', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Epigenome editing with dCas9', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'RNA editing with Cas13', aiSuggested: false, aiConfidence: null, userApproved: true },

  // ========== OFF-TARGET DETECTION METHODS ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'GUIDE-seq for unbiased off-target detection', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'CIRCLE-seq improves sensitivity', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'uses-method', note: 'HF1 validated with GUIDE-seq', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'uses-method', note: 'eSpCas9 validated with GUIDE-seq', aiSuggested: false, aiConfidence: null, userApproved: true },

  // ========== SAFETY CONCERNS ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'critiques', note: 'Large deletions at on-target sites', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'supports', note: 'p53 activation by DSBs', aiSuggested: true, aiConfidence: 0.9, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'supports', note: 'Chromothripsis reinforces DSB concerns', aiSuggested: true, aiConfidence: 0.88, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'critiques', note: 'Pre-existing immunity barriers', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'critiques', note: 'Base editing has off-target SNVs', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'supports', note: 'Mosaicism complicates outcomes', aiSuggested: false, aiConfidence: null, userApproved: true },

  // ========== SAFETY → PRECISION EDITING MOTIVATION ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'supports', note: 'DSB risks motivate base editing', aiSuggested: true, aiConfidence: 0.85, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'supports', note: 'DSB risks motivate prime editing', aiSuggested: true, aiConfidence: 0.85, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'supports', note: 'Large deletions favor non-DSB approaches', aiSuggested: true, aiConfidence: 0.82, userApproved: true },

  // ========== ETHICS & GOVERNANCE ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'International response to germline editing', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Equity concerns for access', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'supports', note: 'Regulatory framework addresses safety', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'supports', note: 'Patents affect accessibility', aiSuggested: false, aiConfidence: null, userApproved: true },

  // ========== FUTURE DIRECTIONS ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'CRISPRoff for epigenetic silencing', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'PASTE for large insertions', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Brain delivery advances', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Mitochondrial base editing', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Organoid applications', aiSuggested: false, aiConfidence: null, userApproved: true },

  // ========== REVIEWS & PERSPECTIVES ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'reviews', note: 'HF variants comparison', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'reviews', note: 'Agricultural applications overview', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'reviews', note: 'Doudna perspective on future', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'reviews', note: 'Nobel recognizes Jinek work', aiSuggested: false, aiConfidence: null, userApproved: true },

  // ========== CROSS-CLUSTER CONNECTIONS ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'same-topic', note: 'Both address delivery challenges', aiSuggested: true, aiConfidence: 0.78, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'same-topic', note: 'Both engineered for specificity', aiSuggested: true, aiConfidence: 0.82, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'same-topic', note: 'Both clinical milestones', aiSuggested: true, aiConfidence: 0.9, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'same-topic', note: 'Both address safety concerns', aiSuggested: true, aiConfidence: 0.85, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'uses-method', note: 'Clinical trials use HF variants', aiSuggested: true, aiConfidence: 0.75, userApproved: true },

  // ========== SPECIAL APPLICATIONS ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Gene drive for disease vectors', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Prenatal gene editing', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Anti-CRISPR for control', aiSuggested: false, aiConfidence: null, userApproved: true },

  // ========== INTELLECTUAL LINEAGE (Additional) ==========
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'extends', note: 'Nobel recognizes discovery chain', aiSuggested: false, aiConfidence: null, userApproved: true },
  { thesisId: '', fromPaperId: '', toPaperId: '', type: 'supports', note: 'Type III shows CRISPR diversity', aiSuggested: false, aiConfidence: null, userApproved: true },
];

// Connection mappings (paper indices in combined array) - 80+ connections
export const connectionMappings = [
  // Discovery lineage (0-4)
  { from: 1, to: 0 },   // Jansen -> Ishino
  { from: 2, to: 1 },   // Mojica -> Jansen
  { from: 3, to: 2 },   // Barrangou -> Mojica
  { from: 4, to: 3 },   // Deltcheva -> Barrangou
  { from: 5, to: 4 },   // Jinek -> Deltcheva

  // Jinek → Applications (5-7)
  { from: 7, to: 5 },   // Cong -> Jinek
  { from: 8, to: 5 },   // Mali -> Jinek
  { from: 6, to: 5 },   // Jinek structure -> Jinek

  // Engineering (8-12)
  { from: 9, to: 7 },   // PAM variants -> Cong
  { from: 10, to: 7 },  // HF1 -> Cong
  { from: 11, to: 10 }, // eSpCas9 -> HF1
  { from: 12, to: 5 },  // Cas12a -> Jinek
  { from: 20, to: 7 },  // SaCas9 -> Cong

  // Precision editing (13-15)
  { from: 13, to: 7 },  // Base editing -> Cong
  { from: 14, to: 13 }, // Prime editing -> Base editing
  { from: 42, to: 14 }, // PE optimization -> Prime editing

  // Clinical (16-21)
  { from: 15, to: 7 },  // TTR trial -> Cong
  { from: 16, to: 7 },  // Sickle cell -> Cong
  { from: 17, to: 7 },  // CAR-T -> Cong
  { from: 18, to: 7 },  // DMD -> Cong
  { from: 15, to: 19 }, // TTR trial uses LNP
  { from: 18, to: 20 }, // DMD uses AAV/SaCas9

  // Delivery (22-24)
  { from: 19, to: 7 },  // LNP -> Cong
  { from: 20, to: 5 },  // SaCas9 -> Jinek
  { from: 35, to: 19 }, // Delivery review -> LNP

  // Diagnostics (25-27)
  { from: 23, to: 12 }, // SHERLOCK -> Cas12a (via Cas13 from same family)
  { from: 24, to: 12 }, // DETECTR -> Cas12a
  { from: 24, to: 23 }, // DETECTR same-topic SHERLOCK

  // Functional genomics (28-31)
  { from: 25, to: 7 },  // Screens -> Cong
  { from: 26, to: 7 },  // CRISPRi/a -> Cong
  { from: 27, to: 26 }, // Epigenome -> CRISPRi/a
  { from: 28, to: 23 }, // RNA editing -> SHERLOCK (Cas13)

  // Off-target detection (32-35)
  { from: 30, to: 7 },  // GUIDE-seq -> Cong
  { from: 31, to: 30 }, // CIRCLE-seq -> GUIDE-seq
  { from: 10, to: 30 }, // HF1 uses GUIDE-seq
  { from: 11, to: 30 }, // eSpCas9 uses GUIDE-seq

  // Safety concerns (36-41)
  { from: 32, to: 7 },  // Large deletions critiques Cong
  { from: 33, to: 32 }, // p53 supports large deletions
  { from: 36, to: 32 }, // Chromothripsis supports large deletions
  { from: 34, to: 20 }, // Immunogenicity critiques SaCas9
  { from: 41, to: 13 }, // BE off-targets critiques base editing
  { from: 40, to: 7 },  // Mosaicism supports concerns

  // Safety → Precision motivation (42-44)
  { from: 32, to: 13 }, // Large deletions motivate base editing
  { from: 32, to: 14 }, // Large deletions motivate prime editing
  { from: 36, to: 14 }, // Chromothripsis favors prime editing

  // Ethics (45-48)
  { from: 38, to: 37 }, // Commission -> He Jiankui
  { from: 39, to: 38 }, // Equity -> Commission
  { from: 51, to: 30 }, // FDA guidance addresses off-targets
  { from: 44, to: 5 },  // Patents -> Jinek

  // Future directions (49-53)
  { from: 46, to: 27 }, // CRISPRoff -> Epigenome
  { from: 47, to: 14 }, // PASTE -> Prime editing
  { from: 48, to: 13 }, // Brain editing -> Base editing
  { from: 53, to: 13 }, // Mitochondrial -> Base editing
  { from: 52, to: 25 }, // Organoids -> Screens

  // Reviews (54-57)
  { from: 49, to: 10 }, // HF review -> HF1
  { from: 22, to: 7 },  // Ag review -> Cong
  { from: 54, to: 5 },  // Doudna perspective -> Jinek
  { from: 45, to: 5 },  // Nobel -> Jinek

  // Cross-cluster (58-62)
  { from: 19, to: 20 }, // LNP same-topic SaCas9 (delivery)
  { from: 10, to: 11 }, // HF1 same-topic eSpCas9
  { from: 15, to: 16 }, // TTR same-topic Sickle cell
  { from: 32, to: 33 }, // Large deletions same-topic p53
  { from: 16, to: 10 }, // Sickle cell uses HF variants

  // Special applications (63-65)
  { from: 21, to: 7 },  // Gene drive -> Cong
  { from: 29, to: 7 },  // In utero -> Cong
  { from: 43, to: 3 },  // Anti-CRISPR -> Barrangou

  // Additional lineage (66-67)
  { from: 45, to: 2 },  // Nobel recognizes Mojica
  { from: 50, to: 3 },  // Type III -> Barrangou
];

// ============================================================================
// SYNTHESIS THEMES - Organizing Ideas Across Papers
// ============================================================================

export const crisprThemes: Omit<SynthesisTheme, 'id' | 'createdAt'>[] = [
  {
    thesisId: '',
    name: 'Discovery & Historical Development',
    description: 'The intellectual journey from observing repeats to understanding adaptive immunity',
    color: '#6366f1', // Indigo
    paperIds: [], // 0-5 (Ishino through Jinek)
    relatedArgumentIds: [],
  },
  {
    thesisId: '',
    name: 'Specificity Engineering',
    description: 'Efforts to reduce off-target effects through protein engineering and guide design',
    color: '#22c55e', // Green
    paperIds: [], // 10, 11, 31, 32, 49
    relatedArgumentIds: [],
  },
  {
    thesisId: '',
    name: 'Beyond DSBs: Base & Prime Editing',
    description: 'Precision editing without double-strand breaks',
    color: '#8b5cf6', // Purple
    paperIds: [], // 13, 14, 42, 43, 47
    relatedArgumentIds: [],
  },
  {
    thesisId: '',
    name: 'Delivery Challenges',
    description: 'Getting CRISPR into cells and tissues',
    color: '#f59e0b', // Amber
    paperIds: [], // 19, 20, 21, 35, 48
    relatedArgumentIds: [],
  },
  {
    thesisId: '',
    name: 'Clinical Translation',
    description: 'Moving from lab to patients',
    color: '#ef4444', // Red
    paperIds: [], // 15, 16, 17, 18, 51
    relatedArgumentIds: [],
  },
  {
    thesisId: '',
    name: 'Safety Concerns',
    description: 'DSB-associated risks, off-targets, and immunogenicity',
    color: '#f43f5e', // Rose
    paperIds: [], // 32, 33, 34, 36, 41
    relatedArgumentIds: [],
  },
  {
    thesisId: '',
    name: 'Ethics & Governance',
    description: 'Responsible development and use of genome editing',
    color: '#64748b', // Slate
    paperIds: [], // 37, 38, 39, 44
    relatedArgumentIds: [],
  },
  {
    thesisId: '',
    name: 'Diagnostic Applications',
    description: 'Using CRISPR for detection, not editing',
    color: '#06b6d4', // Cyan
    paperIds: [], // 23, 24
    relatedArgumentIds: [],
  },
];

// Theme paper mappings (indices in combined paper array)
export const themePaperMappings = [
  [0, 1, 2, 3, 4, 5],          // Discovery
  [10, 11, 30, 31, 49],         // Specificity
  [13, 14, 42, 43, 47],         // Base/Prime
  [19, 20, 21, 35, 48],         // Delivery
  [15, 16, 17, 18, 51],         // Clinical
  [32, 33, 34, 36, 41],         // Safety
  [37, 38, 39, 44],             // Ethics
  [23, 24],                      // Diagnostics
];

// ============================================================================
// RESEARCH GAPS - What's Missing in the Literature
// ============================================================================

export const crisprGaps: Omit<ResearchGap, 'id' | 'createdAt'>[] = [
  {
    thesisId: '',
    title: 'Long-term safety of base/prime editing',
    description: 'Most safety studies are short-term (<1 year). Long-term consequences of non-DSB editing unknown.',
    type: 'temporal',
    priority: 'high',
    evidenceSource: 'user',
    relatedPaperIds: [], // 13, 14, 41
    futureResearchNote: 'Need 5-10 year follow-up studies in animal models before widespread clinical use',
  },
  {
    thesisId: '',
    title: 'Extrahepatic delivery solutions',
    description: 'Liver delivery is solved; brain, muscle, lung remain major challenges.',
    type: 'methodological',
    priority: 'high',
    evidenceSource: 'user',
    relatedPaperIds: [], // 35, 48
    futureResearchNote: 'Develop tissue-specific LNP formulations and AAV capsids',
  },
  {
    thesisId: '',
    title: 'Population-level immunogenicity data',
    description: 'Pre-existing immunity studied in small cohorts. Large population studies needed.',
    type: 'population',
    priority: 'medium',
    evidenceSource: 'user',
    relatedPaperIds: [], // 34
    futureResearchNote: 'Seroprevalence studies across diverse populations and age groups',
  },
  {
    thesisId: '',
    title: 'Cost-effectiveness and accessibility models',
    description: 'Economic analyses of CRISPR therapeutics lacking. How to make affordable?',
    type: 'knowledge',
    priority: 'high',
    evidenceSource: 'user',
    relatedPaperIds: [], // 16, 39
    futureResearchNote: 'Health economics modeling for global access strategies',
  },
  {
    thesisId: '',
    title: 'Theoretical framework for editing specificity',
    description: 'Empirical studies abound but unified theory of Cas9 specificity determinants lacking.',
    type: 'theoretical',
    priority: 'medium',
    evidenceSource: 'inferred',
    relatedPaperIds: [], // 10, 11, 49
    futureResearchNote: 'Computational models integrating structure, kinetics, and thermodynamics',
  },
  {
    thesisId: '',
    title: 'Non-Western population genetic considerations',
    description: 'Most editing targets based on European population genetics. Other populations understudied.',
    type: 'geographic',
    priority: 'medium',
    evidenceSource: 'user',
    relatedPaperIds: [], // 39
    futureResearchNote: 'Expand genomic databases and clinical trials to diverse populations',
  },
  {
    thesisId: '',
    title: 'Resolution of DSB vs non-DSB safety debate',
    description: 'Some argue DSB risks are manageable; others say fundamental problem. Need direct comparison.',
    type: 'contradictory',
    priority: 'high',
    evidenceSource: 'inferred',
    relatedPaperIds: [], // 32, 36, 13, 14
    futureResearchNote: 'Head-to-head safety comparison in matched therapeutic contexts',
  },
];

// Gap paper mappings
export const gapPaperMappings = [
  [13, 14, 41],    // Long-term safety
  [35, 48],        // Delivery
  [34],            // Immunogenicity
  [16, 39],        // Accessibility
  [10, 11, 49],    // Specificity theory
  [39],            // Population diversity
  [32, 36, 13, 14], // DSB debate
];

// ============================================================================
// EVIDENCE SYNTHESES - Cross-Paper Claims
// ============================================================================

export const crisprEvidenceSyntheses: Omit<EvidenceSynthesis, 'id' | 'createdAt'>[] = [
  {
    thesisId: '',
    claim: 'High-fidelity Cas9 variants substantially reduce off-target cleavage',
    supportingPaperIds: [], // 10, 11, 49
    contradictingPaperIds: [],
    evidenceStrength: 'strong',
    consensusNote: 'Broad consensus from multiple independent studies and methods',
  },
  {
    thesisId: '',
    claim: 'DSB-based editing carries inherent risks of large deletions and rearrangements',
    supportingPaperIds: [], // 32, 33, 36
    contradictingPaperIds: [],
    evidenceStrength: 'strong',
    consensusNote: 'Multiple studies demonstrate; risk magnitude debated',
  },
  {
    thesisId: '',
    claim: 'Base editing is safer than nuclease-based editing',
    supportingPaperIds: [], // 13, 14
    contradictingPaperIds: [], // 41
    evidenceStrength: 'moderate',
    consensusNote: 'Initial claims challenged by off-target SNV findings; improved variants help',
  },
  {
    thesisId: '',
    claim: 'LNP delivery is effective for liver targeting',
    supportingPaperIds: [], // 15, 19
    contradictingPaperIds: [],
    evidenceStrength: 'strong',
    consensusNote: 'Clinical trial data confirms efficacy',
  },
  {
    thesisId: '',
    claim: 'Pre-existing immunity to Cas9 is common in humans',
    supportingPaperIds: [], // 34
    contradictingPaperIds: [],
    evidenceStrength: 'moderate',
    consensusNote: 'Limited studies but consistent findings; clinical significance unclear',
  },
];

// Evidence synthesis mappings
export const evidenceSynthesisMappings = [
  { supporting: [10, 11, 49], contradicting: [] },
  { supporting: [32, 33, 36], contradicting: [] },
  { supporting: [13, 14], contradicting: [41] },
  { supporting: [15, 19], contradicting: [] },
  { supporting: [34], contradicting: [] },
];

// ============================================================================
// REVIEW SECTIONS - Literature Review Structure
// ============================================================================

export const crisprReviewSections: Omit<ReviewSection, 'id' | 'createdAt'>[] = [
  {
    thesisId: '',
    title: 'Introduction: From Bacterial Immunity to Biotechnology',
    description: 'Historical context and scope of the review',
    order: 1,
    paperIds: [], // 0-5, 45
  },
  {
    thesisId: '',
    title: 'Molecular Mechanism of CRISPR-Cas9',
    description: 'Structure, function, and specificity determinants',
    order: 2,
    paperIds: [], // 5, 6, 9, 12
  },
  {
    thesisId: '',
    title: 'Engineering for Improved Specificity',
    description: 'High-fidelity variants and PAM flexibility',
    order: 3,
    paperIds: [], // 9, 10, 11, 49
  },
  {
    thesisId: '',
    title: 'Beyond Cutting: Base, Prime, and Epigenome Editing',
    description: 'Precision editing without DSBs',
    order: 4,
    paperIds: [], // 13, 14, 27, 42, 46
  },
  {
    thesisId: '',
    title: 'Delivery Strategies',
    description: 'Viral and non-viral approaches for in vivo editing',
    order: 5,
    paperIds: [], // 19, 20, 35
  },
  {
    thesisId: '',
    title: 'Therapeutic Applications',
    description: 'Clinical trials and FDA-approved therapies',
    order: 6,
    paperIds: [], // 15, 16, 17, 18
  },
  {
    thesisId: '',
    title: 'Safety Considerations',
    description: 'Off-target effects, large deletions, and immunogenicity',
    order: 7,
    paperIds: [], // 30, 31, 32, 33, 34, 41
  },
  {
    thesisId: '',
    title: 'Ethical and Regulatory Framework',
    description: 'Governance, equity, and responsible innovation',
    order: 8,
    paperIds: [], // 37, 38, 39, 44, 51
  },
  {
    thesisId: '',
    title: 'Future Directions',
    description: 'Emerging technologies and remaining challenges',
    order: 9,
    paperIds: [], // 47, 48, 53, 54
  },
];

// Review section paper mappings
export const sectionPaperMappings = [
  [0, 1, 2, 3, 4, 5, 45],       // Intro
  [5, 6, 9, 12],                // Mechanism
  [9, 10, 11, 49],              // Engineering
  [13, 14, 27, 42, 46],         // Beyond cutting
  [19, 20, 35],                 // Delivery
  [15, 16, 17, 18],             // Therapeutics
  [30, 31, 32, 33, 34, 41],     // Safety
  [37, 38, 39, 44, 51],         // Ethics
  [47, 48, 53, 54],             // Future
];

// ============================================================================
// PAPER CLUSTERS - Visual Organization
// ============================================================================

export const crisprClusters: Omit<PaperCluster, 'id' | 'createdAt'>[] = [
  {
    thesisId: '',
    name: 'Discovery Era (2007-2012)',
    paperIds: [],
    color: '#6366f1', // Indigo
    isCollapsed: false,
  },
  {
    thesisId: '',
    name: 'Mammalian Applications (2013-2015)',
    paperIds: [],
    color: '#22c55e', // Green
    isCollapsed: false,
  },
  {
    thesisId: '',
    name: 'High-Fidelity Engineering',
    paperIds: [],
    color: '#8b5cf6', // Purple
    isCollapsed: false,
  },
  {
    thesisId: '',
    name: 'Precision Editing (Base/Prime)',
    paperIds: [],
    color: '#f59e0b', // Amber
    isCollapsed: false,
  },
  {
    thesisId: '',
    name: 'Clinical Translation',
    paperIds: [],
    color: '#ef4444', // Red
    isCollapsed: false,
  },
  {
    thesisId: '',
    name: 'Safety & Limitations',
    paperIds: [],
    color: '#f43f5e', // Rose
    isCollapsed: false,
  },
  {
    thesisId: '',
    name: 'Ethics & Governance',
    paperIds: [],
    color: '#64748b', // Slate
    isCollapsed: false,
  },
  {
    thesisId: '',
    name: 'Emerging Applications',
    paperIds: [],
    color: '#06b6d4', // Cyan
    isCollapsed: false,
  },
];

// Cluster paper mappings
export const clusterPaperMappings = [
  [0, 1, 2, 3, 4, 5],                     // Discovery
  [7, 8, 12, 20],                          // Mammalian
  [9, 10, 11, 30, 31],                     // High-fidelity
  [13, 14, 42, 43, 47, 53],                // Precision
  [15, 16, 17, 18, 19],                    // Clinical
  [32, 33, 34, 35, 36, 41],                // Safety
  [37, 38, 39, 44],                        // Ethics
  [21, 22, 23, 24, 25, 26, 27, 28, 29, 48, 52], // Emerging
];
