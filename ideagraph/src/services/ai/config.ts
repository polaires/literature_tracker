// AI Configuration - Default provider settings
// This file contains the default API configuration

// Default API configuration (hidden from UI)
const DEFAULT_API_CONFIG = {
  baseUrl: 'https://yinli.one/v1/chat/completions',
  apiKey: 'sk-s7WFJ0foYsMsQsnND7b1xFskhAYuioJnI4Z06iMzR5WUoeL8',
  model: 'gpt-4.1-mini',
};

/**
 * Get the default API configuration
 * These defaults are used when the user hasn't configured their own API
 */
export function getDefaultAPIConfig() {
  return { ...DEFAULT_API_CONFIG };
}

/**
 * Check if using default API configuration
 */
export function isUsingDefaultAPI(apiKey: string | null, apiBaseUrl: string | null): boolean {
  // If no user-provided API key or base URL, we're using defaults
  return !apiKey && !apiBaseUrl;
}

/**
 * Get effective API configuration
 * Returns user config if provided, otherwise default config
 */
export function getEffectiveAPIConfig(
  userApiKey: string | null,
  userApiBaseUrl: string | null,
  userModelName: string | null
): { apiKey: string; baseUrl: string; modelName: string } {
  if (userApiKey || userApiBaseUrl) {
    // User has configured their own API
    return {
      apiKey: userApiKey || '',
      baseUrl: userApiBaseUrl || 'https://api.anthropic.com/v1/messages',
      modelName: userModelName || 'claude-3-5-sonnet-20241022',
    };
  }

  // Use default configuration
  return {
    apiKey: DEFAULT_API_CONFIG.apiKey,
    baseUrl: DEFAULT_API_CONFIG.baseUrl,
    modelName: DEFAULT_API_CONFIG.model,
  };
}
