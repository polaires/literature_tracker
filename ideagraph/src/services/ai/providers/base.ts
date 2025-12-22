// Base AI Provider Interface and Utilities

import type { AIProvider, CompletionOptions, CompletionResult, AIError } from '../types';

/**
 * Abstract base class for AI providers
 * Implements common functionality like retry logic, rate limiting, and error handling
 */
export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;
  protected apiKey: string | null = null;

  // Rate limiting state
  protected lastRequestTime = 0;
  protected minRequestInterval = 100; // ms between requests
  protected backoffMultiplier = 1;
  protected maxBackoff = 16;

  abstract isConfigured(): boolean;
  abstract complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
  abstract testConnection(): Promise<boolean>;

  /**
   * Complete with JSON parsing
   * Automatically extracts JSON from response and parses it
   */
  async completeJSON<T>(
    prompt: string,
    options?: CompletionOptions
  ): Promise<{ data: T; completion: CompletionResult }> {
    const completion = await this.complete(prompt, options);

    try {
      // Extract JSON from the response
      const jsonMatch = completion.text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]) as T;
      return { data, completion };
    } catch (error) {
      throw this.createError(
        'PARSE_ERROR',
        `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      );
    }
  }

  /**
   * Set API key for the provider
   */
  setApiKey(key: string | null): void {
    this.apiKey = key;
  }

  /**
   * Rate-limited fetch with exponential backoff
   */
  protected async rateLimitedRequest<T>(
    requestFn: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const interval = this.minRequestInterval * this.backoffMultiplier;
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < interval) {
      await this.sleep(interval - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();

    try {
      const result = await requestFn();
      // Gradually reduce backoff on success
      this.backoffMultiplier = Math.max(1, this.backoffMultiplier * 0.8);
      return result;
    } catch (error) {
      if (this.isRateLimitError(error)) {
        this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, this.maxBackoff);
        throw this.createError(
          'RATE_LIMITED',
          'Rate limit exceeded. Please wait before making more requests.',
          true,
          this.backoffMultiplier * 1000
        );
      }
      throw error;
    }
  }

  /**
   * Retry with exponential backoff
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelayMs = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry non-retryable errors
        if (error instanceof Error && 'retryable' in error && !error.retryable) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = initialDelayMs * Math.pow(2, attempt);
          console.log(`[${this.name}] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Check if error is a rate limit error
   */
  protected isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message.includes('rate limit') ||
             error.message.includes('429') ||
             error.message.includes('too many requests');
    }
    return false;
  }

  /**
   * Create a typed AI error
   */
  protected createError(
    code: AIError['code'],
    message: string,
    retryable = false,
    retryAfterMs?: number
  ): AIError {
    const error = new Error(message) as AIError;
    error.name = 'AIError';
    error.code = code;
    error.retryable = retryable;
    error.retryAfterMs = retryAfterMs;
    return error;
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Simple token estimation (rough approximation)
   * Override in specific providers for more accurate counting
   */
  estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }
}
