// AI Provider Factory and Exports

import type { AIProvider, AIProviderType, AISettings } from '../types';
import { ClaudeProvider, createClaudeProvider } from './claude';
import { createMockProvider } from './mock';

// Re-export providers
export { ClaudeProvider, createClaudeProvider } from './claude';
export { MockAIProvider, createMockProvider } from './mock';
export { BaseAIProvider } from './base';

// Provider singleton cache
let currentProvider: AIProvider | null = null;
let currentProviderType: AIProviderType | null = null;

// Track current baseUrl for cache invalidation
let currentBaseUrl: string | null = null;

/**
 * Get or create an AI provider based on settings
 */
export function getAIProvider(settings: AISettings): AIProvider {
  // Return cached provider if type and baseUrl match
  const baseUrlChanged = currentBaseUrl !== settings.apiBaseUrl;

  if (currentProvider && currentProviderType === settings.provider && !baseUrlChanged) {
    // Update API key if changed
    if (settings.apiKey && currentProvider instanceof ClaudeProvider) {
      currentProvider.setApiKey(settings.apiKey);
    }
    return currentProvider;
  }

  // Create new provider (type or baseUrl changed)
  currentProvider = createAIProvider(settings);
  currentProviderType = settings.provider;
  currentBaseUrl = settings.apiBaseUrl;

  return currentProvider;
}

/**
 * Create a new AI provider instance
 */
export function createAIProvider(settings: AISettings): AIProvider {
  const tier = settings.preferFastModel ? 'fast' : 'standard';

  switch (settings.provider) {
    case 'claude':
      return createClaudeProvider(
        settings.apiKey ?? undefined,
        tier,
        settings.apiBaseUrl ?? undefined,
        settings.customModelName ?? undefined
      );

    case 'openai':
      // TODO: Implement OpenAI provider
      console.warn('[AIProvider] OpenAI provider not yet implemented, falling back to mock');
      return createMockProvider();

    case 'ollama':
      // TODO: Implement Ollama provider
      console.warn('[AIProvider] Ollama provider not yet implemented, falling back to mock');
      return createMockProvider();

    case 'mock':
      return createMockProvider();

    default:
      console.warn(`[AIProvider] Unknown provider: ${settings.provider}, falling back to mock`);
      return createMockProvider();
  }
}

/**
 * Clear the provider cache (useful when settings change)
 */
export function clearProviderCache(): void {
  currentProvider = null;
  currentProviderType = null;
  currentBaseUrl = null;
}

/**
 * Check if a provider type is available and configured
 */
export function isProviderAvailable(type: AIProviderType, settings: AISettings): boolean {
  switch (type) {
    case 'claude':
      // Accept any sk- key (official sk-ant- or third-party sk-)
      return !!settings.apiKey && settings.apiKey.startsWith('sk-');

    case 'openai':
      return !!settings.apiKey && settings.apiKey.startsWith('sk-');

    case 'ollama':
      return !!settings.ollamaEndpoint;

    case 'mock':
      return true;

    default:
      return false;
  }
}

/**
 * Get display name for a provider
 */
export function getProviderDisplayName(type: AIProviderType): string {
  switch (type) {
    case 'claude':
      return 'Claude (Anthropic)';
    case 'openai':
      return 'GPT-4 (OpenAI)';
    case 'ollama':
      return 'Ollama (Local)';
    case 'mock':
      return 'Mock (Testing)';
    default:
      return 'Unknown';
  }
}

/**
 * Get available providers list
 */
export function getAvailableProviders(): { type: AIProviderType; name: string; available: boolean }[] {
  return [
    { type: 'claude', name: 'Claude (Anthropic)', available: true },
    { type: 'openai', name: 'GPT-4 (OpenAI)', available: false }, // Not yet implemented
    { type: 'ollama', name: 'Ollama (Local)', available: false }, // Not yet implemented
    { type: 'mock', name: 'Mock (Testing)', available: true },
  ];
}
