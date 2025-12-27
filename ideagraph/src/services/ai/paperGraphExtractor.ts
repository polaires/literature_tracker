// Paper IdeaGraph Extraction Orchestrator
// Coordinates the 3-stage AI pipeline for knowledge extraction

import { createClaudeProvider } from './providers/claude';
import { getEffectiveAPIConfig } from './config';
import type { CompletionOptions } from './types';
import type {
  PaperIdeaGraph,
  PaperClassification,
  ExtractedFinding,
  ExtractedDataTable,
  IntraPaperConnection,
  PotentialCrossPaperConnection,
  ExtractionProgress,
} from '../../types/paperGraph';
import {
  createEmptyPaperIdeaGraph,
  createQuoteReference,
} from '../../types/paperGraph';

// Prompts
import {
  CLASSIFICATION_SYSTEM_PROMPT,
  buildClassificationPrompt,
  parseClassificationResponse,
  estimatePageCount,
  estimateWordCount,
  getExtractionSystemPrompt,
  buildExtractionPrompt,
  parseExtractionResponse,
  parseReviewExtractionResponse,
  THESIS_INTEGRATION_SYSTEM_PROMPT,
  buildThesisIntegrationPrompt,
  parseThesisIntegrationResponse,
} from './prompts/ideaGraphExtraction';

import type {
  PaperExtractionContext,
  ThesisIntegrationContext,
  ExtractedFindingRaw,
} from './prompts/ideaGraphExtraction';

// =============================================================================
// Types
// =============================================================================

export interface ExtractionOptions {
  // API configuration
  apiKey?: string;
  apiBaseUrl?: string;
  customModelName?: string;

  // Extraction options
  skipClassification?: boolean; // Use provided classification
  skipThesisIntegration?: boolean; // Skip Stage 3
  providedClassification?: PaperClassification;

  // Callbacks
  onProgress?: (progress: ExtractionProgress) => void;
  onStageComplete?: (stage: 1 | 2 | 3, data: unknown) => void;
}

export interface ExtractionResult {
  success: boolean;
  graph?: PaperIdeaGraph;
  error?: string;
  tokensUsed: {
    stage1: { input: number; output: number };
    stage2: { input: number; output: number };
    stage3: { input: number; output: number };
  };
}

export interface PaperInput {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  journal: string | null;
  abstract: string | null;
  pdfText: string;
}

export interface ThesisInput {
  id: string;
  title: string;
  description: string;
}

export interface ExistingPaperInput {
  id: string;
  title: string;
  takeaway: string;
  thesisRole: string;
  year: number | null;
}

// =============================================================================
// Paper Graph Extractor Service
// =============================================================================

export class PaperGraphExtractor {
  private provider: ReturnType<typeof createClaudeProvider>;
  private abortController: AbortController | null = null;

  constructor(
    apiKey?: string,
    apiBaseUrl?: string,
    customModelName?: string
  ) {
    // Get effective API config (user config or defaults)
    const effectiveConfig = getEffectiveAPIConfig(
      apiKey ?? null,
      apiBaseUrl ?? null,
      customModelName ?? null
    );

    this.provider = createClaudeProvider(
      effectiveConfig.apiKey,
      'standard',
      effectiveConfig.baseUrl,
      effectiveConfig.modelName
    );
  }

  /**
   * Cancel an ongoing extraction
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Extract knowledge graph from a paper
   */
  async extract(
    paper: PaperInput,
    thesis: ThesisInput | null,
    existingPapers: ExistingPaperInput[],
    options: ExtractionOptions = {}
  ): Promise<ExtractionResult> {
    this.abortController = new AbortController();

    const tokensUsed = {
      stage1: { input: 0, output: 0 },
      stage2: { input: 0, output: 0 },
      stage3: { input: 0, output: 0 },
    };

    try {
      // Create initial graph
      const graph = createEmptyPaperIdeaGraph(paper.id);
      graph.extractionStatus = 'extracting';

      // Prepare context
      const paperContext: PaperExtractionContext = {
        paper: {
          title: paper.title,
          authors: paper.authors.join(', '),
          year: paper.year,
          journal: paper.journal,
          abstract: paper.abstract,
          pdfText: paper.pdfText,
        },
        pageCount: estimatePageCount(paper.pdfText),
        wordCount: estimateWordCount(paper.pdfText),
      };

      // =====================
      // Stage 1: Classification
      // =====================
      let classification: PaperClassification;

      if (options.skipClassification && options.providedClassification) {
        classification = options.providedClassification;
      } else {
        this.reportProgress(options.onProgress, {
          paperId: paper.id,
          currentStage: 1,
          stageDescription: 'Classifying paper type...',
          overallProgress: 10,
          canCancel: true,
        });

        classification = await this.runClassification(paperContext, tokensUsed);
      }

      graph.classification = classification;
      graph.paperType = classification.paperType;

      options.onStageComplete?.(1, classification);

      // Check for cancellation
      if (this.abortController.signal.aborted) {
        throw new Error('Extraction cancelled');
      }

      // =====================
      // Stage 2: Deep Extraction
      // =====================
      this.reportProgress(options.onProgress, {
        paperId: paper.id,
        currentStage: 2,
        stageDescription: 'Extracting findings...',
        overallProgress: 30,
        canCancel: true,
      });

      const extractionResult = await this.runExtraction(
        paperContext,
        classification,
        tokensUsed
      );

      // Convert raw findings to full findings with IDs
      graph.findings = this.convertFindings(extractionResult.findings, paper.id);
      graph.dataTables = this.convertDataTables(extractionResult.dataTables, paper.id, graph.findings);
      graph.intraPaperConnections = this.convertIntraPaperConnections(
        extractionResult.intraPaperConnections,
        graph.findings
      );
      graph.experimentalSystem = extractionResult.experimentalSystem;
      graph.keyContributions = extractionResult.keyContributions;
      graph.limitations = extractionResult.limitations;
      graph.openQuestions = extractionResult.openQuestions;
      graph.potentialConnections = this.convertPotentialConnections(
        extractionResult.potentialConnections,
        graph.findings
      );

      // Handle review paper extraction
      if (classification.paperType === 'review' && 'reviewSpecific' in extractionResult) {
        const reviewResult = extractionResult as ReturnType<typeof parseReviewExtractionResponse>;
        graph.reviewExtraction = {
          synthesisThemes: reviewResult.reviewSpecific.synthesisThemes.map((t) => ({
            id: crypto.randomUUID(),
            ...t,
          })),
          identifiedGaps: reviewResult.reviewSpecific.identifiedGaps.map((g) => ({
            id: crypto.randomUUID(),
            ...g,
          })),
          futureDirections: reviewResult.reviewSpecific.futureDirections,
          chronologicalTrends: reviewResult.reviewSpecific.chronologicalTrends,
        };
      }

      options.onStageComplete?.(2, extractionResult);

      // Check for cancellation
      if (this.abortController.signal.aborted) {
        throw new Error('Extraction cancelled');
      }

      // =====================
      // Stage 3: Thesis Integration (optional)
      // =====================
      if (thesis && !options.skipThesisIntegration) {
        this.reportProgress(options.onProgress, {
          paperId: paper.id,
          currentStage: 3,
          stageDescription: 'Integrating with thesis...',
          overallProgress: 70,
          canCancel: true,
        });

        const integrationContext: ThesisIntegrationContext = {
          thesis: {
            id: thesis.id,
            title: thesis.title,
            description: thesis.description,
          },
          existingPapers: existingPapers.map(p => ({
            id: p.id,
            title: p.title,
            takeaway: p.takeaway,
            thesisRole: p.thesisRole,
            year: p.year,
          })),
          extractedFindings: extractionResult.findings,
        };

        const integrationResult = await this.runThesisIntegration(
          integrationContext,
          existingPapers.map(p => p.id),
          tokensUsed
        );

        // Apply thesis relevance to graph
        graph.thesisRelevance = {
          overallScore: integrationResult.overallRelevance.score,
          suggestedRole: integrationResult.suggestedRole.role,
          roleConfidence: integrationResult.suggestedRole.confidence,
          reasoning: integrationResult.overallRelevance.reasoning,
          thesisFramedTakeaway: integrationResult.thesisFramedTakeaway,
          alternativeTakeaways: integrationResult.alternativeTakeaways,
        };

        // Apply finding-level relevance
        for (const fr of integrationResult.findingRelevance) {
          if (fr.findingIndex < graph.findings.length) {
            graph.findings[fr.findingIndex].thesisRelevance = {
              score: fr.relevanceScore,
              dimension: fr.thesisDimension,
              reasoning: fr.reasoning,
            };
          }
        }

        options.onStageComplete?.(3, integrationResult);
      }

      // Finalize
      graph.extractionStatus = 'completed';
      graph.tokensUsed = tokensUsed;

      this.reportProgress(options.onProgress, {
        paperId: paper.id,
        currentStage: 3,
        stageDescription: 'Extraction complete',
        overallProgress: 100,
        canCancel: false,
      });

      return {
        success: true,
        graph,
        tokensUsed,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        error: errorMessage,
        tokensUsed,
      };
    } finally {
      this.abortController = null;
    }
  }

  // =============================================================================
  // Stage Runners
  // =============================================================================

  private async runClassification(
    context: PaperExtractionContext,
    tokensUsed: ExtractionResult['tokensUsed']
  ): Promise<PaperClassification> {
    const prompt = buildClassificationPrompt(context);
    const options: CompletionOptions = {
      systemPrompt: CLASSIFICATION_SYSTEM_PROMPT,
      maxTokens: 1024,
      temperature: 0.2, // Low temperature for classification
      signal: this.abortController?.signal,
    };

    try {
      const { data, completion } = await this.provider.completeJSON<Record<string, unknown>>(prompt, options);

      tokensUsed.stage1 = {
        input: completion.tokensUsed.input,
        output: completion.tokensUsed.output,
      };

      return parseClassificationResponse(data);
    } catch (error) {
      // Enhance error message for classification stage
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Stage 1 (Classification) failed: ${message}`);
    }
  }

  private async runExtraction(
    context: PaperExtractionContext,
    classification: PaperClassification,
    tokensUsed: ExtractionResult['tokensUsed']
  ): Promise<ReturnType<typeof parseExtractionResponse>> {
    const systemPrompt = getExtractionSystemPrompt(classification.paperType);
    const prompt = buildExtractionPrompt(context, classification);

    const options: CompletionOptions = {
      systemPrompt,
      maxTokens: 4096,
      temperature: 0.3,
      signal: this.abortController?.signal,
    };

    try {
      const { data, completion } = await this.provider.completeJSON<Record<string, unknown>>(prompt, options);

      tokensUsed.stage2 = {
        input: completion.tokensUsed.input,
        output: completion.tokensUsed.output,
      };

      // Use review-specific parser for review papers
      if (classification.paperType === 'review') {
        return parseReviewExtractionResponse(data, context.paper.title);
      }

      return parseExtractionResponse(data, context.paper.title);
    } catch (error) {
      // Enhance error message for extraction stage
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Stage 2 (Extraction) failed: ${message}`);
    }
  }

  private async runThesisIntegration(
    context: ThesisIntegrationContext,
    existingPaperIds: string[],
    tokensUsed: ExtractionResult['tokensUsed']
  ): Promise<ReturnType<typeof parseThesisIntegrationResponse>> {
    const prompt = buildThesisIntegrationPrompt(context);
    const options: CompletionOptions = {
      systemPrompt: THESIS_INTEGRATION_SYSTEM_PROMPT,
      maxTokens: 2048,
      temperature: 0.3,
      signal: this.abortController?.signal,
    };

    try {
      const { data, completion } = await this.provider.completeJSON<Record<string, unknown>>(prompt, options);

      tokensUsed.stage3 = {
        input: completion.tokensUsed.input,
        output: completion.tokensUsed.output,
      };

      return parseThesisIntegrationResponse(data, existingPaperIds);
    } catch (error) {
      // Enhance error message for thesis integration stage
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Stage 3 (Thesis Integration) failed: ${message}`);
    }
  }

  // =============================================================================
  // Converters (Raw AI output → Full types with IDs)
  // =============================================================================

  private convertFindings(
    rawFindings: ExtractedFindingRaw[],
    paperId: string
  ): ExtractedFinding[] {
    return rawFindings.map((raw, index) => ({
      id: crypto.randomUUID(),
      paperId,
      title: raw.title,
      description: raw.description,
      findingType: raw.findingType,
      pageNumbers: raw.pageNumbers,
      sectionName: raw.sectionName,
      directQuotes: raw.directQuotes.map((q) =>
        createQuoteReference(q.text, q.pageNumber, raw.sectionName)
      ),
      confidence: raw.confidence,
      userVerified: false,
      userEdited: false,
      order: index,
    }));
  }

  private convertDataTables(
    rawTables: ReturnType<typeof parseExtractionResponse>['dataTables'],
    paperId: string,
    findings: ExtractedFinding[]
  ): ExtractedDataTable[] {
    return rawTables.map((raw) => ({
      id: crypto.randomUUID(),
      paperId,
      name: raw.name,
      description: raw.description,
      pageReference: raw.pageReference,
      columns: raw.columns.map((c) => ({
        id: crypto.randomUUID(),
        name: c.name,
        unit: c.unit,
      })),
      rows: raw.rows.map((r) => ({
        id: crypto.randomUUID(),
        label: r.label,
        values: r.values,
      })),
      extractionConfidence: raw.confidence,
      userVerified: false,
      userEdited: false,
      linkedFindingIds: raw.linkedFindingIndices
        .filter((i) => i < findings.length)
        .map((i) => findings[i].id),
    }));
  }

  private convertIntraPaperConnections(
    rawConnections: ReturnType<typeof parseExtractionResponse>['intraPaperConnections'],
    findings: ExtractedFinding[]
  ): IntraPaperConnection[] {
    return rawConnections
      .filter((raw) =>
        raw.fromFindingIndex < findings.length &&
        raw.toFindingIndex < findings.length
      )
      .map((raw) => ({
        id: crypto.randomUUID(),
        fromFindingId: findings[raw.fromFindingIndex].id,
        toFindingId: findings[raw.toFindingIndex].id,
        connectionType: raw.connectionType,
        explanation: raw.explanation,
        isExplicit: raw.isExplicit,
      }));
  }

  private convertPotentialConnections(
    rawConnections: ReturnType<typeof parseExtractionResponse>['potentialConnections'],
    findings: ExtractedFinding[]
  ): PotentialCrossPaperConnection[] {
    return rawConnections
      .filter((raw) => raw.findingIndex < findings.length)
      .map((raw) => ({
        id: crypto.randomUUID(),
        findingId: findings[raw.findingIndex].id,
        suggestedConnectionType: raw.suggestedConnectionType,
        targetDescription: raw.targetDescription,
        keywords: raw.keywords,
        reasoning: raw.reasoning,
      }));
  }

  // =============================================================================
  // Helpers
  // =============================================================================

  private reportProgress(
    callback: ExtractionOptions['onProgress'],
    progress: ExtractionProgress
  ): void {
    if (callback) {
      callback(progress);
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a PaperGraphExtractor with default or custom API configuration
 */
export function createPaperGraphExtractor(
  apiKey?: string,
  apiBaseUrl?: string,
  customModelName?: string
): PaperGraphExtractor {
  return new PaperGraphExtractor(apiKey, apiBaseUrl, customModelName);
}
