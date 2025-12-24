// AI Settings Component
// Simplified configuration for AI provider and API key

import React, { useState, useMemo } from 'react';
import {
  Key,
  Zap,
  Shield,
  Check,
  X,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Database,
  Brain,
  Search,
  AlertTriangle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAI } from '../../hooks/useAI';
import { getSimilarityCacheStats, clearSimilarityCache } from '../../services/api/semanticScholar';
import { getEmbeddingCacheStats, clearEmbeddingCache } from '../../services/api/semanticScholar';
import { getRetractionCheckStats, clearRetractionCache } from '../../services/intake/retractionCheck';
import { isUsingDefaultAPI } from '../../services/ai/config';

export const AISettings: React.FC = () => {
  const {
    settings,
    updateSettings,
    isConfigured,
    testConnection,
  } = useAI();

  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey || '');
  const [apiBaseUrlInput, setApiBaseUrlInput] = useState(settings.apiBaseUrl || '');
  const [customModelInput, setCustomModelInput] = useState(settings.customModelName || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomAPI, setShowCustomAPI] = useState(false);

  // Check if using default API
  const usingDefaultAPI = isUsingDefaultAPI(settings.apiKey, settings.apiBaseUrl);

  // Handle API key and endpoint save
  const handleSaveApiKey = () => {
    updateSettings({
      apiKey: apiKeyInput,
      apiBaseUrl: apiBaseUrlInput || null,
      customModelName: customModelInput || null,
    });
    setConnectionStatus('idle');
  };

  // Handle connection test
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');

    try {
      // Save settings with current input (including custom endpoint and model)
      updateSettings({
        apiKey: apiKeyInput,
        apiBaseUrl: apiBaseUrlInput || null,
        customModelName: customModelInput || null,
      });

      // Wait a bit for settings to propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      const success = await testConnection();
      setConnectionStatus(success ? 'success' : 'error');
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* API Configuration */}
      <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-slate-500" />
          <h3 className="font-medium text-slate-900 dark:text-white">API Configuration</h3>
          {isConfigured && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {usingDefaultAPI ? 'Ready' : 'Connected'}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {/* Default API Status */}
          {usingDefaultAPI && !showCustomAPI && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  AI features are ready to use
                </span>
              </div>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                Using built-in AI service. No configuration needed.
              </p>
            </div>
          )}

          {/* Custom API Configuration (Collapsible) */}
          <details
            className="group"
            open={showCustomAPI || !usingDefaultAPI}
            onToggle={(e) => setShowCustomAPI((e.target as HTMLDetailsElement).open)}
          >
            <summary className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
              {usingDefaultAPI ? 'Want to use your own API? Click to configure' : 'Custom API Configuration'}
            </summary>
            <div className="mt-3 space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  API Key
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => {
                        setApiKeyInput(e.target.value);
                        setConnectionStatus('idle');
                      }}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Endpoint */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  API Endpoint (optional)
                </label>
                <input
                  type="text"
                  value={apiBaseUrlInput}
                  onChange={(e) => {
                    setApiBaseUrlInput(e.target.value);
                    setConnectionStatus('idle');
                  }}
                  placeholder="https://api.openai.com/v1/chat/completions"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-stone-500 focus:border-transparent text-sm"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  For OpenAI, Anthropic, or other compatible providers
                </p>
              </div>

              {/* Model Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Model Name (optional)
                </label>
                <input
                  type="text"
                  value={customModelInput}
                  onChange={(e) => {
                    setCustomModelInput(e.target.value);
                    setConnectionStatus('idle');
                  }}
                  placeholder="e.g., gpt-4, claude-3-sonnet"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-stone-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKeyInput}
                  className="px-4 py-2 rounded-lg bg-stone-600 text-white hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Save
                </button>
                <button
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  {isTestingConnection ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Test
                </button>

                {!usingDefaultAPI && (
                  <button
                    onClick={() => {
                      updateSettings({
                        apiKey: null,
                        apiBaseUrl: null,
                        customModelName: null,
                      });
                      setApiKeyInput('');
                      setApiBaseUrlInput('');
                      setCustomModelInput('');
                      setConnectionStatus('idle');
                    }}
                    className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Reset to Default
                  </button>
                )}

                {connectionStatus === 'success' && (
                  <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    Success
                  </span>
                )}

                {connectionStatus === 'error' && (
                  <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                    <X className="w-4 h-4" />
                    Failed
                  </span>
                )}
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-slate-500" />
          <h3 className="font-medium text-slate-900 dark:text-white">AI Features</h3>
        </div>

        <div className="space-y-3">
          {/* Core AI Features */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'enableConnectionSuggestions', label: 'Connections', icon: Sparkles },
              { key: 'enableTakeawaySuggestions', label: 'Takeaways', icon: Sparkles },
              { key: 'enableArgumentExtraction', label: 'Arguments', icon: Brain },
              { key: 'enableGapAnalysis', label: 'Gap Analysis', icon: Search },
            ].map(({ key, label, icon: Icon }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                <input
                  type="checkbox"
                  checked={settings[key as keyof typeof settings] as boolean}
                  onChange={(e) => updateSettings({ [key]: e.target.checked })}
                  className="rounded border-slate-300 text-stone-600 focus:ring-stone-500"
                />
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
              </label>
            ))}
          </div>

          {/* New Phase 3 Features */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Enhanced Features</p>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                <input
                  type="checkbox"
                  checked={settings.enableRetractionChecking ?? true}
                  onChange={(e) => updateSettings({ enableRetractionChecking: e.target.checked })}
                  className="rounded border-slate-300 text-stone-600 focus:ring-stone-500"
                />
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Retraction checking</span>
                <span className="text-xs text-slate-400 ml-auto">via OpenAlex</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                <input
                  type="checkbox"
                  checked={settings.enableSemanticSearch ?? false}
                  onChange={(e) => updateSettings({ enableSemanticSearch: e.target.checked })}
                  className="rounded border-slate-300 text-stone-600 focus:ring-stone-500"
                />
                <Search className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Semantic search</span>
                <span className="text-xs text-slate-400 ml-auto">SPECTER embeddings</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                <input
                  type="checkbox"
                  checked={settings.enableFeedbackLearning ?? true}
                  onChange={(e) => updateSettings({ enableFeedbackLearning: e.target.checked })}
                  className="rounded border-slate-300 text-stone-600 focus:ring-stone-500"
                />
                <Brain className="w-3.5 h-3.5 text-green-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Learn from corrections</span>
                <span className="text-xs text-slate-400 ml-auto">Improves suggestions</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                <input
                  type="checkbox"
                  checked={settings.enablePlanBasedGaps ?? false}
                  onChange={(e) => updateSettings({ enablePlanBasedGaps: e.target.checked })}
                  className="rounded border-slate-300 text-stone-600 focus:ring-stone-500"
                />
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Plan-based gap analysis</span>
                <span className="text-xs text-slate-400 ml-auto">More accurate</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Advanced */}
      <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            <h3 className="font-medium text-slate-900 dark:text-white">Privacy & Advanced</h3>
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {/* Privacy Toggles */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sendAbstractsToAI}
                  onChange={(e) => updateSettings({ sendAbstractsToAI: e.target.checked })}
                  className="rounded border-slate-300 text-stone-600 focus:ring-stone-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Send paper abstracts for better suggestions</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sendHighlightsToAI}
                  onChange={(e) => updateSettings({ sendHighlightsToAI: e.target.checked })}
                  className="rounded border-slate-300 text-stone-600 focus:ring-stone-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Include PDF highlights for context</span>
              </label>
            </div>

            <div className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Thesis titles and paper takeaways are always sent for context.
                </p>
              </div>
            </div>

            {/* Confidence Threshold */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Min. Confidence: {(settings.suggestionConfidenceThreshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.suggestionConfidenceThreshold * 100}
                onChange={(e) =>
                  updateSettings({ suggestionConfidenceThreshold: parseInt(e.target.value) / 100 })
                }
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Cache Management */}
      <CacheManagement />
    </div>
  );
};

/**
 * Cache Management Component
 */
function CacheManagement() {
  const [showCaches, setShowCaches] = useState(false);

  // Get cache stats
  const similarityStats = useMemo(() => getSimilarityCacheStats(), [showCaches]);
  const embeddingStats = useMemo(() => getEmbeddingCacheStats(), [showCaches]);
  const retractionStats = useMemo(() => getRetractionCheckStats(), [showCaches]);

  const handleClearAll = () => {
    clearSimilarityCache();
    clearEmbeddingCache();
    clearRetractionCache();
    // Force re-render
    setShowCaches(false);
    setTimeout(() => setShowCaches(true), 0);
  };

  return (
    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <button
        onClick={() => setShowCaches(!showCaches)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-500" />
          <h3 className="font-medium text-slate-900 dark:text-white">Cache Management</h3>
        </div>
        {showCaches ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {showCaches && (
        <div className="mt-4 space-y-3">
          {/* Similarity Cache */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-700/50">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Similar Papers</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {similarityStats.entries} entries
                {similarityStats.entries > 0 && ` (${similarityStats.oldestDays}d old)`}
              </p>
            </div>
            <button
              onClick={() => {
                clearSimilarityCache();
                setShowCaches(false);
                setTimeout(() => setShowCaches(true), 0);
              }}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Clear similarity cache"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Embedding Cache */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-700/50">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Paper Embeddings</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {embeddingStats.entryCount} papers (~{embeddingStats.estimatedSizeKB}KB)
              </p>
            </div>
            <button
              onClick={() => {
                clearEmbeddingCache();
                setShowCaches(false);
                setTimeout(() => setShowCaches(true), 0);
              }}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Clear embedding cache"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Retraction Cache */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-700/50">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Retraction Checks</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {retractionStats.cacheEntries} checked
                {retractionStats.retractedCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {' '}({retractionStats.retractedCount} retracted)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                clearRetractionCache();
                setShowCaches(false);
                setTimeout(() => setShowCaches(true), 0);
              }}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Clear retraction cache"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Clear All */}
          <button
            onClick={handleClearAll}
            className="w-full py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            Clear All Caches
          </button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Caches improve performance. Clearing forces fresh API calls.
          </p>
        </div>
      )}
    </div>
  );
}

export default AISettings;
