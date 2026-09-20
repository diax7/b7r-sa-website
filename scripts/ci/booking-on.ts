/**
 * CI only, before Lighthouse (ADR-063): switches the booking on so `/book` answers (it is
 * a 404 while the switch is off), after the e2e, which restores the switch to off. The
 * hours and the numbers stay the seed's.
 */
import nextEnv from '@next/env';
import { getPayload } from 'payload';

nextEnv.loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  // Imported after the env files are loaded: the config reads DATABASE_URL and the secret at import.
  const { default: config } = await import('../../src/payload.config');
  const payload = await getPayload({ config });
  await payload.updateGlobal({ slug: 'booking', data: { enabled: true } });
  console.log('booking-on: the booking switch is on');
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
