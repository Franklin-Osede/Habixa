import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import apiClient from '../api.client';
import {
  AuthTokens,
  setTokens,
  clearTokens,
  getRefreshToken,
  getAccessToken,
} from './tokenStore';
import { setUnauthorizedHandler } from './authEvents';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  /** True when a previously-valid session was lost (token expired / refresh
   *  failed) — as opposed to a first-time visitor who never logged in. Lets the
   *  welcome route send these users to /login instead of the marketing screen. */
  expired: boolean;
  /** Persist a token pair obtained from login/register and mark the session live. */
  signIn: (tokens: AuthTokens) => Promise<void>;
  /** Revoke the refresh family server-side (best-effort) and drop the session. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [expired, setExpired] = useState(false);

  const signIn = useCallback(async (tokens: AuthTokens) => {
    await setTokens(tokens);
    setExpired(false);
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
    setExpired(false); // deliberate logout — not an expiry
    setStatus('unauthenticated');
  }, []);

  // Bootstrap: never trust a stored access token blindly. Exchange the refresh
  // token for a fresh pair — the server is the authority on session validity.
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        // No refresh token. If a stale access token is lying around, this is a
        // dead/old session (e.g. from before refresh tokens existed) → expired.
        // Otherwise it is a genuine first-time visitor.
        const staleAccess = await getAccessToken();
        if (staleAccess) {
          await clearTokens();
          if (!cancelled) setExpired(true);
        }
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
      } catch (err) {
        // A refresh token was present but the exchange failed. Only treat it as
        // an expired session (→ send to /login) when the server actually
        // rejected it (401/400). On a network/5xx blip, keep the tokens so a
        // transient outage does not silently log the user out.
        const status = (err as { response?: { status?: number } })?.response?.status;
        const rejected = status === 401 || status === 400;
        if (rejected) {
          await clearTokens();
          if (!cancelled) setExpired(true);
        }
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
    setUnauthorizedHandler(() => {
      // The interceptor only calls this after a refresh attempt failed on a
      // real 401 — i.e. a live session just died. Mark it expired so every
      // route (incl. the "/" welcome) funnels the user to /login.
      setExpired(true);
      setStatus('unauthenticated');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <AuthContext.Provider value={{ status, expired, signIn, signOut }}>
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
