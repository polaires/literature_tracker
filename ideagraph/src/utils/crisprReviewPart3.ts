// ============================================================================
// CRISPR REVIEW SAMPLE DATA - PART 3: Limitations, Off-Targets & Ethics (Papers 31-45)
// ============================================================================
// User thought: "Now the critical analysis - what are the real problems?"

import type { Paper, Argument, Evidence } from '../types';

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
// PAPERS PART 3: LIMITATIONS, OFF-TARGETS & ETHICS (Papers 31-45)
// ============================================================================

export const crisprPapersPart3: Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'>[] = [
  // -------------------------------------------------------------------------
  // Paper 31: Off-Target Detection Methods (Tsai 2015 - GUIDE-seq)
  // User thought: "How do we even FIND off-targets? Methodology matters"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nbt.3117',
    title: 'GUIDE-seq enables genome-wide profiling of off-target cleavage by CRISPR-Cas nucleases',
    authors: [
      { name: 'Shengdar Q. Tsai' },
      { name: 'Zongli Zheng' },
      { name: 'Nhu T. Nguyen' },
      { name: 'Matthew Lieber' },
      { name: 'Ved V. Topkar' },
      { name: 'Vishal Thapar' },
      { name: 'J. Keith Joung' },
    ],
    year: 2015,
    journal: 'Nature Biotechnology',
    volume: '33',
    issue: '2',
    pages: '187-197',
    abstract: 'GUIDE-seq uses integration of short dsODNs at DSB sites for unbiased genome-wide off-target detection.',
    url: 'https://doi.org/10.1038/nbt.3117',
    pdfUrl: null,
    citationCount: 1900,
    takeaway: 'GUIDE-seq enables unbiased genome-wide off-target detection by tagging DSBs - reveals off-targets missed by prediction algorithms.',
    arguments: [
      arg('Computational prediction of off-targets is incomplete', 'strong', 'agree'),
      arg('dsODN integration marks DSB sites for sequencing', 'strong', 'agree'),
      arg('Many off-targets occur at sites with 5+ mismatches', 'strong', 'agree'),
    ],
    evidence: [
      ev('Identified off-targets missed by in silico methods', 'experimental'),
      ev('Some guides have >100 off-target sites', 'experimental'),
      ev('High-fidelity variants show reduced GUIDE-seq signal', 'experimental'),
    ],
    assessment: 'Gold standard method for off-target detection. Essential for therapeutic development.',
    thesisRole: 'method',
    readingStatus: 'read',
    tags: ['off-target', 'guide-seq', 'detection', 'methodology'],
    readAt: '2024-02-07T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-07T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 32: CIRCLE-seq (Tsai 2017)
  // User thought: "Alternative off-target method - compare sensitivity"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nmeth.4278',
    title: 'CIRCLE-seq: a highly sensitive in vitro screen for genome-wide CRISPR-Cas9 nuclease off-targets',
    authors: [
      { name: 'Shengdar Q. Tsai' },
      { name: 'Nhu T. Nguyen' },
      { name: 'Julie Malber' },
      { name: 'Ved V. Topkar' },
      { name: 'J. Keith Joung' },
    ],
    year: 2017,
    journal: 'Nature Methods',
    volume: '14',
    issue: '6',
    pages: '607-614',
    abstract: 'CIRCLE-seq circularizes genomic DNA to enrich for Cas9 cleavage sites with improved sensitivity over GUIDE-seq.',
    url: 'https://doi.org/10.1038/nmeth.4278',
    pdfUrl: null,
    citationCount: 680,
    takeaway: 'CIRCLE-seq provides higher sensitivity than GUIDE-seq for off-target detection, though requires more starting material.',
    arguments: [
      arg('In vitro circularization enriches cleavage sites more efficiently', 'strong', 'agree'),
      arg('Identifies more off-targets than GUIDE-seq at same depth', 'strong', 'agree'),
      arg('Some CIRCLE-seq sites may not be cleaved in cells', 'moderate', 'agree'),
    ],
    evidence: [
      ev('10-100x more off-targets detected than GUIDE-seq', 'experimental'),
      ev('Requires purified genomic DNA, not live cells', 'experimental'),
      ev('Validated by targeted amplicon sequencing', 'experimental'),
    ],
    assessment: 'More sensitive but less physiologically relevant. Useful for comprehensive off-target profiling.',
    thesisRole: 'method',
    readingStatus: 'read',
    tags: ['off-target', 'circle-seq', 'detection', 'in-vitro'],
    readAt: '2024-02-08T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-08T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 33: Large Deletions at On-Target Sites (Kosicki 2018)
  // User thought: "This is concerning - deletions at INTENDED sites?"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nbt.4192',
    title: 'Repair of double-strand breaks induced by CRISPR-Cas9 leads to large deletions and complex rearrangements',
    authors: [
      { name: 'Michael Kosicki' },
      { name: 'Kärt Tomberg' },
      { name: 'Allan Bradley' },
    ],
    year: 2018,
    journal: 'Nature Biotechnology',
    volume: '36',
    issue: '8',
    pages: '765-771',
    abstract: 'Long-range sequencing reveals frequent large deletions (>1 kb) and complex rearrangements at Cas9 on-target sites.',
    url: 'https://doi.org/10.1038/nbt.4192',
    pdfUrl: null,
    citationCount: 1100,
    takeaway: 'DSB repair frequently causes large deletions (kilobases) at on-target sites - a previously underappreciated safety concern.',
    arguments: [
      arg('Large deletions occur at significant frequency at cut sites', 'strong', 'agree'),
      arg('Standard short-read sequencing misses these events', 'strong', 'agree'),
      arg('Complex rearrangements including inversions occur', 'moderate', 'agree'),
    ],
    evidence: [
      ev('Deletions up to several kilobases detected at multiple loci', 'experimental'),
      ev('Long-range PCR and long-read sequencing required for detection', 'experimental'),
      ev('Observed in mouse embryos and human cells', 'experimental'),
    ],
    assessment: 'Important safety finding. Changed how the field thinks about "precise" editing. Favors base/prime editing approaches.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['safety', 'large-deletions', 'on-target', 'concerning'],
    readAt: '2024-02-09T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-09T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 34: p53 Activation by DSBs (Haapaniemi 2018)
  // User thought: "DSBs activate p53 - cancer risk implications"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/s41591-018-0049-z',
    title: 'CRISPR-Cas9 genome editing induces a p53-mediated DNA damage response',
    authors: [
      { name: 'Emma Haapaniemi' },
      { name: 'Sandeep Botla' },
      { name: 'Jenna Persson' },
      { name: 'Bernhard Schmierer' },
      { name: 'Jussi Taipale' },
    ],
    year: 2018,
    journal: 'Nature Medicine',
    volume: '24',
    issue: '7',
    pages: '927-930',
    abstract: 'CRISPR-induced DSBs trigger p53 activation, selecting for p53-deficient cells and raising cancer concerns.',
    url: 'https://doi.org/10.1038/s41591-018-0049-z',
    pdfUrl: null,
    citationCount: 950,
    takeaway: 'CRISPR DSBs activate p53, causing cell cycle arrest; this selects for p53-mutant cells, raising oncogenic concerns.',
    arguments: [
      arg('DSBs trigger p53-dependent cell cycle arrest', 'strong', 'agree'),
      arg('Successfully edited cells may be enriched for p53 mutations', 'moderate', 'agree'),
      arg('This is a fundamental issue with all nuclease approaches', 'strong', 'agree'),
    ],
    evidence: [
      ev('p53 target genes upregulated after Cas9 editing', 'experimental'),
      ev('Editing efficiency higher in p53-null cells', 'experimental'),
      ev('Selection for p53 mutants in edited cell populations', 'experimental'),
    ],
    assessment: 'Important safety concern. Supports moving toward non-DSB approaches (base/prime editing) for therapeutics.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['safety', 'p53', 'cancer-risk', 'dsb-concern'],
    readAt: '2024-02-10T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-10T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 35: Immune Response to Cas9 (Charlesworth 2019)
  // User thought: "Pre-existing immunity is a major delivery barrier"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/s41591-018-0326-x',
    title: 'Identification of preexisting adaptive immunity to Cas9 proteins in humans',
    authors: [
      { name: 'Carsten T. Charlesworth' },
      { name: 'Priyanka S. Deshpande' },
      { name: 'Daniel P. Dever' },
      { name: 'Joab Camarena' },
      { name: 'Viktor T. Lember' },
      { name: 'Matthew H. Porteus' },
    ],
    year: 2019,
    journal: 'Nature Medicine',
    volume: '25',
    issue: '2',
    pages: '249-254',
    abstract: 'Many humans have pre-existing antibodies and T cells against SpCas9 and SaCas9 due to prior Streptococcus and Staphylococcus exposure.',
    url: 'https://doi.org/10.1038/s41591-018-0326-x',
    pdfUrl: null,
    citationCount: 650,
    takeaway: 'Most humans have pre-existing immunity to Cas9 from common bacterial exposure - significant barrier for in vivo therapeutics.',
    arguments: [
      arg('Pre-existing antibodies to SpCas9 found in ~65% of donors', 'strong', 'agree'),
      arg('Anti-Cas9 T cells could attack edited cells in vivo', 'strong', 'agree'),
      arg('SaCas9 shows similar but slightly lower immunogenicity', 'moderate', 'agree'),
    ],
    evidence: [
      ev('65% of donors had anti-SpCas9 antibodies', 'experimental'),
      ev('46% had anti-SaCas9 antibodies', 'experimental'),
      ev('T cell responses detected by ELISpot', 'experimental'),
    ],
    assessment: 'Major barrier for in vivo CRISPR therapeutics. Supports ex vivo approaches or immunomodulation strategies.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['immunogenicity', 'cas9', 'barrier', 'pre-existing-immunity'],
    readAt: '2024-02-11T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-11T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 36: Delivery Barriers Review (Wang 2020)
  // User thought: "Comprehensive view of delivery challenges"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/s41578-020-0148-6',
    title: 'Non-viral delivery of genome-editing nucleases for gene therapy',
    authors: [
      { name: 'Hao Yin' },
      { name: 'Kellie A. Kauffman' },
      { name: 'Daniel G. Anderson' },
    ],
    year: 2017,
    journal: 'Nature Reviews Genetics',
    volume: '18',
    issue: '6',
    pages: '387-399',
    abstract: 'Review of non-viral delivery strategies for genome editing, including lipid nanoparticles, polymers, and physical methods.',
    url: 'https://doi.org/10.1038/nrg.2017.16',
    pdfUrl: null,
    citationCount: 1200,
    takeaway: 'Non-viral delivery overcomes immunogenicity of AAV but faces efficiency and tissue-targeting challenges.',
    arguments: [
      arg('LNPs are effective for liver but limited for other tissues', 'strong', 'agree'),
      arg('Physical methods (electroporation) work ex vivo but not in vivo', 'strong', 'agree'),
      arg('Polymer-based delivery is improving but not yet clinical-grade', 'moderate', 'agree'),
    ],
    evidence: [
      ev('LNPs achieve >90% transfection in hepatocytes', 'other'),
      ev('Extrahepatic delivery remains <20% efficiency', 'other'),
      ev('Electroporation enables >80% editing in HSCs ex vivo', 'other'),
    ],
    assessment: 'Good overview of delivery landscape. Liver is solved; other tissues remain major challenges.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['delivery', 'review', 'non-viral', 'barriers'],
    readAt: '2024-02-12T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-12T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 37: Chromothripsis from DSBs (Leibowitz 2021)
  // User thought: "This is scary - DSBs can cause chromosome shattering"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.abd0875',
    title: 'Chromothripsis as an on-target consequence of CRISPR-Cas9 genome editing',
    authors: [
      { name: 'Mitchell L. Leibowitz' },
      { name: 'Stamatis Papathanasiou' },
      { name: 'Phillip A. Doerfler' },
      { name: 'Logan J. Blaine' },
      { name: 'David Pellman' },
    ],
    year: 2021,
    journal: 'Science',
    volume: '372',
    issue: '6541',
    pages: 'eabd0875',
    abstract: 'CRISPR-induced DSBs can trigger chromothripsis, causing extensive chromosome rearrangements.',
    url: 'https://doi.org/10.1126/science.abd0875',
    pdfUrl: null,
    citationCount: 320,
    takeaway: 'DSBs from CRISPR can cause chromothripsis (chromosome shattering), leading to extensive rearrangements including oncogenic translocations.',
    arguments: [
      arg('DSB-induced micronuclei can undergo chromothripsis', 'strong', 'agree'),
      arg('This is an inherent risk of nuclease-based editing', 'strong', 'agree'),
      arg('Base and prime editing avoid this risk', 'strong', 'agree'),
    ],
    evidence: [
      ev('Chromothripsis detected in ~1% of edited cells at some loci', 'experimental'),
      ev('Complex rearrangements spanning entire chromosomes', 'experimental'),
      ev('Oncogenic MLL translocations observed', 'experimental'),
    ],
    assessment: 'Alarming finding that further supports non-DSB editing approaches for therapeutics.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['safety', 'chromothripsis', 'dsb-concern', 'rearrangements'],
    readAt: '2024-02-13T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-13T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 38: He Jiankui CRISPR Babies (Regalado 2018 / Cyranoski 2018)
  // User thought: "The ethics crisis - changed everything about governance"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/d41586-018-07545-0',
    title: 'CRISPR-baby scientist sentenced to three years in prison',
    authors: [
      { name: 'David Cyranoski' },
    ],
    year: 2019,
    journal: 'Nature',
    volume: '576',
    issue: '7787',
    pages: '475',
    abstract: 'He Jiankui received a three-year prison sentence for creating gene-edited babies in violation of Chinese regulations.',
    url: 'https://doi.org/10.1038/d41586-018-07545-0',
    pdfUrl: null,
    citationCount: 180,
    takeaway: 'He Jiankui\'s creation of CRISPR babies was scientifically premature, ethically unacceptable, and led to criminal conviction and global outcry.',
    arguments: [
      arg('Germline editing is not safe enough for human use', 'strong', 'agree'),
      arg('Scientific community consensus was ignored', 'strong', 'agree'),
      arg('Better governance frameworks are needed', 'strong', 'agree'),
    ],
    evidence: [
      ev('Three-year prison sentence and lifetime research ban', 'other'),
      ev('Edits were mosaic and potentially incomplete', 'other'),
      ev('No clear medical benefit (HIV resistance disputed)', 'other'),
    ],
    assessment: 'Pivotal event for CRISPR ethics. Accelerated governance discussions worldwide.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['ethics', 'germline', 'he-jiankui', 'governance', 'controversy'],
    readAt: '2024-02-14T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-14T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 39: International Commission on Germline Editing (2020)
  // User thought: "The official response - what do scientists recommend?"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1056/NEJMp2000368',
    title: 'Heritable Human Genome Editing: The International Commission Report',
    authors: [
      { name: 'Kay Davies' },
      { name: 'Richard Lifton' },
      { name: 'Eric S. Lander' },
    ],
    year: 2020,
    journal: 'New England Journal of Medicine',
    volume: '383',
    issue: '13',
    pages: 'e41',
    abstract: 'The National Academies commission recommends a clinical pathway for heritable genome editing only for serious diseases with no alternatives.',
    url: 'https://doi.org/10.1056/NEJMp2000368',
    pdfUrl: null,
    citationCount: 250,
    takeaway: 'International commission recommends strict criteria for germline editing: serious disease, no alternatives, long-term follow-up required.',
    arguments: [
      arg('Heritable editing should only be considered for serious diseases', 'strong', 'agree'),
      arg('Enhancement applications should be prohibited', 'strong', 'agree'),
      arg('International governance framework is needed', 'strong', 'agree'),
    ],
    evidence: [
      ev('Report by 18 experts from 10 countries', 'other'),
      ev('Defines "translational pathway" with safety criteria', 'other'),
      ev('Calls for international scientific registry', 'other'),
    ],
    assessment: 'Important governance framework. Remains to be seen if it will be implemented globally.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['ethics', 'governance', 'germline', 'policy', 'international'],
    readAt: '2024-02-15T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-15T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 40: Equity and Access Concerns (Baylis 2019)
  // User thought: "Who will benefit from CRISPR? Justice matters"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/d41586-019-01906-z',
    title: 'Altered inheritance: CRISPR and the ethics of human genome editing',
    authors: [
      { name: 'Françoise Baylis' },
    ],
    year: 2019,
    journal: 'Harvard University Press',
    volume: null,
    issue: null,
    pages: null,
    abstract: 'A comprehensive ethical analysis of human genome editing focusing on justice, consent, and social implications.',
    url: 'https://www.hup.harvard.edu/catalog.php?isbn=9780674976719',
    pdfUrl: null,
    citationCount: 120,
    takeaway: 'CRISPR therapeutics risk exacerbating health inequities if only available to wealthy nations and individuals.',
    arguments: [
      arg('High costs will limit access to wealthy populations', 'strong', 'agree'),
      arg('Germline editing affects future generations without consent', 'strong', 'agree'),
      arg('Disability community concerns must be addressed', 'moderate', 'agree'),
    ],
    evidence: [
      ev('Casgevy costs ~$2 million per treatment', 'other'),
      ev('Clinical trials predominantly in high-income countries', 'other'),
      ev('Philosophical analysis of consent and justice', 'theoretical'),
    ],
    assessment: 'Important ethical perspective. Technology alone won\'t ensure equitable benefit.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['ethics', 'equity', 'access', 'justice', 'book'],
    readAt: '2024-02-16T10:00:00Z',
    source: 'manual',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-16T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 41: Mosaicism in Editing (Mehravar 2019)
  // User thought: "Not all cells get edited equally - practical limitation"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1186/s12864-019-5911-4',
    title: 'Mosaicism in CRISPR/Cas9-mediated genome editing',
    authors: [
      { name: 'Mohamad Mehravar' },
      { name: 'Abolfazl Shirazi' },
      { name: 'Maryam Nazari' },
      { name: 'Mojtaba Banan' },
    ],
    year: 2019,
    journal: 'BMC Genomics',
    volume: '20',
    issue: '1',
    pages: '379',
    abstract: 'Review of mosaicism in CRISPR editing and strategies to reduce heterogeneous outcomes.',
    url: 'https://doi.org/10.1186/s12864-019-5911-4',
    pdfUrl: null,
    citationCount: 210,
    takeaway: 'Mosaicism (mixed edited/unedited cells) is common in CRISPR experiments, complicating therapeutic applications.',
    arguments: [
      arg('Mosaicism results from delayed editing after cell division', 'strong', 'agree'),
      arg('Zygote timing is critical for uniform editing', 'moderate', 'agree'),
      arg('RNP delivery reduces mosaicism vs plasmid', 'strong', 'agree'),
    ],
    evidence: [
      ev('Literature review of mosaicism frequencies', 'meta-analysis'),
      ev('RNP vs plasmid comparison studies', 'meta-analysis'),
      ev('Timing optimization strategies', 'meta-analysis'),
    ],
    assessment: 'Practical issue for therapeutics. Clonal selection or improved delivery can mitigate.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['mosaicism', 'limitation', 'delivery-timing', 'review'],
    readAt: '2024-02-17T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-17T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 42: Base Editor Off-Targets (Zuo 2019)
  // User thought: "Base editors aren't perfect either - what are their issues?"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.aav9973',
    title: 'Cytosine base editor generates substantial off-target single-nucleotide variants in mouse embryos',
    authors: [
      { name: 'Erwei Zuo' },
      { name: 'Yidi Sun' },
      { name: 'Wu Wei' },
      { name: 'Tanglong Yuan' },
      { name: 'Wenqin Ying' },
      { name: 'Haoyang Sun' },
      { name: 'Liyun Yuan' },
      { name: 'Lars M. Steinmetz' },
      { name: 'Yixue Li' },
      { name: 'Hui Yang' },
    ],
    year: 2019,
    journal: 'Science',
    volume: '364',
    issue: '6437',
    pages: '289-292',
    abstract: 'Whole-genome sequencing reveals thousands of off-target SNVs induced by cytosine base editors in mouse embryos.',
    url: 'https://doi.org/10.1126/science.aav9973',
    pdfUrl: null,
    citationCount: 580,
    takeaway: 'Base editors cause genome-wide off-target SNVs due to deaminase activity on ssDNA - not as safe as initially thought.',
    arguments: [
      arg('APOBEC deaminase acts on exposed ssDNA genome-wide', 'strong', 'agree'),
      arg('Thousands of off-target SNVs detected per embryo', 'strong', 'agree'),
      arg('Off-targets are sgRNA-independent', 'strong', 'agree'),
    ],
    evidence: [
      ev('~20,000 SNVs detected in BE3-edited embryos vs controls', 'experimental'),
      ev('Off-targets enriched in transcribed regions', 'experimental'),
      ev('ABE shows fewer off-targets than CBE', 'experimental'),
    ],
    assessment: 'Important caveat for base editing safety. Led to engineered deaminases with reduced off-targets.',
    thesisRole: 'contradicts',
    readingStatus: 'read',
    tags: ['base-editing', 'off-target', 'safety', 'snv'],
    readAt: '2024-02-18T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-18T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 43: Prime Editor Optimization (Chen 2021 - PE4/PE5)
  // User thought: "Improving prime editing efficiency - addressing a limitation"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1016/j.cell.2021.09.018',
    title: 'Enhanced prime editing systems by manipulating cellular determinants of editing outcomes',
    authors: [
      { name: 'Peter J. Chen' },
      { name: 'Jeffrey A. Hussmann' },
      { name: 'Jun Yan' },
      { name: 'Friederike Knipping' },
      { name: 'Pedar Ravisankar' },
      { name: 'David R. Liu' },
    ],
    year: 2021,
    journal: 'Cell',
    volume: '184',
    issue: '22',
    pages: '5635-5652',
    abstract: 'PE4 and PE5 systems with improved editing efficiency through manipulation of DNA repair pathways.',
    url: 'https://doi.org/10.1016/j.cell.2021.09.018',
    pdfUrl: null,
    citationCount: 420,
    takeaway: 'PE4/PE5 improve prime editing 2-7 fold by co-delivering MLH1 inhibitor, addressing the efficiency limitation.',
    arguments: [
      arg('MLH1-mediated mismatch repair antagonizes prime editing', 'strong', 'agree'),
      arg('Transient MMR inhibition improves editing without major safety concerns', 'moderate', 'agree'),
      arg('PE5 combines MMR inhibition with nick-based strategies', 'strong', 'agree'),
    ],
    evidence: [
      ev('2-7 fold improvement in editing efficiency', 'experimental'),
      ev('Works across multiple cell types', 'experimental'),
      ev('No increase in indels or off-targets', 'experimental'),
    ],
    assessment: 'Addresses a key prime editing limitation. Continued optimization improving therapeutic potential.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['prime-editing', 'optimization', 'mmr', 'efficiency'],
    readAt: '2024-02-19T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-19T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 44: Anti-CRISPR Proteins (Bondy-Denomy 2013)
  // User thought: "Natural Cas9 inhibitors - could be useful for control"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nature12400',
    title: 'Bacteriophage genes that inactivate the CRISPR/Cas bacterial immune system',
    authors: [
      { name: 'Joe Bondy-Denomy' },
      { name: 'Avril Pawluk' },
      { name: 'Karen L. Maxwell' },
      { name: 'Alan R. Davidson' },
    ],
    year: 2013,
    journal: 'Nature',
    volume: '493',
    issue: '7432',
    pages: '429-432',
    abstract: 'Phages encode anti-CRISPR proteins that inhibit CRISPR-Cas systems, representing a counter-adaptation.',
    url: 'https://doi.org/10.1038/nature12400',
    pdfUrl: null,
    citationCount: 980,
    takeaway: 'Anti-CRISPR proteins from phages can inhibit Cas enzymes - potential "off-switches" for safer gene editing.',
    arguments: [
      arg('Phages evolved anti-CRISPR proteins to evade CRISPR immunity', 'strong', 'agree'),
      arg('Different Acrs target different steps of CRISPR pathway', 'strong', 'agree'),
      arg('Acrs could provide temporal control of editing', 'moderate', 'agree'),
    ],
    evidence: [
      ev('Five distinct anti-CRISPR proteins identified', 'experimental'),
      ev('Block DNA binding or cleavage by Cas proteins', 'experimental'),
      ev('Work in bacterial and mammalian systems', 'experimental'),
    ],
    assessment: 'Fascinating biology with practical applications for controlled editing. Safety switch potential.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['anti-crispr', 'phage', 'control', 'safety-switch'],
    readAt: '2024-02-20T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-20T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 45: Patent Wars and Access (Sherkow 2017)
  // User thought: "Patents affect who can use CRISPR - practical barrier"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nbt.3692',
    title: 'Patent protection for CRISPR: an ELSI review',
    authors: [
      { name: 'Jacob S. Sherkow' },
    ],
    year: 2017,
    journal: 'Nature Biotechnology',
    volume: '35',
    issue: '4',
    pages: '293-297',
    abstract: 'Analysis of the CRISPR patent landscape and its implications for research and development.',
    url: 'https://doi.org/10.1038/nbt.3692',
    pdfUrl: null,
    citationCount: 180,
    takeaway: 'CRISPR patent disputes (Berkeley vs Broad) create uncertainty and may limit access, especially in lower-income countries.',
    arguments: [
      arg('Patent landscape is complex with overlapping claims', 'strong', 'agree'),
      arg('Disputes may slow therapeutic development', 'moderate', 'uncertain'),
      arg('Academic research largely unaffected by patents', 'moderate', 'agree'),
    ],
    evidence: [
      ev('Analysis of USPTO and EPO patent filings', 'other'),
      ev('Review of licensing agreements', 'other'),
      ev('Comparison to other biotech patent disputes', 'other'),
    ],
    assessment: 'Important practical consideration for commercialization. Landscape is settling but royalties add to therapeutic costs.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['patents', 'intellectual-property', 'access', 'commercialization'],
    readAt: '2024-02-21T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-21T08:00:00Z',
    semanticScholarId: null,
  },
];

export const PART3_PAPER_COUNT = crisprPapersPart3.length; // 15 papers
