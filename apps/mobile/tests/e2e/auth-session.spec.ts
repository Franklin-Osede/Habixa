import { test, expect } from '@playwright/test';

/**
 * Runtime smoke of the session lifecycle that the mobile PR reworked:
 *   dev login → tokens persisted → protected tab renders
 *   → transparent recovery when the access token is bad but refresh is valid
 *   → hard logout to /login?expired=1 when the refresh token is invalid.
 *
 * Uses the real `/ruta` tab (not `/`) so the (tabs) route guard is exercised.
 */
test('auth session: login, transparent refresh, and expired-session redirect', async ({
  page,
}) => {
  test.setTimeout(90_000);

  // 1) Dev login persists BOTH tokens and leaves the auth screen.
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.getByText('Continuar Modo Dev')).toBeVisible({ timeout: 15_000 });
  await page.getByText('Continuar Modo Dev').click();

  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            !!localStorage.getItem('user_token') &&
            !!localStorage.getItem('refresh_token'),
        ),
      { timeout: 20_000 },
    )
    .toBe(true);
  expect(page.url()).not.toContain('/login');

  // 2) Transparent recovery: a bad access token + valid refresh must NOT log the
  //    user out — the session machinery exchanges the refresh for a fresh pair.
  const BROKEN = 'eyJhbGciOiJIUzI1NiJ9.broken.broken';
  await page.evaluate((v) => localStorage.setItem('user_token', v), BROKEN);
  await page.goto('/ruta');

  // Wait for the broken access token to be rotated away (proves a refresh ran).
  await expect
    .poll(
      async () => {
        const t = await page.evaluate(() => localStorage.getItem('user_token'));
        return t && t !== BROKEN ? 'rotated' : 'pending';
      },
      { timeout: 20_000 },
    )
    .toBe('rotated');
  expect(page.url()).not.toContain('/login');
  const recoveredAccess = await page.evaluate(() =>
    localStorage.getItem('user_token'),
  );
  expect(recoveredAccess?.startsWith('eyJ')).toBe(true);

  // 3) Invalid refresh token → the guard bounces to /login?expired=1.
  await page.evaluate(() => {
    localStorage.setItem('user_token', 'x');
    localStorage.setItem('refresh_token', 'garbage-not-a-real-token');
  });
  await page.goto('/ruta');

  await expect.poll(() => page.url(), { timeout: 20_000 }).toContain('expired=1');
  await expect(page.getByText(/session expired/i)).toBeVisible({ timeout: 10_000 });
});
