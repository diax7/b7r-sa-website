import 'server-only';
import { type PostgresAdapter, sql } from '@payloadcms/db-postgres';
import { cms } from '@/lib/cms/payload';
import { cmsEnv } from '@/lib/cms/env';

const DB_TIMEOUT_MS = 2000;

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`database did not answer within ${ms} ms`)), ms).unref();
  });
}

/**
 * `ok` when Postgres answers `select 1` within 2 s. A reported field of `/api/health`, never
 * a reason to fail the liveness probe: a database blip must not become a restart loop.
 */
export async function databaseStatus(): Promise<'ok' | 'error'> {
  try {
    const payload = await cms();
    // The generic adapter type hides the driver; this project only ever runs on Postgres.
    const { drizzle } = payload.db as unknown as Pick<PostgresAdapter, 'drizzle'>;
    await Promise.race([drizzle.execute(sql`select 1`), timeout(DB_TIMEOUT_MS)]);
    return 'ok';
  } catch (error) {
    console.error('health: database check failed:', error);
    return 'error';
  }
}

/** Where uploads live: S3 when the bucket is configured, else the container's disk. */
export function mediaStorage(): 's3' | 'local' {
  return cmsEnv().s3 ? 's3' : 'local';
}
