import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthSession, SessionUser } from '@ekum/domain-types';
import { queryClient } from '@/app/queryClient';
import { clearBrowseShortlist } from '@/features/browse/browseShortlist';
import {
  ApiError,
  api,
  getTokens,
  isDefinitiveAuthFailure,
  onTokenChange,
  performTokenRefresh,
  setTokens,
} from './apiClient';

interface SessionState {
  user: SessionUser;
  needsOnboarding: boolean;
}

interface AuthContextValue {
  status: 'loading' | 'authenticated' | 'anonymous' | 'degraded';
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
  const loadSeq = useRef(0);
  const statusRef = useRef(status);
  statusRef.current = status;

  const loadMe = useCallback(async () => {
    const seq = ++loadSeq.current;
    if (!getTokens()?.accessToken) {
      if (seq !== loadSeq.current) return;
      setSession(null);
      setStatus('anonymous');
      return;
    }
    try {
      const me = await api.get<{ user: SessionUser; needsOnboarding: boolean }>('/auth/me');
      if (seq !== loadSeq.current) return;
      setSession({ user: me.user, needsOnboarding: me.needsOnboarding });
      setStatus('authenticated');
    } catch (err) {
      if (seq !== loadSeq.current) return;
      if (!getTokens()?.accessToken) {
        setSession(null);
        setStatus('anonymous');
        return;
      }
      if (err instanceof ApiError && isDefinitiveAuthFailure(err.statusCode, err.code)) {
        if (getTokens()?.accessToken) {
          setTokens(null);
        }
        setSession(null);
        setStatus('anonymous');
        return;
      }
      // Transient API/network failure — keep tokens; do not send user to OTP.
      setStatus((prev) => (prev === 'authenticated' ? 'authenticated' : 'degraded'));
    }
  }, []);

  useEffect(() => {
    void loadMe();
    // A 401 that fails to refresh clears tokens; reflect that as sign-out.
    return onTokenChange((next) => {
      if (!next) {
        loadSeq.current += 1;
        setSession(null);
        setStatus('anonymous');
        queryClient.clear();
        return;
      }
      // Token rotation already paired with session; skip /auth/me races after login/refresh.
      if (statusRef.current === 'authenticated') return;
      void loadMe();
    });
  }, [loadMe]);

  useEffect(() => {
    if (status !== 'degraded') return;
    const id = window.setInterval(() => {
      void loadMe();
    }, 5_000);
    return () => window.clearInterval(id);
  }, [status, loadMe]);

  const login = useCallback((incoming: AuthSession) => {
    loadSeq.current += 1;
    // Drop prior tenant cache so Home never greets the previous company.
    queryClient.clear();
    setTokens(incoming.tokens, { notify: false });
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
    loadSeq.current += 1;
    setTokens(null);
    setSession(null);
    setStatus('anonymous');
    queryClient.clear();
    clearBrowseShortlist();
  }, []);

  const refreshSession = useCallback(async () => {
    const next = await performTokenRefresh();
    if (!next) {
      if (!getTokens()?.refreshToken) {
        loadSeq.current += 1;
        setSession(null);
        setStatus('anonymous');
      }
      return;
    }
    loadSeq.current += 1;
    setTokens(next.tokens, { notify: false });
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
