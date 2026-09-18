/**
 * Backfills the blur-up placeholder (`blur`, ADR-029 amended 2026-09-19) of every media
 * document that has none: the same 24 px WebP data URL `stampBlur` computes on upload, from
 * the stored file (read from `public/media` locally, fetched from the bucket on production).
 * Idempotent: a document with a blur is skipped unless `--force`. Prints what it changed.
 *
 *   pnpm exec tsx scripts/media-blur.ts [--env .env.cranl.local] [--force]
 */
import { blurDataUrl } from '../src/modules/cms/hooks/blur';
import { adminUser, allMedia, loadEnvironment, mediaBytes, openPayload } from './media-shared';

const USAGE = 'usage: tsx scripts/media-blur.ts [--env <file>] [--force]';
loadEnvironment(process.argv, USAGE);
const force = process.argv.includes('--force');

async function main(): Promise<void> {
  const payload = await openPayload();
  const user = await adminUser(payload);
  const docs = await allMedia(payload);
  let changed = 0;
  let skipped = 0;
  let failed = 0;
  for (const doc of docs) {
    if (doc.blur && !force) {
      skipped += 1;
      continue;
    }
    try {
      const blur = await blurDataUrl(await mediaBytes(doc), doc.mimeType ?? '');
      if (!blur) throw new Error(`not a raster image (${doc.mimeType})`);
      await payload.update({
        collection: 'media',
        id: doc.id,
        data: { blur },
        overrideAccess: false,
        user,
      });
      changed += 1;
      console.log(`  ${doc.id} ${doc.filename}: blur ${blur.length} chars`);
    } catch (error) {
      failed += 1;
      console.error(
        `  ${doc.id} ${doc.filename}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
  console.log(
    `media-blur: ${changed} filled, ${skipped} already had one, ${failed} failed, ${docs.length} documents`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
