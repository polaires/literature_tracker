import type { AuthResponse, RegisterRequest, LoginRequest, User } from './types';

// Use Protein Engineering Tools server for auth (shared database & JWT secret)
// This enables cross-login between IdeaGraph and Protein Engineering Tools
const API_URL = import.meta.env.VITE_API_URL || 'https://laudable-appreciation-production.up.railway.app';
const TOKEN_KEY = 'auth_token';

// Token management (same key as Protein Engineering Tools for cross-login)
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Helper for authenticated requests
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  return fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });
}

// Auth API
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await authFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }

  const result = await response.json();
  setToken(result.token);
  return result;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await authFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const result = await response.json();
  setToken(result.token);
  return result;
}

export async function logout(): Promise<void> {
  clearToken();
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await authFetch('/api/auth/me');
    if (!response.ok) {
      clearToken();
      return null;
    }
    const data = await response.json();
    return data.user;
  } catch {
    clearToken();
    return null;
  }
}

export async function verifyEmail(token: string): Promise<{ message: string; user: User }> {
  const response = await authFetch('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Verification failed');
  }

  return response.json();
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await authFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const response = await authFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Reset failed');
  }

  return response.json();
}

// Sync API
export async function syncFullData(data: {
  theses?: unknown[];
  papers?: unknown[];
  connections?: unknown[];
  annotations?: unknown[];
  settings?: unknown;
  aiSettings?: unknown;
}): Promise<{ message: string }> {
  const response = await authFetch('/api/sync/full', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Sync failed');
  }

  return response.json();
}

export async function getFullSyncData(): Promise<{
  theses: unknown[];
  papers: unknown[];
  connections: unknown[];
  annotations: unknown[];
  settings: unknown;
  aiSettings: unknown;
  syncVersion: number;
  lastSyncedAt: string | null;
}> {
  const response = await authFetch('/api/sync/full');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get sync data');
  }

  return response.json();
}

export async function checkHealth(): Promise<{ status: string; database: string }> {
  const response = await fetch(`${API_URL}/api/health`);
  return response.json();
}
