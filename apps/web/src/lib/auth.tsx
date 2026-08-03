import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthSession, SessionUser } from '@ekum/domain-types';
import { api, getTokens, onTokenChange, setTokens } from './apiClient';

interface SessionState {
  user: SessionUser;
  needsOnboarding: boolean;
}

interface AuthContextValue {
  status: 'loading' | 'authenticated' | 'anonymous';
  session: SessionState | null;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
  /** Rotates the token (picking up a freshly-created company) and refreshes session. */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const [session, setSession] = useState<SessionState | null>(null);

  const loadMe = useCallback(async () => {
    if (!getTokens()?.accessToken) {
      setSession(null);
      setStatus('anonymous');
      return;
    }
    try {
      const me = await api.get<{ user: SessionUser; needsOnboarding: boolean }>('/auth/me');
      setSession({ user: me.user, needsOnboarding: me.needsOnboarding });
      setStatus('authenticated');
    } catch {
      setSession(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    void loadMe();
    // A 401 that fails to refresh clears tokens; reflect that as sign-out.
    return onTokenChange((next) => {
      if (!next) {
        setSession(null);
        setStatus('anonymous');
      }
    });
  }, [loadMe]);

  const login = useCallback((incoming: AuthSession) => {
    setTokens(incoming.tokens);
    setSession({ user: incoming.user, needsOnboarding: incoming.needsOnboarding });
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getTokens()?.refreshToken;
    if (refreshToken) {
      try {
        await api.publicPost('/auth/logout', { refreshToken });
      } catch {
        // Best-effort; clear locally regardless.
      }
    }
    setTokens(null);
    setSession(null);
    setStatus('anonymous');
  }, []);

  const refreshSession = useCallback(async () => {
    const refreshToken = getTokens()?.refreshToken;
    if (!refreshToken) {
      return;
    }
    const next = await api.publicPost<AuthSession>('/auth/refresh', { refreshToken });
    setTokens(next.tokens);
    setSession({ user: next.user, needsOnboarding: next.needsOnboarding });
    setStatus('authenticated');
  }, []);

  const value = useMemo(
    () => ({ status, session, login, logout, refreshSession }),
    [status, session, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/** The current company id, or throws — use only inside authenticated screens. */
export function useCompanyId(): string {
  const { session } = useAuth();
  if (!session?.user.companyId) {
    throw new Error('No active company');
  }
  return session.user.companyId;
}
