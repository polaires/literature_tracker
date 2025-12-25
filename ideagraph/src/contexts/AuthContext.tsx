import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { AuthState, RegisterRequest, LoginRequest } from '../services/auth/types';
import * as authApi from '../services/auth/api';
import { useAppStore } from '../store/useAppStore';

interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: authApi.getToken(),
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const checkAuth = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authApi.getCurrentUser();
      setState({
        user,
        token: authApi.getToken(),
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      });
    } catch {
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (data: LoginRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authApi.login(data);
      setState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      }));
      throw err;
    }
  };

  const register = async (data: RegisterRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authApi.register(data);
      setState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Registration failed',
      }));
      throw err;
    }
  };

  const logout = async () => {
    await authApi.logout();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const syncToCloud = async () => {
    if (!state.isAuthenticated) {
      throw new Error('Must be logged in to sync');
    }

    const storeState = useAppStore.getState();
    await authApi.syncFullData({
      theses: storeState.theses,
      papers: storeState.papers,
      connections: storeState.connections,
      annotations: storeState.annotations,
      settings: storeState.settings,
      aiSettings: storeState.aiSettings,
    });
  };

  const syncFromCloud = async () => {
    if (!state.isAuthenticated) {
      throw new Error('Must be logged in to sync');
    }

    const cloudData = await authApi.getFullSyncData();

    // Merge cloud data into local store
    useAppStore.setState((current) => ({
      ...current,
      theses: (cloudData.theses as typeof current.theses) || current.theses,
      papers: (cloudData.papers as typeof current.papers) || current.papers,
      connections: (cloudData.connections as typeof current.connections) || current.connections,
      annotations: (cloudData.annotations as typeof current.annotations) || current.annotations,
      settings: (cloudData.settings as typeof current.settings) || current.settings,
      aiSettings: (cloudData.aiSettings as typeof current.aiSettings) || current.aiSettings,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        syncToCloud,
        syncFromCloud,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
