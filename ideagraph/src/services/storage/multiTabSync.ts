// Multi-Tab Synchronization for IdeaGraph
// Keeps Zustand store in sync across browser tabs using BroadcastChannel

// =============================================================================
// Types
// =============================================================================

export type TabSyncMessageType =
  | 'state-update'      // Full or partial state update
  | 'state-request'     // Request full state from other tabs
  | 'state-response'    // Response to state request
  | 'cache-clear'       // Cache was cleared
  | 'ping'              // Heartbeat/discovery
  | 'pong';             // Heartbeat response

export interface TabSyncMessage {
  type: TabSyncMessageType;
  tabId: string;
  timestamp: number;
  payload?: unknown;
  /** Keys that were updated (for partial updates) */
  updatedKeys?: string[];
}

export type TabSyncHandler = (message: TabSyncMessage) => void;

// =============================================================================
// Constants
// =============================================================================

const CHANNEL_NAME = 'ideagraph-sync';
const TAB_ID = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// =============================================================================
// Multi-Tab Sync Class
// =============================================================================

class MultiTabSync {
  private channel: BroadcastChannel | null = null;
  private handlers: Map<TabSyncMessageType, Set<TabSyncHandler>> = new Map();
  private isLeader = false;
  private knownTabs: Set<string> = new Set();
  private lastStateHash = '';
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Initialize the sync channel
   */
  init(): boolean {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('[MultiTabSync] BroadcastChannel not supported');
      return false;
    }

    if (this.channel) {
      console.warn('[MultiTabSync] Already initialized');
      return true;
    }

    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = this.handleMessage.bind(this);

      // Announce our presence
      this.broadcast({ type: 'ping' });

      // Listen for storage events as fallback
      window.addEventListener('storage', this.handleStorageEvent.bind(this));

      console.log(`[MultiTabSync] Initialized with tab ID: ${TAB_ID}`);
      return true;
    } catch (e) {
      console.error('[MultiTabSync] Failed to initialize:', e);
      return false;
    }
  }

  /**
   * Close the sync channel
   */
  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    window.removeEventListener('storage', this.handleStorageEvent.bind(this));
    this.handlers.clear();
    this.knownTabs.clear();
  }

  /**
   * Get this tab's ID
   */
  getTabId(): string {
    return TAB_ID;
  }

  /**
   * Check if this tab is the leader (first/oldest tab)
   */
  isLeaderTab(): boolean {
    return this.isLeader;
  }

  /**
   * Get list of known active tabs
   */
  getActiveTabs(): string[] {
    return Array.from(this.knownTabs);
  }

  /**
   * Broadcast a message to all other tabs
   */
  broadcast(message: Omit<TabSyncMessage, 'tabId' | 'timestamp'>): void {
    if (!this.channel) return;

    const fullMessage: TabSyncMessage = {
      ...message,
      tabId: TAB_ID,
      timestamp: Date.now(),
    };

    try {
      this.channel.postMessage(fullMessage);
    } catch (e) {
      console.error('[MultiTabSync] Failed to broadcast:', e);
    }
  }

  /**
   * Broadcast a state update (debounced)
   */
  broadcastStateUpdate(updatedKeys: string[], payload?: unknown): void {
    // Debounce rapid updates
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.broadcast({
        type: 'state-update',
        updatedKeys,
        payload,
      });
      this.debounceTimeout = null;
    }, 50); // 50ms debounce
  }

  /**
   * Request full state from other tabs (e.g., on page load)
   */
  requestState(): void {
    this.broadcast({ type: 'state-request' });
  }

  /**
   * Notify other tabs that cache was cleared
   */
  notifyCacheCleared(cacheType?: string): void {
    this.broadcast({
      type: 'cache-clear',
      payload: { cacheType },
    });
  }

  /**
   * Subscribe to a specific message type
   */
  on(type: TabSyncMessageType, handler: TabSyncHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  /**
   * Subscribe to all messages
   */
  onAny(handler: TabSyncHandler): () => void {
    const unsubscribers: (() => void)[] = [];
    const types: TabSyncMessageType[] = [
      'state-update',
      'state-request',
      'state-response',
      'cache-clear',
      'ping',
      'pong',
    ];

    for (const type of types) {
      unsubscribers.push(this.on(type, handler));
    }

    return () => {
      for (const unsub of unsubscribers) {
        unsub();
      }
    };
  }

  /**
   * Handle incoming broadcast messages
   */
  private handleMessage(event: MessageEvent<TabSyncMessage>): void {
    const message = event.data;

    // Ignore our own messages
    if (message.tabId === TAB_ID) return;

    // Track known tabs
    this.knownTabs.add(message.tabId);

    // Handle specific message types
    switch (message.type) {
      case 'ping':
        // Respond to discovery
        this.broadcast({ type: 'pong' });
        break;

      case 'pong':
        // Tab responded to our ping, already tracked above
        break;

      case 'state-request':
        // Another tab is requesting state
        // Only the leader should respond to avoid conflicts
        if (this.isLeader) {
          this.broadcast({
            type: 'state-response',
            payload: this.getCurrentState(),
          });
        }
        break;

      default:
        // Let handlers process the message
        break;
    }

    // Notify registered handlers
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message);
        } catch (e) {
          console.error('[MultiTabSync] Handler error:', e);
        }
      }
    }
  }

  /**
   * Handle storage events (fallback for older browsers)
   */
  private handleStorageEvent(event: StorageEvent): void {
    // Only care about our storage key
    if (event.key !== 'ideagraph-storage') return;
    if (!event.newValue) return;

    // Generate a hash to detect actual changes
    const newHash = this.hashString(event.newValue);
    if (newHash === this.lastStateHash) return;
    this.lastStateHash = newHash;

    // Notify handlers about the storage change
    const handlers = this.handlers.get('state-update');
    if (handlers) {
      const message: TabSyncMessage = {
        type: 'state-update',
        tabId: 'storage-event',
        timestamp: Date.now(),
        payload: event.newValue,
      };

      for (const handler of handlers) {
        try {
          handler(message);
        } catch (e) {
          console.error('[MultiTabSync] Storage handler error:', e);
        }
      }
    }
  }

  /**
   * Get current state from storage (for responding to state requests)
   */
  private getCurrentState(): unknown {
    try {
      const stored = localStorage.getItem('ideagraph-storage');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    return null;
  }

  /**
   * Simple string hash for change detection
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Elect a leader among tabs (using simple "oldest wins" strategy)
   */
  electLeader(): void {
    // Check if any other tabs are older (have smaller tab IDs)
    let isOldest = true;
    for (const tabId of this.knownTabs) {
      // Compare timestamps embedded in tab IDs
      const otherTimestamp = parseInt(tabId.split('-')[1], 10);
      const ourTimestamp = parseInt(TAB_ID.split('-')[1], 10);
      if (otherTimestamp < ourTimestamp) {
        isOldest = false;
        break;
      }
    }

    this.isLeader = isOldest;
    console.log(`[MultiTabSync] Leader election: ${this.isLeader ? 'I am leader' : 'Another tab is leader'}`);
  }

  /**
   * Send a ping and wait for responses to discover tabs
   */
  async discoverTabs(timeoutMs = 500): Promise<string[]> {
    return new Promise((resolve) => {
      this.knownTabs.clear();
      this.broadcast({ type: 'ping' });

      setTimeout(() => {
        this.electLeader();
        resolve(Array.from(this.knownTabs));
      }, timeoutMs);
    });
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const multiTabSync = new MultiTabSync();

// =============================================================================
// Zustand Middleware Integration Helper
// =============================================================================

/**
 * Create a Zustand middleware that syncs state across tabs
 * Usage: create(multiTabSyncMiddleware(persist(store)))
 */
export function createMultiTabSyncMiddleware<T extends object>(
  onExternalUpdate: (state: Partial<T>) => void
): () => void {
  // Initialize sync
  multiTabSync.init();

  // Listen for state updates from other tabs
  const unsubscribe = multiTabSync.on('state-update', (message) => {
    if (message.payload) {
      try {
        const state = typeof message.payload === 'string'
          ? JSON.parse(message.payload)
          : message.payload;

        // Extract state from Zustand persist format
        const actualState = state.state || state;
        onExternalUpdate(actualState as Partial<T>);
      } catch (e) {
        console.error('[MultiTabSync] Failed to parse state update:', e);
      }
    }
  });

  // Return cleanup function
  return () => {
    unsubscribe();
    multiTabSync.close();
  };
}
