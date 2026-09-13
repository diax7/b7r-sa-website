/**
 * Creates the first admin user from ADMIN_EMAIL / ADMIN_PASSWORD when the users collection
 * is empty (BRD 9.3). Goes through the Local API so the password policy hooks apply. No-op
 * when a user already exists; exit 1 when the variables are missing or the policy rejects.
 */
import nextEnv from '@next/env';
import { getPayload } from 'payload';

nextEnv.loadEnvConfig(process.cwd());

const email = process.env['ADMIN_EMAIL'];
const password = process.env['ADMIN_PASSWORD'];
const name = process.env['ADMIN_NAME'] || 'Dhia';

async function main(): Promise<number> {
  // Imported after the env files are loaded: the config reads DATABASE_URL and the secret at import.
  const { default: config } = await import('../src/payload.config');
  const payload = await getPayload({ config });
  const { totalDocs } = await payload.count({ collection: 'users' });
  if (totalDocs > 0) {
    console.warn(`admin:create: ${totalDocs} user(s) exist; nothing to do.`);
    return 0;
  }
  if (!email || !password) {
    console.error(
      'admin:create: ADMIN_EMAIL and ADMIN_PASSWORD are required on an empty database.',
    );
    return 1;
  }
  await payload.create({ collection: 'users', data: { email, password, name, role: 'admin' } });
  console.warn(`admin:create: admin ${email} created.`);
  return 0;
}

try {
  process.exit(await main());
} catch (error) {
  console.error('admin:create failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
