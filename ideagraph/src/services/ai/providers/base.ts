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
      // Log the raw response for debugging
      console.log('[BaseProvider] Raw response text:', completion.text.substring(0, 500));

      // Pre-process: Fix common LLM JSON errors
      // Pattern: "text value" (annotation) -> "text value (annotation)"
      // This happens when LLMs add page references outside the string
      let processedText = completion.text.replace(
        /"([^"]*?)"\s*\(([^)]+)\)\s*([,}\]])/g,
        '"$1 ($2)"$3'
      );

      // Try to extract JSON from the response
      // First, try to find a JSON array (common for suggestions)
      let jsonString: string | null = null;

      // Method 1: Try direct parse (if response is pure JSON)
      const trimmedText = processedText.trim();
      if (trimmedText.startsWith('[') || trimmedText.startsWith('{')) {
        try {
          const data = JSON.parse(trimmedText) as T;
          return { data, completion };
        } catch {
          // Not pure JSON, continue with extraction
        }
      }

      // Method 2: Look for JSON code block (```json ... ```)
      const codeBlockMatch = processedText.match(/```(?:json)?\s*([\[\{][\s\S]*?[\]\}])\s*```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1];
      }

      // Method 3: Find JSON by bracket matching
      if (!jsonString) {
        jsonString = this.extractValidJSON(processedText);
      }

      // Method 4: Try to repair truncated JSON
      if (!jsonString) {
        jsonString = this.repairTruncatedJSON(processedText);
        if (jsonString) {
          console.log('[BaseProvider] Repaired truncated JSON successfully');
        }
      }

      if (!jsonString) {
        console.error('[BaseProvider] No JSON found in response:', processedText);
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonString) as T;
      return { data, completion };
    } catch (error) {
      console.error('[BaseProvider] JSON parse error:', error);
      console.error('[BaseProvider] Response text:', completion.text);
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

  /**
   * Extract valid JSON from text using bracket matching
   * Handles nested arrays and objects properly
   */
  private extractValidJSON(text: string): string | null {
    // Find the first [ or { and try to match to completion
    const startArray = text.indexOf('[');
    const startObject = text.indexOf('{');

    // Determine which comes first
    let startIndex = -1;
    let openBracket = '';
    let closeBracket = '';

    if (startArray === -1 && startObject === -1) {
      return null;
    } else if (startArray === -1) {
      startIndex = startObject;
      openBracket = '{';
      closeBracket = '}';
    } else if (startObject === -1) {
      startIndex = startArray;
      openBracket = '[';
      closeBracket = ']';
    } else {
      // Both found, use whichever comes first
      if (startArray < startObject) {
        startIndex = startArray;
        openBracket = '[';
        closeBracket = ']';
      } else {
        startIndex = startObject;
        openBracket = '{';
        closeBracket = '}';
      }
    }

    // Count brackets to find the matching close bracket
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = startIndex; i < text.length; i++) {
      const char = text[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === '\\') {
        escape = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === openBracket || char === '{' || char === '[') {
        depth++;
      } else if (char === closeBracket || char === '}' || char === ']') {
        depth--;
        if (depth === 0) {
          const jsonCandidate = text.substring(startIndex, i + 1);
          try {
            JSON.parse(jsonCandidate);
            return jsonCandidate;
          } catch {
            // Not valid JSON, continue searching
            return null;
          }
        }
      }
    }

    return null;
  }

  /**
   * Attempt to repair truncated JSON by closing unclosed brackets
   * This handles cases where the LLM response was cut off due to token limits
   */
  private repairTruncatedJSON(text: string): string | null {
    // Find the first [ or {
    const startArray = text.indexOf('[');
    const startObject = text.indexOf('{');

    if (startArray === -1 && startObject === -1) {
      return null;
    }

    const startIndex = startArray === -1 ? startObject :
                       startObject === -1 ? startArray :
                       Math.min(startArray, startObject);

    // Extract from start to end
    let jsonText = text.substring(startIndex);

    // Track what brackets need to be closed
    const bracketStack: string[] = [];
    let inString = false;
    let escape = false;

    for (let i = 0; i < jsonText.length; i++) {
      const char = jsonText[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === '\\') {
        escape = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{' || char === '[') {
        bracketStack.push(char === '{' ? '}' : ']');
      } else if (char === '}' || char === ']') {
        if (bracketStack.length > 0) {
          bracketStack.pop();
        }
      }
    }

    // If we're in a string, close it
    if (inString) {
      jsonText += '"';
    }

    // Try to find a good truncation point (end of a complete property)
    // Look for the last complete value ending with , or : followed by a value
    const lastCompleteIndex = this.findLastCompleteJsonIndex(jsonText);
    if (lastCompleteIndex > 0) {
      jsonText = jsonText.substring(0, lastCompleteIndex);

      // Recalculate bracket stack for truncated text
      bracketStack.length = 0;
      inString = false;
      escape = false;

      for (let i = 0; i < jsonText.length; i++) {
        const char = jsonText[i];

        if (escape) {
          escape = false;
          continue;
        }

        if (char === '\\') {
          escape = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (inString) continue;

        if (char === '{' || char === '[') {
          bracketStack.push(char === '{' ? '}' : ']');
        } else if (char === '}' || char === ']') {
          if (bracketStack.length > 0) {
            bracketStack.pop();
          }
        }
      }
    }

    // Close all unclosed brackets
    const closingBrackets = bracketStack.reverse().join('');
    jsonText += closingBrackets;

    // Try to parse
    try {
      JSON.parse(jsonText);
      return jsonText;
    } catch {
      // Try removing trailing incomplete elements
      return this.tryRemoveTrailingIncomplete(jsonText);
    }
  }

  /**
   * Find the index of the last complete JSON value
   */
  private findLastCompleteJsonIndex(text: string): number {
    // Look for patterns that indicate complete values
    // Find last occurrence of }, ], ", or number followed by comma or closing bracket
    let lastGoodIndex = -1;
    let inString = false;
    let escape = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === '\\') {
        escape = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        if (!inString) {
          // End of string - potential good stopping point
          lastGoodIndex = i + 1;
        }
        continue;
      }

      if (inString) continue;

      // Good stopping points: after }, ], or numbers/booleans/null
      if (char === '}' || char === ']') {
        lastGoodIndex = i + 1;
      } else if (char === ',') {
        // After a comma is also good if we just finished a value
        lastGoodIndex = i;
      }
    }

    return lastGoodIndex;
  }

  /**
   * Try to remove trailing incomplete elements to make valid JSON
   */
  private tryRemoveTrailingIncomplete(text: string): string | null {
    // Try progressively removing characters from the end and re-parsing
    let testText = text;

    // Remove trailing incomplete array/object elements
    for (let i = 0; i < 100; i++) {
      // Remove trailing comma if present
      testText = testText.replace(/,\s*$/, '');

      try {
        JSON.parse(testText);
        return testText;
      } catch {
        // Try removing the last element
        // Remove from last comma or opening bracket
        const lastComma = testText.lastIndexOf(',');
        const lastOpenBrace = testText.lastIndexOf('{');
        const lastOpenBracket = testText.lastIndexOf('[');

        if (lastComma > Math.max(lastOpenBrace, lastOpenBracket) && lastComma > 0) {
          testText = testText.substring(0, lastComma) + testText.substring(testText.length).replace(/^[^}\]]*/, '');
        } else {
          break;
        }
      }
    }

    return null;
  }
}
