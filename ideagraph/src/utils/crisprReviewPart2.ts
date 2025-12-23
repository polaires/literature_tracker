// ============================================================================
// CRISPR REVIEW SAMPLE DATA - PART 2: Applications & Delivery (Papers 16-30)
// ============================================================================
// User thought: "Now the exciting part - what can we DO with CRISPR?"

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
// PAPERS PART 2: APPLICATIONS & DELIVERY (Papers 16-30)
// ============================================================================

export const crisprPapersPart2: Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'>[] = [
  // -------------------------------------------------------------------------
  // Paper 16: First CRISPR Clinical Trial (Lu 2020 - Lung Cancer)
  // User thought: "The first in-human trial - milestone paper"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/s41591-020-0840-5',
    title: 'CRISPR-Cas9 in vivo gene editing for transthyretin amyloidosis',
    authors: [
      { name: 'Julian D. Gillmore' },
      { name: 'Ed Gane' },
      { name: 'Jorg Taubel' },
      { name: 'Justin Kao' },
      { name: 'Marianna Fontana' },
    ],
    year: 2021,
    journal: 'New England Journal of Medicine',
    volume: '385',
    issue: '6',
    pages: '493-502',
    abstract: 'In patients with transthyretin amyloidosis, a single dose of CRISPR-Cas9 therapy reduced serum transthyretin levels by up to 96%.',
    url: 'https://doi.org/10.1056/NEJMoa2107454',
    pdfUrl: null,
    citationCount: 890,
    takeaway: 'First in vivo CRISPR therapy shows 87-96% knockdown of TTR in humans, demonstrating clinical feasibility of systemic gene editing.',
    arguments: [
      arg('LNP delivery of Cas9 mRNA + sgRNA achieves efficient liver editing', 'strong', 'agree'),
      arg('Single dose produces durable knockdown over months', 'strong', 'agree'),
      arg('Adverse events were mostly infusion-related and manageable', 'moderate', 'agree'),
    ],
    evidence: [
      ev('6 patients with hereditary ATTR amyloidosis treated', 'experimental'),
      ev('87% mean reduction in TTR at 0.3 mg/kg dose', 'experimental'),
      ev('96% reduction sustained at 28 days', 'experimental'),
    ],
    assessment: 'Historic milestone for CRISPR therapeutics. Liver is the "easiest" target - challenges remain for other organs.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['clinical-trial', 'therapeutics', 'in-vivo', 'lnp-delivery', 'landmark'],
    readAt: '2024-01-22T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-22T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 17: Sickle Cell Disease Therapy (Frangoul 2021)
  // User thought: "This could cure millions - incredibly important"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1056/NEJMoa2031054',
    title: 'CRISPR-Cas9 Gene Editing for Sickle Cell Disease and β-Thalassemia',
    authors: [
      { name: 'Haydar Frangoul' },
      { name: 'David Altshuler' },
      { name: 'M. Domenica Cappellini' },
      { name: 'Yi-Shan Chen' },
      { name: 'Jennifer Domm' },
    ],
    year: 2021,
    journal: 'New England Journal of Medicine',
    volume: '384',
    issue: '3',
    pages: '252-260',
    abstract: 'CRISPR-Cas9 editing of BCL11A in autologous CD34+ cells led to elimination of vaso-occlusive crises in sickle cell disease.',
    url: 'https://doi.org/10.1056/NEJMoa2031054',
    pdfUrl: null,
    citationCount: 1200,
    takeaway: 'CTX001 (now Casgevy) shows durable elimination of sickle cell crises by reactivating fetal hemoglobin via BCL11A editing.',
    arguments: [
      arg('BCL11A silencing reactivates fetal hemoglobin production', 'strong', 'agree'),
      arg('Ex vivo editing of HSCs avoids delivery challenges', 'strong', 'agree'),
      arg('Edited cells engraft and produce lasting effects', 'strong', 'agree'),
    ],
    evidence: [
      ev('1 SCD patient: no VOCs at 16+ months follow-up', 'experimental'),
      ev('1 TDT patient: transfusion-independent at 15+ months', 'experimental'),
      ev('HbF levels increased from ~5% to 40%+', 'experimental'),
    ],
    assessment: 'First approved CRISPR therapy (2023). Transforms a devastating disease. Cost and accessibility remain challenges.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['clinical-trial', 'sickle-cell', 'casgevy', 'fda-approved', 'landmark'],
    readAt: '2024-01-23T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-23T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 18: CAR-T Enhancement (Eyquem 2017)
  // User thought: "CRISPR improving an already revolutionary therapy"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nature22395',
    title: 'Targeting a CAR to the TRAC locus with CRISPR/Cas9 enhances tumour rejection',
    authors: [
      { name: 'Justin Eyquem' },
      { name: 'Jorge Mansilla-Soto' },
      { name: 'Theodoros Giavridis' },
      { name: 'Sjoukje J.C. van der Stegen' },
      { name: 'Mohamad Hamieh' },
      { name: 'Michel Sadelain' },
    ],
    year: 2017,
    journal: 'Nature',
    volume: '543',
    issue: '7643',
    pages: '113-117',
    abstract: 'CRISPR-targeted insertion of CAR into the TRAC locus creates more potent CAR-T cells with uniform expression.',
    url: 'https://doi.org/10.1038/nature22395',
    pdfUrl: null,
    citationCount: 1600,
    takeaway: 'Site-specific CAR integration via CRISPR produces superior T cells vs random integration - physiological regulation matters.',
    arguments: [
      arg('Random CAR integration causes variable expression and exhaustion', 'strong', 'agree'),
      arg('TRAC locus provides physiological TCR-like regulation', 'strong', 'agree'),
      arg('TRAC-CAR T cells outperform conventional CAR-T in vivo', 'strong', 'agree'),
    ],
    evidence: [
      ev('TRAC-CAR integration via Cas9 + AAV donor template', 'experimental'),
      ev('Improved tumor control in mouse ALL model', 'experimental'),
      ev('Reduced T cell exhaustion markers', 'experimental'),
    ],
    assessment: 'Elegant demonstration of precision editing advantage. Being incorporated into next-gen CAR-T manufacturing.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['car-t', 'immunotherapy', 'knock-in', 'precision'],
    readAt: '2024-01-24T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-24T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 19: Muscular Dystrophy Correction (Amoasii 2018)
  // User thought: "Challenging target - muscle is hard to reach"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.aap9249',
    title: 'Gene editing restores dystrophin expression in a canine model of Duchenne muscular dystrophy',
    authors: [
      { name: 'Leonela Amoasii' },
      { name: 'John C.W. Hildyard' },
      { name: 'Hui Li' },
      { name: 'Efrain Sanchez-Ortiz' },
      { name: 'Alex Mirelez' },
      { name: 'Daniel Caballero' },
      { name: 'Rachel Harron' },
      { name: 'Eric N. Olson' },
    ],
    year: 2018,
    journal: 'Science',
    volume: '362',
    issue: '6410',
    pages: '86-91',
    abstract: 'AAV-CRISPR delivery restored dystrophin in skeletal and cardiac muscle of DMD dogs.',
    url: 'https://doi.org/10.1126/science.aap9249',
    pdfUrl: null,
    citationCount: 520,
    takeaway: 'Exon-skipping via CRISPR restores dystrophin in large animal model - promising but delivery efficiency varies by muscle type.',
    arguments: [
      arg('Exon skipping can restore truncated but functional dystrophin', 'strong', 'agree'),
      arg('AAV9 delivery reaches cardiac and skeletal muscle', 'moderate', 'agree'),
      arg('Editing efficiency varies across muscle groups', 'moderate', 'agree'),
    ],
    evidence: [
      ev('Dystrophin restored to ~50% of normal in some muscles', 'experimental'),
      ev('Cardiac function improved in treated dogs', 'experimental'),
      ev('Durability >1 year in treated animals', 'experimental'),
    ],
    assessment: 'Important proof-of-concept. Muscle delivery remains challenging; local injection may be needed for some muscles.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['dmd', 'muscle', 'aav-delivery', 'large-animal'],
    readAt: '2024-01-25T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-25T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 20: LNP Delivery Advances (Finn 2018)
  // User thought: "Delivery is THE bottleneck - this addresses it"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nbt.4205',
    title: 'A single administration of CRISPR/Cas9 lipid nanoparticles achieves robust and persistent in vivo genome editing',
    authors: [
      { name: 'James D. Finn' },
      { name: 'Adam R. Smith' },
      { name: 'Mihir C. Patel' },
      { name: 'Lishan Shaw' },
      { name: 'Michael R. Youniss' },
      { name: 'John van Heteren' },
    ],
    year: 2018,
    journal: 'Nature Biotechnology',
    volume: '36',
    issue: '6',
    pages: '509-515',
    abstract: 'LNP delivery of Cas9 mRNA and sgRNA achieved >97% editing in mouse liver after a single dose.',
    url: 'https://doi.org/10.1038/nbt.4205',
    pdfUrl: null,
    citationCount: 750,
    takeaway: 'LNPs can deliver CRISPR components with >97% liver editing efficiency, enabling transient expression that avoids prolonged Cas9 presence.',
    arguments: [
      arg('LNPs provide efficient hepatocyte transfection', 'strong', 'agree'),
      arg('Transient Cas9 expression reduces off-target accumulation', 'strong', 'agree'),
      arg('Single dose achieves near-complete editing in liver', 'strong', 'agree'),
    ],
    evidence: [
      ev('>97% TTR knockout in mouse liver', 'experimental'),
      ev('Cas9 protein cleared within 48 hours', 'experimental'),
      ev('No detectable off-target editing', 'experimental'),
    ],
    assessment: 'LNP delivery is now the gold standard for liver targeting. Built on COVID vaccine technology.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['delivery', 'lnp', 'liver', 'transient-expression'],
    readAt: '2024-01-26T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-26T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 21: AAV Delivery Optimization (Ran 2015 - SaCas9)
  // User thought: "AAV size limit is a problem - SaCas9 is the solution"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nature14299',
    title: 'In vivo genome editing using Staphylococcus aureus Cas9',
    authors: [
      { name: 'F. Ann Ran' },
      { name: 'Le Cong' },
      { name: 'Winston X. Yan' },
      { name: 'David A. Scott' },
      { name: 'Jonathan S. Gootenberg' },
      { name: 'Feng Zhang' },
    ],
    year: 2015,
    journal: 'Nature',
    volume: '520',
    issue: '7546',
    pages: '186-191',
    abstract: 'SaCas9 is 1 kb smaller than SpCas9, enabling all-in-one AAV delivery for in vivo genome editing.',
    url: 'https://doi.org/10.1038/nature14299',
    pdfUrl: null,
    citationCount: 3200,
    takeaway: 'SaCas9\'s smaller size (3.2 vs 4.1 kb) enables single-AAV delivery of complete CRISPR system - practical engineering solution.',
    arguments: [
      arg('SaCas9 is 1 kb smaller than SpCas9', 'strong', 'agree'),
      arg('Single AAV can carry SaCas9 + sgRNA + promoter', 'strong', 'agree'),
      arg('SaCas9 is as efficient as SpCas9 in mammalian cells', 'strong', 'agree'),
    ],
    evidence: [
      ev('PCSK9 knockout in mouse liver via AAV-SaCas9', 'experimental'),
      ev('>40% indel rate in hepatocytes', 'experimental'),
      ev('Reduced cholesterol levels in treated mice', 'experimental'),
    ],
    assessment: 'Practical solution to AAV packaging limits. SaCas9 now widely used for in vivo applications.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['sacas9', 'aav-delivery', 'in-vivo', 'size-constraint'],
    readAt: '2024-01-27T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-27T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 22: CRISPR Gene Drives (Hammond 2016)
  // User thought: "Controversial but potentially game-changing for malaria"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nbt.3439',
    title: 'A CRISPR-Cas9 gene drive system targeting female reproduction in the malaria mosquito vector Anopheles gambiae',
    authors: [
      { name: 'Andrew Hammond' },
      { name: 'Roberto Galizi' },
      { name: 'Kyros Kyrou' },
      { name: 'Alekos Simoni' },
      { name: 'Carla Siniscalchi' },
      { name: 'Dimitris Katsanos' },
      { name: 'Tony Nolan' },
      { name: 'Andrea Crisanti' },
    ],
    year: 2016,
    journal: 'Nature Biotechnology',
    volume: '34',
    issue: '1',
    pages: '78-83',
    abstract: 'A CRISPR gene drive targeting female fertility genes in Anopheles shows >90% inheritance and can spread through caged populations.',
    url: 'https://doi.org/10.1038/nbt.3439',
    pdfUrl: null,
    citationCount: 890,
    takeaway: 'Gene drives can bias inheritance to >90%, potentially suppressing mosquito populations, but ecological risks require careful assessment.',
    arguments: [
      arg('CRISPR gene drives can achieve super-Mendelian inheritance', 'strong', 'agree'),
      arg('Targeting female fertility could suppress mosquito populations', 'strong', 'agree'),
      arg('Ecological consequences are difficult to predict', 'strong', 'agree'),
    ],
    evidence: [
      ev('>90% inheritance of drive in cage experiments', 'experimental'),
      ev('Population suppression over 4-6 generations', 'experimental'),
      ev('Resistance alleles emerge but at low frequency', 'experimental'),
    ],
    assessment: 'Powerful but controversial. Regulatory and ethical frameworks still being developed. Could eliminate malaria - or have unintended consequences.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['gene-drive', 'malaria', 'mosquito', 'controversial', 'ecological'],
    readAt: '2024-01-28T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-28T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 23: CRISPR Agriculture (Gao 2020 - Review)
  // User thought: "Important application domain - food security implications"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/s41568-020-0255-6',
    title: 'Genome engineering for crop improvement and future agriculture',
    authors: [
      { name: 'Caixia Gao' },
    ],
    year: 2021,
    journal: 'Nature Reviews Molecular Cell Biology',
    volume: '22',
    issue: '8',
    pages: '274-289',
    abstract: 'Review of genome editing applications in agriculture, including crop improvement, disease resistance, and nutritional enhancement.',
    url: 'https://doi.org/10.1038/s41580-020-00284-x',
    pdfUrl: null,
    citationCount: 620,
    takeaway: 'CRISPR enables precise crop improvement without transgene integration, potentially circumventing GMO regulations in some jurisdictions.',
    arguments: [
      arg('CRISPR can improve yield, disease resistance, and nutrition', 'strong', 'agree'),
      arg('Edits without foreign DNA may avoid GMO classification', 'moderate', 'uncertain'),
      arg('Regulatory frameworks vary significantly by country', 'strong', 'agree'),
    ],
    evidence: [
      ev('Non-browning mushrooms approved without GMO process (USDA)', 'other'),
      ev('Disease-resistant wheat, powdery mildew resistant', 'experimental'),
      ev('High-amylose rice for diabetes management', 'experimental'),
    ],
    assessment: 'Comprehensive review of agricultural applications. Regulatory landscape is complex and evolving.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['agriculture', 'crop-improvement', 'regulation', 'review'],
    readAt: '2024-01-29T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-29T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 24: CRISPR Diagnostics - SHERLOCK (Gootenberg 2017)
  // User thought: "Beyond editing - detection applications are exciting"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.aam9321',
    title: 'Nucleic acid detection with CRISPR-Cas13a/C2c2',
    authors: [
      { name: 'Jonathan S. Gootenberg' },
      { name: 'Omar O. Abudayyeh' },
      { name: 'Jeong Wook Lee' },
      { name: 'Patrick Essletzbichler' },
      { name: 'Aaron J. Dy' },
      { name: 'Julia Joung' },
      { name: 'Vanessa Verdine' },
      { name: 'Nina Donghia' },
      { name: 'Feng Zhang' },
    ],
    year: 2017,
    journal: 'Science',
    volume: '356',
    issue: '6336',
    pages: '438-442',
    abstract: 'SHERLOCK uses Cas13a\'s collateral RNase activity for attomolar detection of nucleic acids.',
    url: 'https://doi.org/10.1126/science.aam9321',
    pdfUrl: null,
    citationCount: 2100,
    takeaway: 'Cas13\'s collateral cleavage enables ultrasensitive nucleic acid detection - attomolar sensitivity without specialized equipment.',
    arguments: [
      arg('Cas13a exhibits collateral RNase activity upon target recognition', 'strong', 'agree'),
      arg('SHERLOCK achieves attomolar (10^-18 M) sensitivity', 'strong', 'agree'),
      arg('Can be performed without sophisticated lab equipment', 'moderate', 'agree'),
    ],
    evidence: [
      ev('Single-molecule detection of Zika and Dengue RNA', 'experimental'),
      ev('Lateral flow readout for point-of-care use', 'experimental'),
      ev('100% specificity between Zika strains', 'experimental'),
    ],
    assessment: 'Expanded CRISPR beyond editing to diagnostics. Used extensively during COVID-19 pandemic.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['diagnostics', 'sherlock', 'cas13', 'detection', 'point-of-care'],
    readAt: '2024-01-30T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-30T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 25: DETECTR (Chen 2018)
  // User thought: "Competing diagnostic platform - good to compare"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.aar6245',
    title: 'CRISPR-Cas12a target binding unleashes indiscriminate single-stranded DNase activity',
    authors: [
      { name: 'Janice S. Chen' },
      { name: 'Enbo Ma' },
      { name: 'Lucas B. Harrington' },
      { name: 'Maria Da Costa' },
      { name: 'Xinran Tian' },
      { name: 'Jennifer A. Doudna' },
    ],
    year: 2018,
    journal: 'Science',
    volume: '360',
    issue: '6387',
    pages: '436-439',
    abstract: 'Cas12a (Cpf1) exhibits collateral ssDNA cleavage upon dsDNA recognition, enabling the DETECTR diagnostic platform.',
    url: 'https://doi.org/10.1126/science.aar6245',
    pdfUrl: null,
    citationCount: 1800,
    takeaway: 'DETECTR uses Cas12a\'s collateral ssDNase for DNA detection, complementing SHERLOCK for a complete nucleic acid diagnostic toolkit.',
    arguments: [
      arg('Cas12a has target-activated ssDNase activity', 'strong', 'agree'),
      arg('DETECTR can detect dsDNA targets (vs SHERLOCK for RNA)', 'strong', 'agree'),
      arg('Attomolar sensitivity achieved with isothermal amplification', 'strong', 'agree'),
    ],
    evidence: [
      ev('HPV16 and HPV18 detection in patient samples', 'experimental'),
      ev('Results in <1 hour with lateral flow strip', 'experimental'),
      ev('No cross-reactivity between HPV types', 'experimental'),
    ],
    assessment: 'Doudna lab\'s diagnostic platform. Together with SHERLOCK, provides complete DNA/RNA detection capability.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['diagnostics', 'detectr', 'cas12a', 'detection', 'hpv'],
    readAt: '2024-01-31T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-31T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 26: CRISPR Screens for Functional Genomics (Wang 2014)
  // User thought: "High-throughput screening - transformative for drug discovery"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.1246981',
    title: 'Genetic screens in human cells using the CRISPR-Cas9 system',
    authors: [
      { name: 'Tim Wang' },
      { name: 'Jenny J. Wei' },
      { name: 'David M. Sabatini' },
      { name: 'Eric S. Lander' },
    ],
    year: 2014,
    journal: 'Science',
    volume: '343',
    issue: '6166',
    pages: '80-84',
    abstract: 'Genome-scale CRISPR-Cas9 knockout libraries enable systematic identification of genes essential for cell viability and drug resistance.',
    url: 'https://doi.org/10.1126/science.1246981',
    pdfUrl: null,
    citationCount: 4500,
    takeaway: 'Genome-wide CRISPR screens identify essential genes and drug targets with unprecedented resolution - revolutionized functional genomics.',
    arguments: [
      arg('CRISPR screens outperform RNAi for loss-of-function studies', 'strong', 'agree'),
      arg('Complete knockouts eliminate hypomorphic allele issues', 'strong', 'agree'),
      arg('Library design affects screen performance', 'moderate', 'agree'),
    ],
    evidence: [
      ev('73,000 sgRNAs targeting 7,114 genes in pooled screen', 'experimental'),
      ev('Identified known and novel essential genes', 'experimental'),
      ev('Hit validation rate >90%', 'experimental'),
    ],
    assessment: 'Foundational method paper. CRISPR screens are now standard in drug discovery and basic research.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['screening', 'functional-genomics', 'drug-discovery', 'essential-genes'],
    readAt: '2024-02-01T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-01T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 27: CRISPRi/CRISPRa (Gilbert 2014)
  // User thought: "Regulation without cutting - very useful"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1016/j.cell.2014.09.029',
    title: 'Genome-Scale CRISPR-Mediated Control of Gene Repression and Activation',
    authors: [
      { name: 'Luke A. Gilbert' },
      { name: 'Max A. Horlbeck' },
      { name: 'Britt Adamson' },
      { name: 'Jacqueline E. Villalta' },
      { name: 'Yuwen Chen' },
      { name: 'Jonathan S. Weissman' },
    ],
    year: 2014,
    journal: 'Cell',
    volume: '159',
    issue: '3',
    pages: '647-661',
    abstract: 'dCas9 fusion proteins enable programmable activation (CRISPRa) or repression (CRISPRi) of endogenous genes.',
    url: 'https://doi.org/10.1016/j.cell.2014.09.029',
    pdfUrl: null,
    citationCount: 3100,
    takeaway: 'CRISPRi/CRISPRa provide reversible, tunable gene regulation without DNA cutting - complementary to knockout approaches.',
    arguments: [
      arg('dCas9-KRAB fusion enables robust gene repression', 'strong', 'agree'),
      arg('dCas9-VP64 or SunTag enables gene activation', 'strong', 'agree'),
      arg('Effects are reversible, unlike knockouts', 'strong', 'agree'),
    ],
    evidence: [
      ev('CRISPRi achieves 90-99% knockdown at many loci', 'experimental'),
      ev('CRISPRa activates genes up to 1000-fold', 'experimental'),
      ev('Genome-scale screens identify growth regulators', 'experimental'),
    ],
    assessment: 'Powerful complement to knockout approaches. Particularly useful for essential genes and developmental studies.',
    thesisRole: 'method',
    readingStatus: 'read',
    tags: ['crispri', 'crispra', 'gene-regulation', 'dcas9', 'reversible'],
    readAt: '2024-02-02T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-02T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 28: Epigenome Editing (Hilton 2015)
  // User thought: "Editing chromatin, not DNA - expanding the toolkit"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/nbt.3199',
    title: 'Epigenome editing by a CRISPR-Cas9-based acetyltransferase activates genes from promoters and enhancers',
    authors: [
      { name: 'Isaac B. Hilton' },
      { name: 'Anthony M. D\'Ippolito' },
      { name: 'Christopher M. Vockley' },
      { name: 'Pratiksha I. Thakore' },
      { name: 'Gregory E. Crawford' },
      { name: 'Timothy E. Reddy' },
      { name: 'Charles A. Gersbach' },
    ],
    year: 2015,
    journal: 'Nature Biotechnology',
    volume: '33',
    issue: '5',
    pages: '510-517',
    abstract: 'dCas9-p300 fusion deposits H3K27ac marks to activate genes from promoters and distant enhancers.',
    url: 'https://doi.org/10.1038/nbt.3199',
    pdfUrl: null,
    citationCount: 1200,
    takeaway: 'Targeted histone acetylation via dCas9-p300 enables gene activation through native regulatory mechanisms - epigenome editing.',
    arguments: [
      arg('dCas9-p300 deposits H3K27ac at target loci', 'strong', 'agree'),
      arg('Enhancer targeting activates genes without promoter binding', 'strong', 'agree'),
      arg('Epigenetic changes can be heritable through cell division', 'moderate', 'uncertain'),
    ],
    evidence: [
      ev('IL1RN activation from 8 kb upstream enhancer', 'experimental'),
      ev('H3K27ac enrichment at target sites by ChIP-seq', 'experimental'),
      ev('Works with multiple guide RNAs for robust activation', 'experimental'),
    ],
    assessment: 'Expands CRISPR beyond sequence editing to chromatin modification. Important for understanding enhancer biology.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['epigenome-editing', 'histone-modification', 'enhancer', 'p300'],
    readAt: '2024-02-03T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-03T09:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 29: RNA Editing with Cas13 (Cox 2017 - REPAIR)
  // User thought: "Editing RNA, not DNA - interesting for therapeutic reversibility"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.aaq0180',
    title: 'RNA editing with CRISPR-Cas13',
    authors: [
      { name: 'David B.T. Cox' },
      { name: 'Jonathan S. Gootenberg' },
      { name: 'Omar O. Abudayyeh' },
      { name: 'Brian Franklin' },
      { name: 'Max J. Kellner' },
      { name: 'Julia Joung' },
      { name: 'Feng Zhang' },
    ],
    year: 2017,
    journal: 'Science',
    volume: '358',
    issue: '6366',
    pages: '1019-1027',
    abstract: 'REPAIR (RNA Editing for Programmable A to I Replacement) uses catalytically inactive Cas13 fused to ADAR2 deaminase for A-to-I editing of RNA.',
    url: 'https://doi.org/10.1126/science.aaq0180',
    pdfUrl: null,
    citationCount: 1100,
    takeaway: 'RNA editing via Cas13-ADAR provides reversible, non-heritable corrections - potentially safer than DNA editing for some applications.',
    arguments: [
      arg('Cas13-ADAR fusion enables programmable A-to-I RNA editing', 'strong', 'agree'),
      arg('RNA edits are reversible and non-heritable', 'strong', 'agree'),
      arg('Can correct G-to-A mutations at the RNA level', 'strong', 'agree'),
    ],
    evidence: [
      ev('Up to 50% A-to-I editing at target sites', 'experimental'),
      ev('Correction of disease mutations in patient cells', 'experimental'),
      ev('Minimal off-target RNA editing with engineered ADAR', 'experimental'),
    ],
    assessment: 'Interesting therapeutic modality. Reversibility is both a feature (safety) and limitation (need repeated dosing).',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['rna-editing', 'cas13', 'repair', 'adar', 'reversible'],
    readAt: '2024-02-04T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-04T08:00:00Z',
    semanticScholarId: null,
  },

  // -------------------------------------------------------------------------
  // Paper 30: In Utero Gene Editing (Rossidis 2018)
  // User thought: "Controversial but potentially transformative for genetic diseases"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1038/s41591-018-0106-8',
    title: 'In utero CRISPR-mediated therapeutic editing of metabolic genes',
    authors: [
      { name: 'Avery C. Rossidis' },
      { name: 'John D. Stratigis' },
      { name: 'Apeksha A. Chadwick' },
      { name: 'Haiying Hartman' },
      { name: 'Nicholas J. Ahn' },
      { name: 'William H. Peranteau' },
    ],
    year: 2018,
    journal: 'Nature Medicine',
    volume: '24',
    issue: '8',
    pages: '1191-1198',
    abstract: 'Prenatal CRISPR editing in mouse models of metabolic disease shows improved outcomes and survival.',
    url: 'https://doi.org/10.1038/s41591-018-0106-8',
    pdfUrl: null,
    citationCount: 280,
    takeaway: 'Prenatal gene editing can correct metabolic diseases before birth, potentially preventing irreversible organ damage.',
    arguments: [
      arg('Prenatal editing can prevent disease before symptoms appear', 'strong', 'agree'),
      arg('Fetal cells may be more amenable to editing', 'moderate', 'agree'),
      arg('Ethical concerns about fetal intervention are significant', 'strong', 'agree'),
    ],
    evidence: [
      ev('Survival of HPD-knockout mice improved by prenatal editing', 'experimental'),
      ev('Liver damage prevented in tyrosinemia model', 'experimental'),
      ev('No adverse effects on fetal development observed', 'experimental'),
    ],
    assessment: 'Promising but ethically complex. Animal studies only - human fetal editing raises profound concerns.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['prenatal', 'in-utero', 'metabolic-disease', 'ethical-concerns'],
    readAt: '2024-02-05T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-05T09:00:00Z',
    semanticScholarId: null,
  },
];

export const PART2_PAPER_COUNT = crisprPapersPart2.length; // 15 papers
