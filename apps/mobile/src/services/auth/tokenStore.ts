import { getStoredItem, setStoredItem, deleteStoredItem } from '../storage';

/**
 * Single gateway for reading/writing auth tokens. Nothing else in the app should
 * touch the raw storage keys — keeping this the only door makes the session
 * lifecycle auditable and prevents the "each screen persists the token slightly
 * differently" drift that caused the original 401 bug.
 */

const ACCESS_KEY = 'user_token';
const REFRESH_KEY = 'refresh_token';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function getAccessToken(): Promise<string | null> {
  return getStoredItem(ACCESS_KEY);
}

export function getRefreshToken(): Promise<string | null> {
  return getStoredItem(REFRESH_KEY);
}

export async function setTokens(tokens: AuthTokens): Promise<void> {
  await setStoredItem(ACCESS_KEY, tokens.accessToken);
  await setStoredItem(REFRESH_KEY, tokens.refreshToken);
}

export async function clearTokens(): Promise<void> {
  await deleteStoredItem(ACCESS_KEY);
  await deleteStoredItem(REFRESH_KEY);
}
