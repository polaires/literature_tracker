// Claude AI Provider (Anthropic API)
// Uses direct fetch calls instead of SDK to avoid bundle size issues in browser
// Supports both official Anthropic API and third-party providers (e.g., OneAPI)
// Also supports OpenAI-compatible API format for third-party providers

import { BaseAIProvider } from './base';
import type { CompletionOptions, CompletionResult, AIModelConfig } from '../types';
import { AI_MODELS } from '../types';

// Default to official Anthropic API
const DEFAULT_ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// ============================================
// Anthropic/Claude API Types
// ============================================

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
  system?: string;
  temperature?: number;
  stop_sequences?: string[];
}

interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// ClaudeErrorResponse - used for documentation, error parsing uses generic JSON

// ============================================
// OpenAI-Compatible API Types
// ============================================

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  stop?: string[];
}

interface OpenAIResponse {
  id: string;
  object: 'chat.completion';
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter' | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// OpenAIErrorResponse - used for documentation, error parsing uses generic JSON

export class ClaudeProvider extends BaseAIProvider {
  name = 'Claude';
  private defaultModel: AIModelConfig;
  private baseUrl: string;
  private customModelName: string | null = null;

  constructor(
    apiKey?: string,
    modelTier: 'fast' | 'standard' | 'advanced' = 'standard',
    baseUrl?: string,
    customModelName?: string
  ) {
    super();
    if (apiKey) {
      this.apiKey = apiKey;
    }
    this.defaultModel = AI_MODELS[modelTier];
    // Support custom API endpoints (e.g., OneAPI, proxy services)
    this.baseUrl = baseUrl || DEFAULT_ANTHROPIC_API_URL;
    // Support custom model names for third-party providers
    this.customModelName = customModelName || null;
  }

  /**
   * Set custom API base URL for third-party providers
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Set custom model name for third-party providers
   */
  setCustomModelName(name: string | null): void {
    this.customModelName = name;
  }

  /**
   * Get the model name to use (custom or default)
   */
  getModelName(): string {
    return this.customModelName || this.defaultModel.model;
  }

  isConfigured(): boolean {
    // Accept any API key that starts with 'sk-' (official or third-party)
    return !!this.apiKey && this.apiKey.startsWith('sk-');
  }

  /**
   * Set the model tier (fast/standard/advanced)
   */
  setModelTier(tier: 'fast' | 'standard' | 'advanced'): void {
    this.defaultModel = AI_MODELS[tier];
  }

  /**
   * Detect if using OpenAI-compatible API format
   * OpenAI format uses /chat/completions endpoint
   * Anthropic format uses /messages endpoint
   */
  private isOpenAIFormat(): boolean {
    return this.baseUrl.includes('/chat/completions') ||
           this.baseUrl.includes('openai.com') ||
           // Assume OpenAI format for unknown third-party APIs unless they use /messages
           (!this.baseUrl.includes('anthropic.com') && !this.baseUrl.includes('/messages'));
  }

  /**
   * Complete a prompt using Claude API (supports both Anthropic and OpenAI formats)
   */
  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    if (!this.isConfigured()) {
      throw this.createError(
        'NOT_CONFIGURED',
        'API key is not configured. Please add your API key in Settings.',
        false
      );
    }

    const startTime = Date.now();

    // Use custom model name if set, otherwise use default
    const modelName = this.getModelName();

    // Detect API format
    const useOpenAIFormat = this.isOpenAIFormat();
    console.log('[ClaudeProvider] Using OpenAI format:', useOpenAIFormat);

    // Build request based on API format
    let requestBody: string;

    if (useOpenAIFormat) {
      // OpenAI-compatible format
      const openAIMessages: OpenAIMessage[] = [];

      // Add system prompt if provided
      if (options?.systemPrompt) {
        openAIMessages.push({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      // Add user message
      openAIMessages.push({
        role: 'user',
        content: prompt,
      });

      const openAIRequest: OpenAIRequest = {
        model: modelName,
        messages: openAIMessages,
        max_tokens: options?.maxTokens ?? this.defaultModel.maxTokens,
        temperature: options?.temperature ?? this.defaultModel.temperature,
      };

      if (options?.stopSequences && options.stopSequences.length > 0) {
        openAIRequest.stop = options.stopSequences;
      }

      requestBody = JSON.stringify(openAIRequest);
    } else {
      // Anthropic/Claude format
      const claudeRequest: ClaudeRequest = {
        model: modelName,
        max_tokens: options?.maxTokens ?? this.defaultModel.maxTokens,
        temperature: options?.temperature ?? this.defaultModel.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      };

      if (options?.systemPrompt) {
        claudeRequest.system = options.systemPrompt;
      }

      if (options?.stopSequences && options.stopSequences.length > 0) {
        claudeRequest.stop_sequences = options.stopSequences;
      }

      requestBody = JSON.stringify(claudeRequest);
    }

    return this.rateLimitedRequest(async () => {
      // Build headers based on whether using official or third-party API
      const isOfficialApi = this.baseUrl.includes('anthropic.com');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (isOfficialApi) {
        // Official Anthropic API headers
        headers['x-api-key'] = this.apiKey!;
        headers['anthropic-version'] = ANTHROPIC_VERSION;
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
      } else {
        // Third-party API (OneAPI, etc.) - send both header formats for compatibility
        // Some providers use Bearer token, others use x-api-key
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        headers['x-api-key'] = this.apiKey!;
      }

      // Debug logging
      console.log('[ClaudeProvider] Making request to:', this.baseUrl);
      console.log('[ClaudeProvider] Using official API:', isOfficialApi);
      console.log('[ClaudeProvider] Request model:', modelName);

      let response: Response;
      try {
        response = await fetch(this.baseUrl, {
          method: 'POST',
          headers,
          body: requestBody,
          signal: options?.signal, // Support cancellation
        });
      } catch (fetchError) {
        // Check if it was an abort
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw this.createError(
            'NETWORK_ERROR',
            'Request was cancelled',
            false
          );
        }
        console.error('[ClaudeProvider] Fetch error:', fetchError);
        throw this.createError(
          'NETWORK_ERROR',
          `Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect'}. Check if the API endpoint is correct and accessible.`,
          true
        );
      }

      const latencyMs = Date.now() - startTime;
      console.log('[ClaudeProvider] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('[ClaudeProvider] Error response:', errorText);

        // Try to parse error from either format
        let errorMessage = '';
        try {
          const errorJson = JSON.parse(errorText);
          // OpenAI format: { error: { message: "..." } }
          // Claude format: { error: { message: "..." } }
          errorMessage = errorJson.error?.message || errorJson.message || '';
        } catch {
          errorMessage = errorText;
        }

        if (response.status === 401) {
          throw this.createError(
            'INVALID_API_KEY',
            'Invalid API key. Please check your API key in Settings.',
            false
          );
        }

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10) * 1000;
          throw this.createError(
            'RATE_LIMITED',
            'Rate limit exceeded. Please wait before making more requests.',
            true,
            retryAfter
          );
        }

        if (response.status === 400 && errorMessage.includes('context')) {
          throw this.createError(
            'CONTEXT_TOO_LONG',
            'The request context is too long. Try with fewer papers or shorter content.',
            false
          );
        }

        throw this.createError(
          'PROVIDER_ERROR',
          `API error (${response.status}): ${errorMessage || response.statusText}`,
          response.status >= 500 // Retry on server errors
        );
      }

      // Parse response based on API format
      const responseJson = await response.json();
      console.log('[ClaudeProvider] Response received');

      let text: string;
      let inputTokens: number;
      let outputTokens: number;
      let responseModel: string;
      let finishReason: CompletionResult['finishReason'];

      if (useOpenAIFormat) {
        // Parse OpenAI format response
        const openAIData = responseJson as OpenAIResponse;
        text = openAIData.choices?.[0]?.message?.content || '';
        inputTokens = openAIData.usage?.prompt_tokens || 0;
        outputTokens = openAIData.usage?.completion_tokens || 0;
        responseModel = openAIData.model || modelName;
        finishReason = this.mapOpenAIStopReason(openAIData.choices?.[0]?.finish_reason);
      } else {
        // Parse Claude format response
        const claudeData = responseJson as ClaudeResponse;
        text = claudeData.content
          ?.filter(block => block.type === 'text')
          .map(block => block.text)
          .join('') || '';
        inputTokens = claudeData.usage?.input_tokens || 0;
        outputTokens = claudeData.usage?.output_tokens || 0;
        responseModel = claudeData.model || modelName;
        finishReason = this.mapStopReason(claudeData.stop_reason);
      }

      return {
        text,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
        },
        finishReason,
        model: responseModel,
        latencyMs,
      };
    });
  }

  /**
   * Map OpenAI stop reasons to our standard format
   */
  private mapOpenAIStopReason(reason: string | null): CompletionResult['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'complete';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'stop';
      default:
        return 'complete';
    }
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    console.log('[ClaudeProvider] Testing connection...');
    console.log('[ClaudeProvider] Base URL:', this.baseUrl);
    console.log('[ClaudeProvider] API Key configured:', !!this.apiKey);
    console.log('[ClaudeProvider] API Key prefix:', this.apiKey?.substring(0, 10) + '...');

    try {
      const result = await this.complete('Say "ok" and nothing else.', {
        maxTokens: 10,
        temperature: 0,
      });
      console.log('[ClaudeProvider] Test response:', result.text);
      return result.text.toLowerCase().includes('ok');
    } catch (error) {
      console.error('[ClaudeProvider] Connection test failed:', error);
      // Re-throw with more context for debugging
      if (error instanceof Error) {
        console.error('[ClaudeProvider] Error message:', error.message);
      }
      return false;
    }
  }

  /**
   * More accurate token estimation for Claude
   * Claude uses a similar tokenizer to GPT models
   */
  estimateTokens(text: string): number {
    // More accurate estimate based on Claude's tokenization
    // Average ~3.5 chars per token for mixed content
    // Account for JSON structure, whitespace, etc.
    const baseEstimate = Math.ceil(text.length / 3.5);

    // Add buffer for message formatting overhead
    return Math.ceil(baseEstimate * 1.1);
  }

  /**
   * Map Claude stop reasons to our standard format
   */
  private mapStopReason(reason: string): CompletionResult['finishReason'] {
    switch (reason) {
      case 'end_turn':
        return 'complete';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'complete';
    }
  }
}

/**
 * Factory function to create Claude provider with specific model tier
 */
export function createClaudeProvider(
  apiKey?: string,
  tier: 'fast' | 'standard' | 'advanced' = 'standard',
  baseUrl?: string,
  customModelName?: string
): ClaudeProvider {
  return new ClaudeProvider(apiKey, tier, baseUrl, customModelName);
}
