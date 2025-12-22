// Plan-Based Gap Analysis
// Uses two-step generation (LitLLM pattern) to reduce hallucinations
// Step 1: Generate analysis plan with specific citations
// Step 2: Execute plan to produce grounded gap suggestions

import { getSuggestionManager, AI_MODELS, type AISettings } from '../index';
import type { GapSuggestion } from '../types';
import type { Thesis, Paper, Connection } from '../../../types';
import { parseGapSuggestions } from '../prompts/gap';

/**
 * Analysis plan generated in step 1
 */
export interface GapAnalysisPlan {
  id: string;
  thesisId: string;
  observations: PlanObservation[];
  proposedGaps: ProposedGap[];
  createdAt: string;
}

/**
 * Observation from the collection analysis
 */
export interface PlanObservation {
  category: 'coverage' | 'methodology' | 'temporal' | 'contradiction' | 'thesis-alignment';
  finding: string;
  supportingPapers: string[]; // Paper IDs that support this observation
  confidence: number;
}

/**
 * Gap proposed in the plan (needs verification in step 2)
 */
export interface ProposedGap {
  type: GapSuggestion['type'];
  hypothesis: string; // What we think the gap is
  evidence: string[]; // Specific quotes/data from papers
  papersCited: string[]; // Paper IDs cited as evidence
  needsVerification: boolean;
}

/**
 * System prompt for step 1: Planning
 */
const PLAN_SYSTEM_PROMPT = `You are an expert research methodology consultant. Your task is to ANALYZE a literature collection and create a detailed PLAN for gap identification.

CRITICAL RULES:
1. ONLY cite papers that are present in the provided collection
2. EVERY observation must reference specific paper IDs
3. Do NOT invent or assume papers exist
4. Be conservative - only flag gaps you can directly support with evidence

Your plan will be verified in a second step, so be precise and cite your sources.`;

/**
 * System prompt for step 2: Verification
 */
const VERIFY_SYSTEM_PROMPT = `You are a critical reviewer verifying gap analysis. Your role is to:
1. Check that each proposed gap is actually supported by the cited evidence
2. Remove gaps that are based on speculation or invented citations
3. Refine gap descriptions to be more precise
4. Only output gaps that are strongly grounded in the actual collection

Be ruthlessly honest - reject gaps that aren't clearly supported.`;

/**
 * Plan-Based Gap Analysis Service
 * Two-step approach to reduce hallucinations
 */
export class PlanBasedGapAnalyzer {
  private settings: AISettings;

  constructor(settings: AISettings) {
    this.settings = settings;
  }

  updateSettings(settings: AISettings): void {
    this.settings = settings;
  }

  /**
   * Step 1: Generate analysis plan with citations
   */
  async generatePlan(params: {
    thesis: Thesis;
    papers: Paper[];
    connections: Connection[];
  }): Promise<GapAnalysisPlan> {
    const { thesis, papers, connections } = params;

    const manager = getSuggestionManager(this.settings);
    if (!manager.isAvailable()) {
      return {
        id: `plan-${Date.now()}`,
        thesisId: thesis.id,
        observations: [],
        proposedGaps: [],
        createdAt: new Date().toISOString(),
      };
    }

    // Build detailed paper index
    const paperIndex = papers.map(p => `
[${p.id}] "${p.title}" (${p.year || 'n.d.'})
  Role: ${p.thesisRole}
  Takeaway: "${p.takeaway}"
  ${p.arguments.length > 0 ? `Arguments: ${p.arguments.map(a => a.claim).join('; ')}` : ''}
  ${p.evidence.length > 0 ? `Evidence types: ${p.evidence.map(e => e.type).join(', ')}` : ''}`
    ).join('\n');

    // Build connection summary
    const connectionSummary = connections.length > 0
      ? connections.map(c => `- ${c.type}: [${c.fromPaperId}] → [${c.toPaperId}]`).join('\n')
      : 'No connections recorded';

    const planPrompt = `THESIS TO ANALYZE:
"${thesis.title}"
${thesis.description}

COMPLETE PAPER INDEX (${papers.length} papers):
${paperIndex}

CONNECTIONS BETWEEN PAPERS:
${connectionSummary}

---

Create an ANALYSIS PLAN by:

1. OBSERVATIONS: List 3-5 key observations about this collection
   - Each observation MUST cite specific paper IDs
   - Categories: coverage, methodology, temporal, contradiction, thesis-alignment

2. PROPOSED GAPS: Based on observations, propose potential gaps
   - Each gap MUST cite the paper IDs that reveal this gap
   - Include specific quotes or data as evidence

Return JSON:
{
  "observations": [
    {
      "category": "coverage" | "methodology" | "temporal" | "contradiction" | "thesis-alignment",
      "finding": "Specific observation...",
      "supportingPapers": ["paper-id-1", "paper-id-2"],
      "confidence": 0.0-1.0
    }
  ],
  "proposedGaps": [
    {
      "type": "knowledge" | "methodological" | "temporal" | "theoretical" | "population" | "geographic" | "contradictory",
      "hypothesis": "What we think is missing...",
      "evidence": ["Specific quote or data point from paper X", "Another piece of evidence from paper Y"],
      "papersCited": ["paper-id-1", "paper-id-2"],
      "needsVerification": true
    }
  ]
}

Remember: ONLY cite papers from the provided index. Do not invent papers.`;

    try {
      const provider = manager['provider'];
      const { data } = await provider.completeJSON<{
        observations: Array<{
          category: string;
          finding: string;
          supportingPapers: string[];
          confidence: number;
        }>;
        proposedGaps: Array<{
          type: string;
          hypothesis: string;
          evidence: string[];
          papersCited: string[];
          needsVerification?: boolean;
        }>;
      }>(planPrompt, {
        systemPrompt: PLAN_SYSTEM_PROMPT,
        maxTokens: AI_MODELS.advanced.maxTokens,
        temperature: 0.3, // Lower for more factual output
      });

      // Validate paper IDs exist
      const validPaperIds = new Set(papers.map(p => p.id));

      const observations: PlanObservation[] = data.observations
        .filter(o => o.supportingPapers.some(id => validPaperIds.has(id)))
        .map(o => ({
          category: validateCategory(o.category),
          finding: o.finding,
          supportingPapers: o.supportingPapers.filter(id => validPaperIds.has(id)),
          confidence: Math.max(0, Math.min(1, o.confidence)),
        }));

      const proposedGaps: ProposedGap[] = data.proposedGaps
        .filter(g => g.papersCited.some(id => validPaperIds.has(id)))
        .map(g => ({
          type: validateGapType(g.type),
          hypothesis: g.hypothesis,
          evidence: g.evidence,
          papersCited: g.papersCited.filter(id => validPaperIds.has(id)),
          needsVerification: g.needsVerification ?? true,
        }));

      return {
        id: `plan-${Date.now()}`,
        thesisId: thesis.id,
        observations,
        proposedGaps,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[PlanBasedGapAnalyzer] Plan generation failed:', error);
      return {
        id: `plan-${Date.now()}`,
        thesisId: thesis.id,
        observations: [],
        proposedGaps: [],
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Step 2: Verify and refine gaps from plan
   */
  async verifyAndRefine(params: {
    thesis: Thesis;
    papers: Paper[];
    plan: GapAnalysisPlan;
  }): Promise<GapSuggestion[]> {
    const { thesis, papers, plan } = params;

    if (plan.proposedGaps.length === 0) {
      return [];
    }

    const manager = getSuggestionManager(this.settings);
    if (!manager.isAvailable()) {
      // Convert proposed gaps to suggestions without verification
      return plan.proposedGaps.map((g, i) => ({
        id: `gap-${Date.now()}-${i}`,
        thesisId: thesis.id,
        type: g.type,
        title: g.hypothesis.substring(0, 50),
        description: g.hypothesis,
        priority: 'medium' as const,
        confidence: 0.5,
        relatedPaperIds: g.papersCited,
        futureResearchQuestion: '',
        evidenceSource: 'ai-inferred' as const,
        createdAt: new Date().toISOString(),
      }));
    }

    // Build paper lookup for verification
    const paperMap = new Map(papers.map(p => [p.id, p]));

    // Format proposed gaps with their evidence
    const gapsToVerify = plan.proposedGaps.map((g, i) => {
      const citedPapers = g.papersCited
        .map(id => paperMap.get(id))
        .filter(Boolean)
        .map(p => `"${p!.title}": ${p!.takeaway}`)
        .join('\n      ');

      return `
Gap ${i + 1}:
  Type: ${g.type}
  Hypothesis: ${g.hypothesis}
  Evidence cited:
    ${g.evidence.join('\n    ')}
  Papers cited:
    ${citedPapers}`;
    }).join('\n');

    const verifyPrompt = `THESIS: "${thesis.title}"
${thesis.description}

PROPOSED GAPS TO VERIFY:
${gapsToVerify}

For each proposed gap, verify:
1. Is the hypothesis actually supported by the cited papers?
2. Does the evidence accurately reflect what those papers say?
3. Is this a real gap or speculation?

Return only VERIFIED gaps as JSON:
[
  {
    "type": "knowledge" | "methodological" | "temporal" | "theoretical" | "population" | "geographic" | "contradictory",
    "title": "Short descriptive title (5-10 words)",
    "description": "2-3 sentences, grounded in evidence",
    "priority": "high" | "medium" | "low",
    "confidence": 0.0-1.0,
    "relatedPaperIds": ["verified paper IDs only"],
    "futureResearchQuestion": "Specific question to address this gap"
  }
]

REJECT gaps that:
- Are based on speculation
- Cite evidence that doesn't support the hypothesis
- Are outside the thesis scope

Return empty array [] if no gaps pass verification.`;

    try {
      const provider = manager['provider'];
      const { data } = await provider.completeJSON<unknown[]>(verifyPrompt, {
        systemPrompt: VERIFY_SYSTEM_PROMPT,
        maxTokens: AI_MODELS.standard.maxTokens,
        temperature: 0.2, // Very low for conservative verification
      });

      return parseGapSuggestions(data, thesis.id);
    } catch (error) {
      console.error('[PlanBasedGapAnalyzer] Verification failed:', error);
      return [];
    }
  }

  /**
   * Full two-step gap analysis
   */
  async analyze(params: {
    thesis: Thesis;
    papers: Paper[];
    connections: Connection[];
    onProgress?: (step: string, progress: number) => void;
  }): Promise<{
    plan: GapAnalysisPlan;
    gaps: GapSuggestion[];
  }> {
    const { thesis, papers, connections, onProgress } = params;

    // Step 1: Generate plan
    onProgress?.('Analyzing collection...', 0.3);
    const plan = await this.generatePlan({ thesis, papers, connections });

    console.log('[PlanBasedGapAnalyzer] Plan generated:', {
      observations: plan.observations.length,
      proposedGaps: plan.proposedGaps.length,
    });

    // Step 2: Verify and refine
    onProgress?.('Verifying gaps...', 0.7);
    const gaps = await this.verifyAndRefine({ thesis, papers, plan });

    console.log('[PlanBasedGapAnalyzer] Verified gaps:', gaps.length);

    onProgress?.('Complete', 1.0);
    return { plan, gaps };
  }
}

// Helpers
function validateCategory(value: unknown): PlanObservation['category'] {
  const valid = ['coverage', 'methodology', 'temporal', 'contradiction', 'thesis-alignment'];
  if (typeof value === 'string' && valid.includes(value)) {
    return value as PlanObservation['category'];
  }
  return 'coverage';
}

function validateGapType(value: unknown): GapSuggestion['type'] {
  const valid = ['knowledge', 'methodological', 'population', 'theoretical', 'temporal', 'geographic', 'contradictory'];
  if (typeof value === 'string' && valid.includes(value)) {
    return value as GapSuggestion['type'];
  }
  return 'knowledge';
}

// Singleton
let analyzerInstance: PlanBasedGapAnalyzer | null = null;

/**
 * Get or create plan-based gap analyzer
 */
export function getPlanBasedGapAnalyzer(settings: AISettings): PlanBasedGapAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new PlanBasedGapAnalyzer(settings);
  } else {
    analyzerInstance.updateSettings(settings);
  }
  return analyzerInstance;
}
