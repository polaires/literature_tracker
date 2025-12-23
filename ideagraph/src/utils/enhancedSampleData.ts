// ============================================================================
// ENHANCED SAMPLE DATA - Simulating a Real Research Workflow
// ============================================================================
//
// This example recreates the literature review process for a systematic review on:
// "Large Language Models for Code Generation: Capabilities, Limitations, and Future Directions"
//
// We simulate a researcher building their IdeaGraph from scratch, documenting:
// 1. The natural workflow and decision points
// 2. Pain points and difficulties encountered
// 3. "What if we have..." feature ideas that emerge from real usage
//
// The papers are based on real, influential research in the LLM code generation space.
// ============================================================================

import type {
  Thesis,
  Paper,
  Connection,
  ReviewSection,
  SynthesisTheme,
  ResearchGap,
  EvidenceSynthesis,
  Argument,
  Evidence
} from '../types';

const generateId = () => crypto.randomUUID();

// ============================================================================
// WORKFLOW DOCUMENTATION - What a Real User Experiences
// ============================================================================

export interface WorkflowStep {
  step: number;
  action: string;
  userThought: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'frustrating';
  timeEstimate: string;
  painPoints: string[];
  wishList: string[]; // "What if we have..."
}

export const workflowDocumentation: WorkflowStep[] = [
  {
    step: 1,
    action: 'Create thesis/research question',
    userThought: 'I want to review LLMs for code generation - what are their limits?',
    difficulty: 'easy',
    timeEstimate: '2 minutes',
    painPoints: [
      'Hard to formulate a specific enough research question',
      'Not sure if my question is too broad or too narrow',
    ],
    wishList: [
      'AI-assisted thesis refinement based on existing literature',
      'Show similar research questions from published reviews',
      'Suggest sub-questions to break down broad topics',
    ],
  },
  {
    step: 2,
    action: 'Find seed papers via Semantic Scholar',
    userThought: 'Starting with "Codex" and "code generation" search...',
    difficulty: 'medium',
    timeEstimate: '15-30 minutes',
    painPoints: [
      'Search returns too many results (1000+)',
      'Hard to identify which papers are truly foundational',
      'Citation counts can be misleading for newer papers',
      'Some key papers have non-obvious titles',
    ],
    wishList: [
      'Auto-detect foundational/highly-cited papers in a topic',
      'Show citation network preview before adding',
      'Import from existing literature review sections',
      'Suggest papers based on my thesis text',
    ],
  },
  {
    step: 3,
    action: 'Screen papers - title/abstract review',
    userThought: 'Going through 50 papers to decide include/exclude...',
    difficulty: 'hard',
    timeEstimate: '1-2 hours',
    painPoints: [
      'Repetitive: read abstract, decide, repeat',
      'Easy to lose track of screening criteria',
      'Some papers need full-text to decide',
      'Keeping consistent criteria is mentally taxing',
    ],
    wishList: [
      'AI pre-screening with explanation of why included/excluded',
      'Batch operations: "exclude all papers before 2020"',
      'Quick-key shortcuts for screening decisions',
      'Show my inclusion criteria while screening',
    ],
  },
  {
    step: 4,
    action: 'Add first paper (Codex paper) with synthesis',
    userThought: 'This is THE foundational paper, need to read carefully...',
    difficulty: 'medium',
    timeEstimate: '30-45 minutes per paper',
    painPoints: [
      'Writing a good takeaway is surprisingly hard',
      'What level of detail for arguments/evidence?',
      'Should I include ALL claims or just main ones?',
      'Unsure how to assign thesis role for foundational papers',
    ],
    wishList: [
      'AI-suggested takeaway from abstract that I can edit',
      'Examples of good takeaways for reference',
      'Auto-extract claims/evidence from highlighted PDF text',
      'Templates for different paper types (empirical, review, etc.)',
    ],
  },
  {
    step: 5,
    action: 'Add second paper and create first connection',
    userThought: 'This paper extends Codex... how do they relate?',
    difficulty: 'hard',
    timeEstimate: '20-30 minutes',
    painPoints: [
      'Hard to articulate WHY papers are connected',
      'Connection types feel limited - need "builds-on" type',
      'Unsure if connection should be A→B or B→A',
      'Wish I could see both abstracts side-by-side',
    ],
    wishList: [
      'AI-suggested connections with explanations',
      'Side-by-side paper comparison view',
      'Connection strength/importance rating',
      'Visualize connection before confirming',
    ],
  },
  {
    step: 6,
    action: 'Continue adding papers (5-10)',
    userThought: 'Building momentum, but graph is getting complex...',
    difficulty: 'medium',
    timeEstimate: '2-3 hours',
    painPoints: [
      'Losing track of which papers I have already added',
      'Graph becomes a "hairball" with many connections',
      'Similar papers are hard to distinguish visually',
      'Need to keep referring back to earlier papers',
    ],
    wishList: [
      'Duplicate detection: "You already have a similar paper"',
      'Cluster similar papers automatically',
      'Filter graph by connection type or role',
      'Mini-map for large graphs',
    ],
  },
  {
    step: 7,
    action: 'Realize patterns - create synthesis themes',
    userThought: 'I see three recurring themes emerging...',
    difficulty: 'hard',
    timeEstimate: '30-60 minutes',
    painPoints: [
      'Hard to articulate emergent themes clearly',
      'Some papers belong to multiple themes',
      'Theme boundaries are fuzzy',
      'Wish I could see all arguments grouped by similarity',
    ],
    wishList: [
      'AI-suggested themes from paper arguments',
      'Drag-and-drop papers into theme bubbles',
      'See theme coverage across papers',
      'Export theme summary as section of review',
    ],
  },
  {
    step: 8,
    action: 'Identify research gaps',
    userThought: 'What questions remain unanswered?',
    difficulty: 'hard',
    timeEstimate: '30-60 minutes',
    painPoints: [
      'Hard to notice what is MISSING from papers',
      'Gaps feel vague - hard to make specific',
      'Need domain knowledge to identify methodological gaps',
      'Some gaps are implicit in the literature',
    ],
    wishList: [
      'AI gap analysis: "No papers address X"',
      'Show contradiction clusters as potential gaps',
      'Link gaps to specific missing evidence',
      'Suggest gap priority based on thesis',
    ],
  },
  {
    step: 9,
    action: 'Revisit and refine after reading more',
    userThought: 'New paper changes my understanding of earlier papers...',
    difficulty: 'frustrating',
    timeEstimate: 'Ongoing',
    painPoints: [
      'Need to update old takeaways based on new knowledge',
      'Connections become outdated as understanding deepens',
      'Hard to track what changed over time',
      'Wish I could see my evolving understanding',
    ],
    wishList: [
      'Version history for takeaways and connections',
      'Highlight papers not revisited recently',
      'Show evolution of my thesis understanding over time',
      'Prompt to review old papers when adding related new ones',
    ],
  },
  {
    step: 10,
    action: 'Export for writing literature review',
    userThought: 'Time to write up my findings...',
    difficulty: 'hard',
    timeEstimate: '2-4 hours',
    painPoints: [
      'Export format does not match my writing style',
      'Need to reorganize by section, not by paper',
      'Citations need reformatting for different journals',
      'Want to see evidence table for methods section',
    ],
    wishList: [
      'Export as structured literature review draft',
      'Organize by synthesis theme, not just paper',
      'Generate evidence summary tables',
      'Citation style auto-conversion',
    ],
  },
];

// ============================================================================
// SAMPLE THESIS - LLMs for Code Generation
// ============================================================================

export const enhancedSampleThesis: Omit<Thesis, 'id' | 'createdAt' | 'updatedAt' | 'paperIds' | 'connectionIds'> = {
  title: 'What are the fundamental limitations of Large Language Models for code generation, and how might they be overcome?',
  description: `A systematic review examining the capabilities and limitations of LLM-based code generation systems (Codex, CodeGen, StarCoder, GPT-4, etc.).

Key questions:
1. What types of coding tasks can LLMs reliably solve?
2. Where do LLMs systematically fail (logic, algorithms, security)?
3. What techniques improve LLM code generation (prompting, fine-tuning, retrieval)?
4. What are the implications for software engineering practice?

Scope: Focuses on transformer-based models from 2020 onwards, excluding symbolic/hybrid approaches.`,
  isArchived: false,
};

// ============================================================================
// SAMPLE PAPERS - Real Papers from LLM Code Generation Literature
// ============================================================================

// Helper to create argument
const arg = (claim: string, strength: Argument['strength'], assessment: Argument['yourAssessment']): Argument => ({
  id: generateId(),
  claim,
  strength,
  yourAssessment: assessment,
});

// Helper to create evidence
const evidence = (description: string, type: Evidence['type'], argumentId?: string): Evidence => ({
  id: generateId(),
  description,
  type,
  linkedArgumentId: argumentId || null,
});

export const enhancedSamplePapers: Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'>[] = [
  // -------------------------------------------------------------------------
  // Paper 1: CODEX (Foundational) - OpenAI's code model paper
  // User workflow note: "This is my seed paper - need to read very carefully"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.48550/arXiv.2107.03374',
    title: 'Evaluating Large Language Models Trained on Code',
    authors: [
      { name: 'Mark Chen' },
      { name: 'Jerry Tworek' },
      { name: 'Heewoo Jun' },
      { name: 'Qiming Yuan' },
    ],
    year: 2021,
    journal: 'arXiv preprint',
    volume: null,
    issue: null,
    pages: null,
    abstract: 'We introduce Codex, a GPT language model fine-tuned on publicly available code from GitHub, and study its Python code-writing capabilities. We find that repeated sampling from the model is a surprisingly effective strategy for producing working solutions to difficult prompts.',
    url: 'https://arxiv.org/abs/2107.03374',
    pdfUrl: 'https://arxiv.org/pdf/2107.03374.pdf',
    citationCount: 3500,

    // USER SYNTHESIS - The core value of IdeaGraph
    takeaway: 'Codex achieves 28% pass@1 on HumanEval, but scaling to pass@100 reaches 70%+, suggesting LLMs have code knowledge but struggle with first-attempt correctness.',

    arguments: [
      arg('Fine-tuning on code significantly improves code generation over base GPT-3', 'strong', 'agree'),
      arg('Repeated sampling (pass@k) is more effective than single-shot generation', 'strong', 'agree'),
      arg('Larger models show better code understanding but diminishing returns', 'moderate', 'uncertain'),
      arg('Docstring-to-code is easier than specification-to-code', 'moderate', 'agree'),
    ],

    evidence: [
      evidence('12B Codex achieves 28.81% pass@1, 72.31% pass@100 on HumanEval', 'computational'),
      evidence('Fine-tuned on 159GB of Python code from 54M GitHub repositories', 'computational'),
      evidence('Scaling from 12M to 12B parameters: linear improvement in log-loss', 'computational'),
    ],

    assessment: 'Landmark paper establishing code LLMs as a research area. HumanEval benchmark has issues (limited scope, memorization risk) but provides reproducible baseline.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['codex', 'openai', 'benchmark', 'humaneval', 'foundational'],
    readAt: '2024-01-10T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-10T09:00:00Z',
    semanticScholarId: 'abc123',
  },

  // -------------------------------------------------------------------------
  // Paper 2: HumanEval Benchmark Paper (Methodology)
  // User workflow note: "Need to understand the benchmark my thesis builds on"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.48550/arXiv.2107.03374',
    title: 'HumanEval: Hand-Written Evaluation Set for Functional Correctness',
    authors: [
      { name: 'Mark Chen' },
      { name: 'Jerry Tworek' },
    ],
    year: 2021,
    journal: 'arXiv preprint',
    volume: null,
    issue: null,
    pages: null,
    abstract: 'We introduce HumanEval, a hand-written benchmark for evaluating code generation models. The benchmark consists of 164 programming problems with function signatures and docstrings.',
    url: 'https://arxiv.org/abs/2107.03374',
    pdfUrl: null,
    citationCount: 3500,

    takeaway: 'HumanEval provides a reproducible benchmark for code LLMs but has limited scope (164 problems, mostly simple algorithms) and potential contamination issues.',

    arguments: [
      arg('Functional correctness (pass/fail tests) is better than BLEU for code', 'strong', 'agree'),
      arg('164 hand-written problems cover core programming concepts', 'moderate', 'uncertain'),
      arg('Unit test-based evaluation prevents surface-level gaming', 'strong', 'agree'),
    ],

    evidence: [
      evidence('164 problems with average 7.7 unit tests each', 'computational'),
      evidence('Problems range from string manipulation to tree algorithms', 'computational'),
    ],

    assessment: 'Essential methodology paper. However, 164 problems is too small for robust evaluation, and contamination from training data is a real concern.',
    thesisRole: 'method',
    readingStatus: 'read',
    tags: ['benchmark', 'humaneval', 'evaluation', 'methodology'],
    readAt: '2024-01-11T14:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-11T09:00:00Z',
    semanticScholarId: 'def456',
  },

  // -------------------------------------------------------------------------
  // Paper 3: CodeGen - Alternative Architecture (Salesforce)
  // User workflow note: "How does this compare to Codex? Different approach."
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.48550/arXiv.2203.13474',
    title: 'CodeGen: An Open Large Language Model for Code with Multi-Turn Program Synthesis',
    authors: [
      { name: 'Erik Nijkamp' },
      { name: 'Bo Pang' },
      { name: 'Hiroaki Hayashi' },
      { name: 'Lifu Tu' },
    ],
    year: 2022,
    journal: 'ICLR 2023',
    volume: null,
    issue: null,
    pages: null,
    abstract: 'We introduce CodeGen, a family of large language models for program synthesis. CodeGen is trained on natural language and programming data, and fine-tuned to enable multi-turn program synthesis.',
    url: 'https://arxiv.org/abs/2203.13474',
    pdfUrl: 'https://arxiv.org/pdf/2203.13474.pdf',
    citationCount: 890,

    takeaway: 'CodeGen demonstrates that multi-turn conversation improves code generation by allowing iterative refinement - users can guide the model through complex problems step-by-step.',

    arguments: [
      arg('Multi-turn synthesis outperforms single-turn for complex problems', 'strong', 'agree'),
      arg('Open-source models can compete with proprietary Codex', 'moderate', 'agree'),
      arg('Natural language pretraining transfers to code understanding', 'strong', 'agree'),
    ],

    evidence: [
      evidence('16B CodeGen-Mono achieves 29.3% pass@1 on HumanEval (matches Codex)', 'computational'),
      evidence('Multi-turn synthesis improves pass@1 by 5-10% on complex tasks', 'experimental'),
    ],

    assessment: 'Important for showing multi-turn is beneficial. Open-source nature makes reproducibility possible, unlike Codex.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['codegen', 'salesforce', 'multi-turn', 'open-source'],
    readAt: '2024-01-15T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-15T10:00:00Z',
    semanticScholarId: 'ghi789',
  },

  // -------------------------------------------------------------------------
  // Paper 4: AlphaCode - DeepMind Competition-Level Code
  // User workflow note: "Ambitious claims - need to verify limitations"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1126/science.abq1158',
    title: 'Competition-Level Code Generation with AlphaCode',
    authors: [
      { name: 'Yujia Li' },
      { name: 'David Choi' },
      { name: 'Junyoung Chung' },
    ],
    year: 2022,
    journal: 'Science',
    volume: '378',
    issue: '6624',
    pages: '1092-1097',
    abstract: 'Programming is a powerful and ubiquitous problem-solving tool. Developing systems that can assist programmers or even generate programs independently could have transformative impact. We introduce AlphaCode, a system for code generation that can create novel solutions to competitive programming problems.',
    url: 'https://doi.org/10.1126/science.abq1158',
    pdfUrl: null,
    citationCount: 650,

    takeaway: 'AlphaCode achieves median human performance on Codeforces by generating millions of solutions and filtering, but this brute-force approach reveals LLMs lack genuine algorithmic reasoning.',

    arguments: [
      arg('Massive sampling + filtering can solve complex algorithmic problems', 'strong', 'agree'),
      arg('LLMs can reason about novel algorithmic problems', 'weak', 'disagree'),
      arg('Code generation requires different evaluation than NLP tasks', 'strong', 'agree'),
    ],

    evidence: [
      evidence('Top 54% ranking on Codeforces (median human performance)', 'computational'),
      evidence('Generated ~1 million candidates per problem, filtered to 10', 'computational'),
      evidence('41B parameter model, trained on 715GB of GitHub code', 'computational'),
    ],

    assessment: 'Impressive engineering, but the approach (generate 1M, pick 10) suggests the model does not truly understand algorithms. More evidence for my thesis that LLMs lack deep reasoning.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['alphacode', 'deepmind', 'competition', 'algorithmic', 'limitations'],
    readAt: '2024-01-18T15:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-18T10:00:00Z',
    semanticScholarId: 'jkl012',
  },

  // -------------------------------------------------------------------------
  // Paper 5: StarCoder - BigCode Open Model
  // User workflow note: "Open alternative with better training data story"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.48550/arXiv.2305.06161',
    title: 'StarCoder: may the source be with you!',
    authors: [
      { name: 'Raymond Li' },
      { name: 'Loubna Ben Allal' },
      { name: 'Yangtian Zi' },
    ],
    year: 2023,
    journal: 'arXiv preprint',
    volume: null,
    issue: null,
    pages: null,
    abstract: 'We introduce StarCoder and StarCoderBase: 15.5B parameter models with 8K context length, infilling capabilities, and fast large-batch inference enabled by multi-query attention.',
    url: 'https://arxiv.org/abs/2305.06161',
    pdfUrl: 'https://arxiv.org/pdf/2305.06161.pdf',
    citationCount: 420,

    takeaway: 'StarCoder matches Codex performance with transparent training data (The Stack) and permissive licensing, enabling reproducible research on code LLM limitations.',

    arguments: [
      arg('Transparent training data enables better research on model behavior', 'strong', 'agree'),
      arg('Fill-in-the-middle (FIM) training improves practical usability', 'strong', 'agree'),
      arg('15B parameters is sufficient for strong code generation', 'moderate', 'uncertain'),
    ],

    evidence: [
      evidence('33.6% pass@1 on HumanEval (15.5B model)', 'computational'),
      evidence('Trained on 1T tokens from 80+ programming languages', 'computational'),
      evidence('8K context enables repository-level code understanding', 'computational'),
    ],

    assessment: 'Important for reproducibility. The Stack dataset documentation helps understand what models have and have not seen.',
    thesisRole: 'method',
    readingStatus: 'read',
    tags: ['starcoder', 'bigcode', 'open-source', 'the-stack'],
    readAt: '2024-01-20T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-20T09:00:00Z',
    semanticScholarId: 'mno345',
  },

  // -------------------------------------------------------------------------
  // Paper 6: Code Execution Failures Analysis
  // User workflow note: "This directly addresses my thesis - why do models fail?"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.48550/arXiv.2302.06527',
    title: 'Large Language Models Cannot Self-Correct Reasoning Yet',
    authors: [
      { name: 'Jie Huang' },
      { name: 'Xinyun Chen' },
      { name: 'Swaroop Mishra' },
    ],
    year: 2023,
    journal: 'ICLR 2024',
    volume: null,
    issue: null,
    pages: null,
    abstract: 'We show that without external feedback, large language models cannot self-correct their reasoning. They may even exhibit worse performance due to overcorrection.',
    url: 'https://arxiv.org/abs/2302.06527',
    pdfUrl: 'https://arxiv.org/pdf/2302.06527.pdf',
    citationCount: 380,

    takeaway: 'LLMs cannot reliably detect or fix their own code errors without external signals (tests, execution), challenging claims about emergent self-debugging.',

    arguments: [
      arg('Self-correction without oracle feedback degrades performance', 'strong', 'agree'),
      arg('LLMs lack metacognitive awareness of their reasoning failures', 'strong', 'agree'),
      arg('External verification (tests, execution) is essential for reliability', 'strong', 'agree'),
    ],

    evidence: [
      evidence('Self-correction reduced accuracy by 5-15% on GSM8K and coding tasks', 'computational'),
      evidence('Models confidently "fix" correct solutions, introducing errors', 'computational'),
    ],

    assessment: 'Critical finding for my thesis - execution feedback is not optional but essential. Pure LLM approaches have fundamental limits.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['self-correction', 'limitations', 'reasoning', 'metacognition'],
    readAt: '2024-01-22T14:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-22T10:00:00Z',
    semanticScholarId: 'pqr678',
  },

  // -------------------------------------------------------------------------
  // Paper 7: Security Vulnerabilities in Generated Code
  // User workflow note: "Security angle - critical practical limitation"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1145/3548606.3560656',
    title: 'Do Users Write More Insecure Code with AI Assistants?',
    authors: [
      { name: 'Neil Perry' },
      { name: 'Megha Srivastava' },
      { name: 'Deepak Kumar' },
    ],
    year: 2023,
    journal: 'CCS 2023',
    volume: null,
    issue: null,
    pages: null,
    abstract: 'We conduct a user study examining whether access to an AI-powered code assistant leads users to produce more security vulnerabilities. Our findings suggest that participants with access to AI assistants wrote significantly less secure code.',
    url: 'https://doi.org/10.1145/3548606.3560656',
    pdfUrl: null,
    citationCount: 290,

    takeaway: 'Users with AI code assistants produce MORE security vulnerabilities (40% less secure), likely because they over-trust generated code and skip manual review.',

    arguments: [
      arg('AI assistants increase security vulnerabilities in user code', 'strong', 'agree'),
      arg('Users over-trust AI suggestions and reduce code review', 'strong', 'agree'),
      arg('Training data contains vulnerable code patterns that models reproduce', 'moderate', 'agree'),
    ],

    evidence: [
      evidence('40% more security vulnerabilities in AI-assisted group (n=47)', 'experimental'),
      evidence('Users spent less time reviewing AI suggestions vs manual code', 'experimental'),
      evidence('Common vulnerabilities: SQL injection, hardcoded secrets, path traversal', 'experimental'),
    ],

    assessment: 'Crucial for practical implications. Even if LLMs generate correct code, security issues make deployment risky. Supports need for verification.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['security', 'vulnerabilities', 'user-study', 'human-factors'],
    readAt: '2024-01-25T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-25T10:00:00Z',
    semanticScholarId: 'stu901',
  },

  // -------------------------------------------------------------------------
  // Paper 8: Chain-of-Thought for Code (Potential Solution)
  // User workflow note: "This proposes a solution - does it actually work?"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.48550/arXiv.2211.10435',
    title: 'Program of Thoughts Prompting: Disentangling Computation from Reasoning',
    authors: [
      { name: 'Wenhu Chen' },
      { name: 'Xueguang Ma' },
      { name: 'Xinyi Wang' },
    ],
    year: 2022,
    journal: 'TMLR 2023',
    volume: null,
    issue: null,
    pages: null,
    abstract: 'We propose Program of Thoughts (PoT), which uses the ability of LLMs to generate programs to offload computation to a Python interpreter.',
    url: 'https://arxiv.org/abs/2211.10435',
    pdfUrl: 'https://arxiv.org/pdf/2211.10435.pdf',
    citationCount: 320,

    takeaway: 'Separating reasoning (LLM) from computation (Python executor) improves math/reasoning tasks by 12%, suggesting hybrid LLM+execution architectures overcome pure LLM limits.',

    arguments: [
      arg('LLMs should generate reasoning steps, not compute directly', 'strong', 'agree'),
      arg('External execution handles computation LLMs struggle with', 'strong', 'agree'),
      arg('This approach generalizes to complex programming tasks', 'weak', 'uncertain'),
    ],

    evidence: [
      evidence('12% improvement on GSM8K over chain-of-thought', 'computational'),
      evidence('Execution eliminates arithmetic errors common in pure LLM output', 'computational'),
    ],

    assessment: 'Promising direction that supports hybrid approaches. But GSM8K is math, not general programming - need to verify on code tasks.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['prompting', 'chain-of-thought', 'hybrid', 'execution'],
    readAt: '2024-01-28T16:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-28T10:00:00Z',
    semanticScholarId: 'vwx234',
  },

  // -------------------------------------------------------------------------
  // Paper 9: Retrieval-Augmented Code Generation
  // User workflow note: "RAG for code - addresses knowledge limitation"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.48550/arXiv.2207.05987',
    title: 'DocPrompting: Generating Code by Retrieving Documentation',
    authors: [
      { name: 'Shuyan Zhou' },
      { name: 'Uri Alon' },
      { name: 'Frank F. Xu' },
    ],
    year: 2022,
    journal: 'ICLR 2023',
    volume: null,
    issue: null,
    pages: null,
    abstract: 'We propose DocPrompting, a natural language to code generation approach that explicitly retrieves documentation for unfamiliar libraries.',
    url: 'https://arxiv.org/abs/2207.05987',
    pdfUrl: 'https://arxiv.org/pdf/2207.05987.pdf',
    citationCount: 180,

    takeaway: 'Retrieving relevant documentation at generation time improves code correctness by 15%+, especially for less common libraries not well-represented in training data.',

    arguments: [
      arg('LLMs struggle with libraries they saw rarely in training', 'strong', 'agree'),
      arg('Documentation retrieval provides grounded API knowledge', 'strong', 'agree'),
      arg('Retrieval adds latency but improves reliability', 'moderate', 'agree'),
    ],

    evidence: [
      evidence('15-20% improvement on CoNaLa for rare library calls', 'computational'),
      evidence('DocPrompting outperforms fine-tuning for long-tail APIs', 'computational'),
    ],

    assessment: 'Addresses the "knowledge cutoff" limitation. Shows retrieval can compensate for gaps in training data.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['retrieval', 'rag', 'documentation', 'libraries'],
    readAt: '2024-01-30T10:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-01-30T09:00:00Z',
    semanticScholarId: 'yza567',
  },

  // -------------------------------------------------------------------------
  // Paper 10: GPT-4 Technical Report (Comparison Point)
  // User workflow note: "Latest SOTA - how much have limitations improved?"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.48550/arXiv.2303.08774',
    title: 'GPT-4 Technical Report',
    authors: [
      { name: 'OpenAI' },
    ],
    year: 2023,
    journal: 'arXiv preprint',
    volume: null,
    issue: null,
    pages: null,
    abstract: 'We report the development of GPT-4, a large-scale, multimodal model which can accept image and text inputs and produce text outputs.',
    url: 'https://arxiv.org/abs/2303.08774',
    pdfUrl: 'https://arxiv.org/pdf/2303.08774.pdf',
    citationCount: 4200,

    takeaway: 'GPT-4 achieves 67% pass@1 on HumanEval (vs Codex 28%), showing substantial progress but still failing 1/3 of simple problems, indicating persistent limitations.',

    arguments: [
      arg('Scaling and RLHF significantly improve code generation', 'strong', 'agree'),
      arg('GPT-4 passes advanced exams including coding interviews', 'moderate', 'uncertain'),
      arg('Limitations remain in complex reasoning and algorithmic tasks', 'strong', 'agree'),
    ],

    evidence: [
      evidence('67% pass@1 on HumanEval (0-shot)', 'computational'),
      evidence('Passes Leetcode Hard problems that Codex fails', 'computational'),
    ],

    assessment: 'Impressive improvement but still 33% failure rate on simple benchmarks. Confirms scaling helps but does not solve fundamental issues.',
    thesisRole: 'background',
    readingStatus: 'read',
    tags: ['gpt-4', 'openai', 'sota', 'benchmark'],
    readAt: '2024-02-01T09:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-01T08:00:00Z',
    semanticScholarId: 'bcd890',
  },

  // -------------------------------------------------------------------------
  // Paper 11: Contrastive Paper - LLMs ARE Good Enough
  // User workflow note: "Counterpoint to my thesis - need to address this"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.1145/3597503.3608128',
    title: 'GitHub Copilot AI pair programmer: Asset or Liability?',
    authors: [
      { name: 'Albert Ziegler' },
      { name: 'Eirini Kalliamvakou' },
      { name: 'X. Alice Li' },
    ],
    year: 2023,
    journal: 'FSE 2023',
    volume: null,
    issue: null,
    pages: null,
    abstract: 'We study the productivity impact of GitHub Copilot on professional software developers. Developers using Copilot complete tasks 55% faster on average.',
    url: 'https://doi.org/10.1145/3597503.3608128',
    pdfUrl: null,
    citationCount: 210,

    takeaway: 'Copilot users complete tasks 55% faster and report higher satisfaction, suggesting limitations may be acceptable for practical productivity gains.',

    arguments: [
      arg('LLM code assistants provide meaningful productivity gains', 'strong', 'agree'),
      arg('User satisfaction increases with AI assistance', 'strong', 'agree'),
      arg('Speed improvements outweigh accuracy concerns in practice', 'moderate', 'disagree'),
    ],

    evidence: [
      evidence('55% faster task completion (n=95 developers)', 'experimental'),
      evidence('73% satisfaction rate among Copilot users', 'experimental'),
    ],

    assessment: 'Important counterpoint. Speed gains are real, but study did not measure code quality or bug rates. Need to address this perspective in my review.',
    thesisRole: 'contradicts',
    readingStatus: 'read',
    tags: ['copilot', 'productivity', 'user-study', 'industry'],
    readAt: '2024-02-05T11:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-05T10:00:00Z',
    semanticScholarId: 'efg123',
  },

  // -------------------------------------------------------------------------
  // Paper 12: Code LLM Benchmark Analysis
  // User workflow note: "Meta-analysis of benchmarks - methodological concern"
  // -------------------------------------------------------------------------
  {
    thesisId: '',
    doi: '10.48550/arXiv.2306.15595',
    title: 'Is Your Code Generated by ChatGPT Really Correct? Rigorous Evaluation of Large Language Models for Code Generation',
    authors: [
      { name: 'Jiawei Liu' },
      { name: 'Chunqiu Steven Xia' },
      { name: 'Yuyao Wang' },
    ],
    year: 2023,
    journal: 'NeurIPS 2023',
    volume: null,
    issue: null,
    pages: null,
    abstract: 'We introduce EvalPlus, a rigorous evaluation framework for code generation. We find that existing benchmarks significantly overestimate model performance due to insufficient test cases.',
    url: 'https://arxiv.org/abs/2306.15595',
    pdfUrl: 'https://arxiv.org/pdf/2306.15595.pdf',
    citationCount: 180,

    takeaway: 'Current benchmarks (HumanEval) overestimate code LLM performance by 10-20% due to weak test coverage; real pass rates are much lower with rigorous testing.',

    arguments: [
      arg('HumanEval tests are insufficient to catch many bugs', 'strong', 'agree'),
      arg('Pass rates drop significantly with more rigorous testing', 'strong', 'agree'),
      arg('Benchmarks need continuous evolution to stay meaningful', 'strong', 'agree'),
    ],

    evidence: [
      evidence('GPT-4 drops from 67% to 50% pass rate with EvalPlus tests', 'computational'),
      evidence('Added 80x more test cases to HumanEval', 'computational'),
      evidence('11/164 HumanEval problems have ground-truth bugs', 'computational'),
    ],

    assessment: 'Critical methodological contribution. Reported numbers in literature are likely overoptimistic. Strengthens my thesis about limitations.',
    thesisRole: 'supports',
    readingStatus: 'read',
    tags: ['benchmark', 'evaluation', 'methodology', 'rigor'],
    readAt: '2024-02-08T14:00:00Z',
    source: 'doi',
    rawBibtex: null,
    screeningDecision: 'include',
    exclusionReason: null,
    exclusionNote: null,
    screenedAt: '2024-02-08T10:00:00Z',
    semanticScholarId: 'hij456',
  },
];

// ============================================================================
// SAMPLE CONNECTIONS - Relationships Between Papers
// ============================================================================

export const enhancedSampleConnections: Omit<Connection, 'id' | 'createdAt'>[] = [
  // Foundational relationships
  {
    thesisId: '',
    fromPaperId: '', // HumanEval (Paper 1, idx 1)
    toPaperId: '',   // Codex (Paper 0, idx 0)
    type: 'extends',
    note: 'HumanEval was created as part of the Codex evaluation framework',
    aiSuggested: false,
    aiConfidence: null,
    userApproved: true,
  },
  {
    thesisId: '',
    fromPaperId: '', // CodeGen (Paper 2)
    toPaperId: '',   // Codex (Paper 0)
    type: 'extends',
    note: 'CodeGen builds on Codex architecture but adds multi-turn capability',
    aiSuggested: false,
    aiConfidence: null,
    userApproved: true,
  },
  {
    thesisId: '',
    fromPaperId: '', // AlphaCode (Paper 3)
    toPaperId: '',   // Codex (Paper 0)
    type: 'extends',
    note: 'AlphaCode tackles harder problems but uses similar base architecture',
    aiSuggested: false,
    aiConfidence: null,
    userApproved: true,
  },
  {
    thesisId: '',
    fromPaperId: '', // StarCoder (Paper 4)
    toPaperId: '',   // Codex (Paper 0)
    type: 'extends',
    note: 'StarCoder is an open-source alternative to proprietary Codex',
    aiSuggested: true,
    aiConfidence: 0.92,
    userApproved: true,
  },

  // Limitation evidence connections
  {
    thesisId: '',
    fromPaperId: '', // Self-correction paper (Paper 5)
    toPaperId: '',   // AlphaCode (Paper 3)
    type: 'critiques',
    note: 'Shows that massive sampling approach masks lack of true reasoning',
    aiSuggested: true,
    aiConfidence: 0.78,
    userApproved: true,
  },
  {
    thesisId: '',
    fromPaperId: '', // Security paper (Paper 6)
    toPaperId: '',   // Copilot study (Paper 10)
    type: 'contradicts',
    note: 'Security concerns challenge productivity claims - faster is not always better',
    aiSuggested: true,
    aiConfidence: 0.85,
    userApproved: true,
  },

  // Solution approach connections
  {
    thesisId: '',
    fromPaperId: '', // PoT paper (Paper 7)
    toPaperId: '',   // Self-correction paper (Paper 5)
    type: 'extends',
    note: 'PoT addresses the execution verification gap identified in self-correction paper',
    aiSuggested: false,
    aiConfidence: null,
    userApproved: true,
  },
  {
    thesisId: '',
    fromPaperId: '', // DocPrompting (Paper 8)
    toPaperId: '',   // Codex (Paper 0)
    type: 'extends',
    note: 'DocPrompting addresses knowledge limitations in base models like Codex',
    aiSuggested: false,
    aiConfidence: null,
    userApproved: true,
  },

  // GPT-4 comparisons
  {
    thesisId: '',
    fromPaperId: '', // GPT-4 (Paper 9)
    toPaperId: '',   // Codex (Paper 0)
    type: 'extends',
    note: 'GPT-4 is the successor to Codex with improved code generation',
    aiSuggested: false,
    aiConfidence: null,
    userApproved: true,
  },
  {
    thesisId: '',
    fromPaperId: '', // EvalPlus (Paper 11)
    toPaperId: '',   // HumanEval (Paper 1)
    type: 'critiques',
    note: 'EvalPlus shows HumanEval has insufficient test coverage',
    aiSuggested: false,
    aiConfidence: null,
    userApproved: true,
  },
  {
    thesisId: '',
    fromPaperId: '', // EvalPlus (Paper 11)
    toPaperId: '',   // GPT-4 (Paper 9)
    type: 'critiques',
    note: 'EvalPlus demonstrates that GPT-4 reported numbers are overoptimistic',
    aiSuggested: true,
    aiConfidence: 0.88,
    userApproved: true,
  },

  // Methodological connections
  {
    thesisId: '',
    fromPaperId: '', // StarCoder (Paper 4)
    toPaperId: '',   // HumanEval (Paper 1)
    type: 'uses-method',
    note: 'Uses HumanEval as primary evaluation benchmark',
    aiSuggested: false,
    aiConfidence: null,
    userApproved: true,
  },
];

// ============================================================================
// SYNTHESIS THEMES - Emergent Patterns Across Papers
// ============================================================================

export const enhancedSynthesisThemes: Omit<SynthesisTheme, 'id' | 'createdAt'>[] = [
  {
    thesisId: '',
    name: 'Reasoning vs. Pattern Matching',
    description: 'Papers exploring whether LLMs truly reason about code or just match training patterns',
    color: '#ef4444', // Red
    paperIds: [], // Will be populated: AlphaCode, Self-correction, PoT
    relatedArgumentIds: [], // Arguments about reasoning limitations
  },
  {
    thesisId: '',
    name: 'Verification as a Solution',
    description: 'Papers proposing execution/testing as a way to overcome LLM limitations',
    color: '#22c55e', // Green
    paperIds: [], // Will be populated: PoT, Self-correction, EvalPlus
    relatedArgumentIds: [],
  },
  {
    thesisId: '',
    name: 'Benchmark Validity Concerns',
    description: 'Papers questioning whether current benchmarks accurately measure code generation ability',
    color: '#f59e0b', // Amber
    paperIds: [], // Will be populated: HumanEval, EvalPlus
    relatedArgumentIds: [],
  },
  {
    thesisId: '',
    name: 'Practical vs. Theoretical Limitations',
    description: 'Tension between theoretical limitations and practical productivity gains',
    color: '#8b5cf6', // Purple
    paperIds: [], // Will be populated: Copilot study, Security paper
    relatedArgumentIds: [],
  },
];

// ============================================================================
// RESEARCH GAPS - Identified Holes in the Literature
// ============================================================================

export const enhancedResearchGaps: Omit<ResearchGap, 'id' | 'createdAt'>[] = [
  {
    thesisId: '',
    title: 'Long-term code maintenance impact',
    description: 'No studies examining how LLM-generated code affects long-term maintainability, technical debt, or code evolution over years.',
    type: 'temporal',
    priority: 'high',
    evidenceSource: 'user',
    relatedPaperIds: [], // Copilot study, Security paper
    futureResearchNote: 'Longitudinal study tracking projects using AI assistants over 1-2 years',
  },
  {
    thesisId: '',
    title: 'Non-English programming contexts',
    description: 'Almost all benchmarks and studies use English docstrings/comments. Unknown how LLMs perform with non-English specifications.',
    type: 'population',
    priority: 'medium',
    evidenceSource: 'user',
    relatedPaperIds: [],
    futureResearchNote: 'Multilingual code generation benchmark needed',
  },
  {
    thesisId: '',
    title: 'Contradictory findings on security',
    description: 'Security paper says AI increases vulnerabilities, Copilot study says users are satisfied. No reconciliation of these findings.',
    type: 'contradictory',
    priority: 'high',
    evidenceSource: 'inferred',
    relatedPaperIds: [], // Security paper, Copilot study
    futureResearchNote: 'Study that measures both productivity and security simultaneously',
  },
  {
    thesisId: '',
    title: 'Missing theoretical framework for LLM code understanding',
    description: 'Papers describe WHAT LLMs fail at but not WHY. No cognitive or computational theory explaining fundamental limits.',
    type: 'theoretical',
    priority: 'high',
    evidenceSource: 'user',
    relatedPaperIds: [], // Self-correction, AlphaCode
    futureResearchNote: 'Need theoretical model distinguishing surface pattern matching from semantic code understanding',
  },
];

// ============================================================================
// EVIDENCE SYNTHESES - Cross-Paper Claim Analysis
// ============================================================================

export const enhancedEvidenceSyntheses: Omit<EvidenceSynthesis, 'id' | 'createdAt'>[] = [
  {
    thesisId: '',
    claim: 'LLMs can generate functionally correct code for simple programming tasks',
    supportingPaperIds: [], // Codex, GPT-4, StarCoder, CodeGen
    contradictingPaperIds: [], // EvalPlus (shows lower real pass rates)
    evidenceStrength: 'moderate',
    consensusNote: 'Consensus on HumanEval-level tasks, but disagreement on true pass rates due to benchmark limitations',
  },
  {
    thesisId: '',
    claim: 'LLMs lack genuine algorithmic reasoning capability',
    supportingPaperIds: [], // AlphaCode (needs 1M samples), Self-correction
    contradictingPaperIds: [], // GPT-4 (passes harder problems)
    evidenceStrength: 'conflicting',
    consensusNote: 'Scaling helps but brute-force sampling approach suggests fundamental limits remain',
  },
  {
    thesisId: '',
    claim: 'External verification (execution, tests) is essential for reliable code generation',
    supportingPaperIds: [], // Self-correction, PoT, EvalPlus
    contradictingPaperIds: [],
    evidenceStrength: 'strong',
    consensusNote: 'Strong consensus - pure LLM output cannot be trusted without verification',
  },
];

// ============================================================================
// REVIEW SECTIONS - For Literature Review Structure
// ============================================================================

export const enhancedReviewSections: Omit<ReviewSection, 'id' | 'createdAt'>[] = [
  {
    thesisId: '',
    title: 'Introduction & Background',
    description: 'Foundation of code LLMs and motivation for the review',
    order: 1,
    paperIds: [], // Codex, GPT-4
  },
  {
    thesisId: '',
    title: 'Evaluation Methodology',
    description: 'How code generation is evaluated and benchmark limitations',
    order: 2,
    paperIds: [], // HumanEval, EvalPlus
  },
  {
    thesisId: '',
    title: 'Capability Analysis',
    description: 'What LLMs can and cannot do',
    order: 3,
    paperIds: [], // CodeGen, AlphaCode, StarCoder
  },
  {
    thesisId: '',
    title: 'Fundamental Limitations',
    description: 'Evidence for inherent limitations in LLM code generation',
    order: 4,
    paperIds: [], // Self-correction, Security paper
  },
  {
    thesisId: '',
    title: 'Proposed Solutions',
    description: 'Approaches to overcome limitations',
    order: 5,
    paperIds: [], // PoT, DocPrompting
  },
  {
    thesisId: '',
    title: 'Practical Implications',
    description: 'Real-world adoption and productivity studies',
    order: 6,
    paperIds: [], // Copilot study
  },
];

// ============================================================================
// LOAD FUNCTION - Creates Full IdeaGraph from Sample Data
// ============================================================================

export interface LoadEnhancedSampleResult {
  thesisId: string;
  paperCount: number;
  connectionCount: number;
  themeCount: number;
  gapCount: number;
  sectionCount: number;
}

export function loadEnhancedSampleData(
  createThesis: (thesis: typeof enhancedSampleThesis) => { id: string },
  addPaper: (paper: Omit<Paper, 'id' | 'addedAt' | 'lastAccessedAt'>) => { id: string },
  createConnection: (connection: Omit<Connection, 'id' | 'createdAt'>) => void,
  createTheme?: (theme: Omit<SynthesisTheme, 'id' | 'createdAt'>) => { id: string },
  createGap?: (gap: Omit<ResearchGap, 'id' | 'createdAt'>) => { id: string },
  createSection?: (section: Omit<ReviewSection, 'id' | 'createdAt'>) => { id: string },
  createEvidenceSynthesis?: (synthesis: Omit<EvidenceSynthesis, 'id' | 'createdAt'>) => { id: string }
): LoadEnhancedSampleResult {
  // 1. Create thesis
  const thesis = createThesis(enhancedSampleThesis);
  const thesisId = thesis.id;

  // 2. Create all papers
  const paperIds: string[] = [];
  for (const paperData of enhancedSamplePapers) {
    const paper = addPaper({ ...paperData, thesisId });
    paperIds.push(paper.id);
  }

  // 3. Create connections with correct paper IDs
  // Connection mapping (based on enhancedSampleConnections order):
  const connectionMappings = [
    { from: 1, to: 0 },   // HumanEval -> Codex
    { from: 2, to: 0 },   // CodeGen -> Codex
    { from: 3, to: 0 },   // AlphaCode -> Codex
    { from: 4, to: 0 },   // StarCoder -> Codex
    { from: 5, to: 3 },   // Self-correction -> AlphaCode
    { from: 6, to: 10 },  // Security -> Copilot study
    { from: 7, to: 5 },   // PoT -> Self-correction
    { from: 8, to: 0 },   // DocPrompting -> Codex
    { from: 9, to: 0 },   // GPT-4 -> Codex
    { from: 11, to: 1 },  // EvalPlus -> HumanEval
    { from: 11, to: 9 },  // EvalPlus -> GPT-4
    { from: 4, to: 1 },   // StarCoder -> HumanEval (uses-method)
  ];

  let connectionCount = 0;
  for (let i = 0; i < enhancedSampleConnections.length && i < connectionMappings.length; i++) {
    const mapping = connectionMappings[i];
    const conn = enhancedSampleConnections[i];
    createConnection({
      ...conn,
      thesisId,
      fromPaperId: paperIds[mapping.from],
      toPaperId: paperIds[mapping.to],
    });
    connectionCount++;
  }

  // 4. Create synthesis themes (if function provided)
  let themeCount = 0;
  if (createTheme) {
    const themePaperMappings = [
      [3, 5, 7],    // Reasoning theme: AlphaCode, Self-correction, PoT
      [7, 5, 11],   // Verification theme: PoT, Self-correction, EvalPlus
      [1, 11],      // Benchmark theme: HumanEval, EvalPlus
      [10, 6],      // Practical vs Theoretical: Copilot study, Security
    ];

    for (let i = 0; i < enhancedSynthesisThemes.length; i++) {
      const theme = enhancedSynthesisThemes[i];
      createTheme({
        ...theme,
        thesisId,
        paperIds: themePaperMappings[i]?.map(idx => paperIds[idx]) || [],
      });
      themeCount++;
    }
  }

  // 5. Create research gaps (if function provided)
  let gapCount = 0;
  if (createGap) {
    const gapPaperMappings = [
      [10, 6],      // Long-term maintenance: Copilot, Security
      [],           // Non-English: no papers
      [6, 10],      // Security contradiction: Security, Copilot
      [5, 3],       // Theoretical framework: Self-correction, AlphaCode
    ];

    for (let i = 0; i < enhancedResearchGaps.length; i++) {
      const gap = enhancedResearchGaps[i];
      createGap({
        ...gap,
        thesisId,
        relatedPaperIds: gapPaperMappings[i]?.map(idx => paperIds[idx]) || [],
      });
      gapCount++;
    }
  }

  // 6. Create review sections (if function provided)
  let sectionCount = 0;
  if (createSection) {
    const sectionPaperMappings = [
      [0, 9],       // Intro: Codex, GPT-4
      [1, 11],      // Methodology: HumanEval, EvalPlus
      [2, 3, 4],    // Capability: CodeGen, AlphaCode, StarCoder
      [5, 6],       // Limitations: Self-correction, Security
      [7, 8],       // Solutions: PoT, DocPrompting
      [10],         // Practical: Copilot study
    ];

    for (let i = 0; i < enhancedReviewSections.length; i++) {
      const section = enhancedReviewSections[i];
      createSection({
        ...section,
        thesisId,
        paperIds: sectionPaperMappings[i]?.map(idx => paperIds[idx]) || [],
      });
      sectionCount++;
    }
  }

  // 7. Create evidence syntheses (if function provided)
  if (createEvidenceSynthesis) {
    const synthesisMappings = [
      { supporting: [0, 9, 4, 2], contradicting: [11] },  // Correct code claim
      { supporting: [3, 5], contradicting: [9] },         // Reasoning claim
      { supporting: [5, 7, 11], contradicting: [] },      // Verification claim
    ];

    for (let i = 0; i < enhancedEvidenceSyntheses.length; i++) {
      const synthesis = enhancedEvidenceSyntheses[i];
      const mapping = synthesisMappings[i];
      createEvidenceSynthesis({
        ...synthesis,
        thesisId,
        supportingPaperIds: mapping.supporting.map(idx => paperIds[idx]),
        contradictingPaperIds: mapping.contradicting.map(idx => paperIds[idx]),
      });
    }
  }

  return {
    thesisId,
    paperCount: paperIds.length,
    connectionCount,
    themeCount,
    gapCount,
    sectionCount,
  };
}

// ============================================================================
// SUMMARY OF WORKFLOW INSIGHTS
// ============================================================================

export const workflowSummary = {
  totalPapers: 12,
  totalConnections: 12,
  avgTimePerPaper: '30-45 minutes',
  totalEstimatedTime: '8-12 hours',

  keyDifficulties: [
    'Writing concise, meaningful takeaways (not just copying abstract)',
    'Deciding connection types and directions',
    'Maintaining consistency as collection grows',
    'Identifying what is MISSING (gaps) vs. what is present',
    'Balancing thoroughness with time constraints',
    'Revisiting old papers when new knowledge changes understanding',
  ],

  topFeatureRequests: [
    'AI-assisted takeaway suggestions (editable, not auto-saved)',
    'Side-by-side paper comparison for creating connections',
    'Automatic duplicate/similar paper detection',
    'Quick keyboard shortcuts for screening workflow',
    'Version history for evolving understanding',
    'Export as structured literature review sections',
    'Visual theme clustering on graph',
    'Gap detection from argument analysis',
  ],

  workflowPatterns: [
    'Start with 1-2 seed papers, then snowball via citations',
    'Screen in batches (10-20 papers at a time)',
    'Read foundational papers carefully, skim derivative papers',
    'Create connections immediately after reading second paper',
    'Review and refine themes after ~10 papers',
    'Identify gaps only after building substantial collection',
    'Export and write review sections iteratively, not at end',
  ],
};
