/**
 * Single-flight coordinator for token refresh — deliberately pure (no axios,
 * no React Native) so it can be unit-tested in isolation.
 *
 * The invariant it protects: while a refresh is in flight, every concurrent
 * caller awaits that SAME promise instead of starting its own. Firing N
 * refreshes for N concurrent 401s would rotate the refresh token N times and
 * trip the backend reuse-detection, logging the user out.
 */

let inFlight: Promise<string | null> | null = null;

export function singleFlightRefresh(
  doRefresh: () => Promise<string | null>,
): Promise<string | null> {
  if (!inFlight) {
    inFlight = doRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/** Test-only: reset the shared in-flight state between cases. */
export function __resetSingleFlight(): void {
  inFlight = null;
}
