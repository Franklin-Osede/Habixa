import { INestApplication, VersioningType } from '@nestjs/common';

/**
 * Apply runtime configuration shared by `main.ts` and E2E tests.
 *
 * Keeping this in a single function ensures the test app behaves
 * identically to the production app (URI versioning, CORS, pipes...).
 */
export function configureApp(app: INestApplication): void {
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors();
}
