/**
 * Before the review database is dumped for production (RUNBOOK "Deploy", step 4): remove
 * what belongs to the tests, not to the site. The Mock connection and its citations and
 * runs, the failed jobs, and the CI analytics ids (`scripts/ci/analytics-ids.ts`), which
 * must never reach b7r.sa. Idempotent; prints what it removed.
 */
import nextEnv from '@next/env';
import { getPayload } from 'payload';

nextEnv.loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const { default: config } = await import('../../src/payload.config');
  const payload = await getPayload({ config });

  const mocks = await payload.find({
    collection: 'connections',
    where: { kind: { equals: 'mock' } },
    limit: 100,
    depth: 0,
  });
  for (const mock of mocks.docs) {
    const citations = await payload.delete({
      collection: 'citations',
      where: { connection: { equals: mock.id } },
    });
    await payload.delete({ collection: 'connections', id: mock.id });
    console.log(`removed the mock connection ${mock.id} and ${citations.docs.length} citations`);
  }

  const failed = await payload.delete({
    collection: 'payload-jobs',
    where: { hasError: { equals: true } },
  });
  console.log(`removed ${failed.docs.length} failed jobs`);

  const site = await payload.findGlobal({ slug: 'site-settings', depth: 0 });
  if (site.analytics?.gaId === 'G-TEST00000' || site.analytics?.umamiSrc === '/umami-test.js') {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { analytics: { gaId: null, umamiSrc: null, umamiId: null } },
    });
    console.log('cleared the CI analytics ids from the site settings');
  }
  console.log('prelaunch-clean: done');
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
