import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import apiClient from '../api.client';
import { AuthTokens, setTokens, clearTokens, getRefreshToken } from './tokenStore';
import { setUnauthorizedHandler } from './authEvents';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  /** Persist a token pair obtained from login/register and mark the session live. */
  signIn: (tokens: AuthTokens) => Promise<void>;
  /** Revoke the refresh family server-side (best-effort) and drop the session. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');

  const signIn = useCallback(async (tokens: AuthTokens) => {
    await setTokens(tokens);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      // Works even with an expired access token; ignore network/status errors.
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch {
        /* best-effort */
      }
    }
    await clearTokens();
    setStatus('unauthenticated');
  }, []);

  // Bootstrap: never trust a stored access token blindly. Exchange the refresh
  // token for a fresh pair — the server is the authority on session validity.
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }
      try {
        // /auth/refresh is an AUTH_ROUTE, so the interceptor won't recurse on 401.
        const { data } = await apiClient.post('/auth/refresh', { refreshToken });
        await setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        if (!cancelled) setStatus('authenticated');
      } catch {
        await clearTokens();
        if (!cancelled) setStatus('unauthenticated');
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // Let the axios interceptor drop us to unauthenticated when a refresh fails
  // mid-session; the route guards react to the status change.
  useEffect(() => {
    setUnauthorizedHandler(() => setStatus('unauthenticated'));
    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <AuthContext.Provider value={{ status, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
