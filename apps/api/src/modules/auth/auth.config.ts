/**
 * Centralised auth configuration with fail-fast validation.
 *
 * The JWT secret must never fall back to a hard-coded value in production —
 * a known secret means anyone can forge access tokens. In non-production we
 * allow a dev fallback so local/test runs work without a .env.
 */

import type { JwtSignOptions } from '@nestjs/jwt';

/** The `ms`-style value accepted by `expiresIn` (e.g. "15m", "1h"). */
type ExpiresIn = JwtSignOptions['expiresIn'];

const DEV_SECRET_FALLBACK = 'dev-only-insecure-secret';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'JWT_SECRET is required in production. Refusing to start with an insecure fallback.',
      );
    }
    return DEV_SECRET_FALLBACK;
  }
  return secret;
}

/** Access token TTL, e.g. "15m", "1h". Defaults to 15m. */
export function getAccessTtl(): ExpiresIn {
  return (process.env.JWT_ACCESS_TTL || '15m') as ExpiresIn;
}

/** Refresh token lifetime in days. Defaults to 30. */
export function getRefreshTtlDays(): number {
  const raw = process.env.JWT_REFRESH_TTL_DAYS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

/**
 * Grace window (ms) during which a *just-rotated* refresh token is not treated
 * as a reuse attack. Absorbs benign concurrent double-submits (e.g. two tabs)
 * that slip past the frontend single-flight guard. Defaults to 10s.
 */
export function getRefreshGraceMs(): number {
  const raw = process.env.JWT_REFRESH_GRACE_MS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 10_000;
}
