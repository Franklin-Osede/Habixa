import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { getAccessToken, setTokens, clearTokens, getRefreshToken } from './auth/tokenStore';
import { notifyUnauthorized } from './auth/authEvents';

// Use localhost for iOS simulator, or specific IP for Android emulator/Physical device.
// Port 3008 matches backend; `/v1` prefix is enforced globally by NestJS URI versioning.
const DEV_API_URL = Platform.select({
  ios: 'http://localhost:3008/v1',
  android: 'http://10.0.2.2:3008/v1',
  default: 'http://localhost:3008/v1',
});

const apiClient = axios.create({
  baseURL: DEV_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Auth endpoints must never be retried/refreshed — refreshing on a failed login
// or on the refresh call itself would loop.
const AUTH_ROUTES = /\/auth\/(login|refresh|logout)|\/identity\/register/;

// Interceptor to inject the access token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---- Single-flight refresh --------------------------------------------------
// Concurrent 401s must trigger exactly ONE refresh; everyone else awaits it.
// Firing N refreshes in parallel would rotate the token N times and the backend
// reuse-detection would (rightly) nuke the family, logging the user out.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;
      try {
        // Bare axios (no interceptors) so a 401 here can't recurse.
        const { data } = await axios.post(`${DEV_API_URL}/auth/refresh`, {
          refreshToken,
        });
        await setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        return data.accessToken as string;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Interceptor to transparently refresh on 401, then hand off to login if it fails
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    if (status === 401 && original && !original._retry && !AUTH_ROUTES.test(url)) {
      original._retry = true;

      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(original);
      }

      // Refresh failed → the session is over. Clear and let the app route to login.
      await clearTokens();
      notifyUnauthorized();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
