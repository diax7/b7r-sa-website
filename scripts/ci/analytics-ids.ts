/**
 * CI only: the analytics ids live in the admin (ADR-052), so the seeded database gets the
 * test values the e2e and Lighthouse expect: a dummy GA4 id so the consent path runs and the
 * budgets measure the production shape, and the Umami stand-in on the site's own origin,
 * which records calls instead of sending them.
 */
import nextEnv from '@next/env';
import { getPayload } from 'payload';

nextEnv.loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  // Imported after the env files are loaded: the config reads DATABASE_URL and the secret at import.
  const { default: config } = await import('../../src/payload.config');
  const payload = await getPayload({ config });
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { analytics: { gaId: 'G-TEST00000', umamiSrc: '/umami-test.js', umamiId: 'test' } },
  });
  console.log('analytics-ids: the test ids are in the site settings');
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
