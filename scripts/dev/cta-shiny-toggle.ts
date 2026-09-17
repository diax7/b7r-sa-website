// Flip the header's shiny switch on the local database (a design look; the admin does the same).
// Review server only: never point it at production, the admin's switch is the way there.
//   pnpm exec tsx scripts/dev/cta-shiny-toggle.ts on|off
import nextEnv from '@next/env';
import { getPayload } from 'payload';

nextEnv.loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const { default: config } = await import('../../src/payload.config');
  const payload = await getPayload({ config });
  const on = process.argv[2] !== 'off';
  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'ar',
    data: { ctaShiny: on },
  });
  console.log(`cta-shiny-toggle: ${on ? 'on' : 'off'}`);
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
