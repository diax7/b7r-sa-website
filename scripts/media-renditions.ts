/**
 * Generates the renditions (ADR-064) of every media document that lacks any: the stored
 * file (read from `public/media` locally, fetched from the bucket on production) is saved
 * again under its own name through the Local API as the admin, so Payload encodes the
 * ladder of `src/lib/renditions.ts` and the storage plugin uploads each size beside the
 * original; the blur is recomputed to the same value, the name and the URL do not change.
 * Idempotent: a document holding every size name is skipped unless `--force`, so the
 * production build runs it after the migration on every deploy (`railpack.json`, the
 * Dockerfile) and pays nothing when there is nothing to do. A document uploaded on the
 * old code, and one saved between the migration and a deploy, are both healed by the
 * next run. Prints what it changed; a failure is reported per document and the run goes on,
 * so a systematic one reads as one line per photo, and the exit code fails the build.
 *
 *   pnpm exec tsx scripts/media-renditions.ts [--env .env.cranl.local] [--dry-run] [--force]
 */
import { missingRenditions, RENDITION_NAMES } from '../src/lib/renditions';
import { adminUser, allMedia, kb, loadEnvironment, mediaBytes, openPayload } from './media-shared';

const USAGE = 'usage: tsx scripts/media-renditions.ts [--env <file>] [--dry-run] [--force]';
loadEnvironment(process.argv, USAGE);
const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

async function main(): Promise<void> {
  const payload = await openPayload();
  const docs = await allMedia(payload);
  const todo = docs.filter((doc) => force || missingRenditions(doc).length > 0);
  if (todo.length === 0) {
    console.log(`media-renditions: every document holds its ${RENDITION_NAMES.length} renditions`);
    process.exit(0);
  }
  const user = await adminUser(payload);
  let changed = 0;
  let failed = 0;
  for (const doc of todo) {
    const missing = force ? RENDITION_NAMES.length : missingRenditions(doc).length;
    try {
      const started = Date.now();
      const bytes = await mediaBytes(doc);
      console.log(
        `  ${doc.id} ${doc.filename} ${kb(bytes.length)} ${doc.width}x${doc.height}: ${missing} to generate${dryRun ? ' (dry run)' : ''}`,
      );
      if (dryRun) {
        changed += 1;
        continue;
      }
      const after = await payload.update({
        collection: 'media',
        id: doc.id,
        data: {},
        file: {
          data: bytes,
          name: doc.filename ?? '',
          mimetype: doc.mimeType ?? '',
          size: bytes.length,
        },
        overwriteExistingFiles: true,
        overrideAccess: false,
        user,
      });
      if (after.filename !== doc.filename) {
        throw new Error(`Payload stored ${after.filename}, not ${doc.filename}`);
      }
      const left = missingRenditions(after);
      if (left.length > 0) throw new Error(`still missing ${left.join(', ')}`);
      const total = Object.values(after.sizes ?? {}).reduce((n, s) => n + (s?.filesize ?? 0), 0);
      console.log(
        `    ${RENDITION_NAMES.length} renditions, ${kb(total)}, ${Date.now() - started} ms`,
      );
      changed += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `  ${doc.id} ${doc.filename}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
  console.log(
    `media-renditions: ${changed} generated, ${docs.length - todo.length} complete already, ${failed} failed, ${docs.length} documents`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
