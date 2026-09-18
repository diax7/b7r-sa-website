/**
 * Re-uploads the media library's photos at the new encode (ADR-029, amended 2026-09-19).
 * For every media document whose file is one `pnpm assets` derives from `resources/`
 * (products as `{slug}-{colour}-{side}.jpg`, the hero sets, the blog covers, the about
 * banner, the 3D icons, the names the seed gave them) it uploads the regenerated file from
 * `public/images` through the Local API as the admin, so the hooks run and the blur-up
 * placeholder is computed in the same pass. Run `pnpm assets` first.
 *
 * The file gets a **new name** (`{name}-{8 hex of its sha256}.jpg`): the bucket's CDN caches
 * an object for a year as immutable and the image optimizer caches its transforms by URL
 * for as long, so a replacement under the old name would serve the old bytes (RUNBOOK,
 * "Assets"). Payload deletes the old file itself; the renditions the old config generated
 * beside it (`{name}-400x400.jpg`, ...) are listed and deleted here, since the document no
 * longer knows them. A document whose stored size equals the regenerated file is already
 * at this encode and is skipped, so a second run changes nothing.
 *
 *   pnpm exec tsx scripts/media-requality.ts [--env .env.cranl.local] [--dry-run]
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, unlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import type { Media } from '../src/payload-types';
import { adminUser, allMedia, kb, loadEnvironment, openPayload } from './media-shared';

const USAGE = 'usage: tsx scripts/media-requality.ts [--env <file>] [--dry-run]';
loadEnvironment(process.argv, USAGE);
const dryRun = process.argv.includes('--dry-run');

const PHOTO_FOLDERS = ['hero', 'hero-en', 'lifestyle', 'icons-3d'];
const HASH_SUFFIX = /-[0-9a-f]{8}(?=\.[a-z]+$)/;

/** The regenerated files by the media name the seed gives them (`{folder}-{file}`). */
function sources(): Map<string, string> {
  const root = join(process.cwd(), 'public', 'images');
  const folders = PHOTO_FOLDERS.map((f) => join(root, f));
  for (const slug of readdirSync(join(root, 'products')))
    folders.push(join(root, 'products', slug));
  const out = new Map<string, string>();
  for (const folder of folders) {
    for (const file of readdirSync(folder)) {
      if (!file.endsWith('.jpg')) continue;
      out.set(`${basename(folder)}-${file}`, join(folder, file));
    }
  }
  return out;
}

/** The seed's name of a document's file, with a hash suffix from an earlier run removed. */
const seedName = (filename: string): string => filename.replace(HASH_SUFFIX, '');

function hashedName(filename: string, bytes: Buffer): string {
  const ext = extname(filename);
  const stem = basename(seedName(filename), ext);
  return `${stem}-${createHash('sha256').update(bytes).digest('hex').slice(0, 8)}${ext}`;
}

/** `{stem}-{w}x{h}.{ext}`: a rendition of the old config beside the file. */
function renditionPattern(filename: string): RegExp {
  const ext = extname(filename);
  const stem = basename(filename, ext).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${stem}-\\d+x\\d+${ext.replace('.', '\\.')}$`);
}

interface Store {
  renditionsOf(doc: Media): Promise<string[]>;
  remove(keys: string[]): Promise<void>;
}

function localStore(): Store {
  const dir = join(process.cwd(), 'public', 'media');
  return {
    async renditionsOf(doc) {
      const pattern = renditionPattern(doc.filename ?? '');
      return readdirSync(dir).filter((name) => pattern.test(name));
    },
    async remove(names) {
      for (const name of names) unlinkSync(join(dir, name));
    },
  };
}

interface S3Sdk {
  S3Client: new (config: object) => {
    send: (command: unknown) => Promise<{ Contents?: Array<{ Key?: string }> }>;
  };
  ListObjectsV2Command: new (input: { Bucket: string; Prefix: string }) => unknown;
  DeleteObjectsCommand: new (input: {
    Bucket: string;
    Delete: { Objects: Array<{ Key: string }> };
  }) => unknown;
}

/** The bucket, through the SDK the storage plugin ships (as `scripts/dev/media-to-bucket.mjs`). */
async function bucketStore(): Promise<Store> {
  const require = createRequire(import.meta.url);
  const plugin = dirname(require.resolve('@payloadcms/storage-s3'));
  const sdk = (await import(
    pathToFileURL(require.resolve('@aws-sdk/client-s3', { paths: [plugin] })).href
  )) as S3Sdk;
  const bucket = process.env['S3_BUCKET'] ?? '';
  const client = new sdk.S3Client({
    region: process.env['S3_REGION'] || 'auto',
    endpoint: process.env['S3_ENDPOINT'],
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env['S3_ACCESS_KEY_ID'],
      secretAccessKey: process.env['S3_SECRET_ACCESS_KEY'],
    },
  });
  return {
    async renditionsOf(doc) {
      const prefix = doc.prefix ? `${doc.prefix}/` : '';
      const stem = basename(doc.filename ?? '', extname(doc.filename ?? ''));
      const pattern = renditionPattern(doc.filename ?? '');
      const listed = await client.send(
        new sdk.ListObjectsV2Command({ Bucket: bucket, Prefix: `${prefix}${stem}-` }),
      );
      return (listed.Contents ?? [])
        .map((o) => o.Key ?? '')
        .filter((key) => pattern.test(key.slice(prefix.length)));
    },
    async remove(keys) {
      if (keys.length === 0) return;
      await client.send(
        new sdk.DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        }),
      );
    },
  };
}

async function main(): Promise<void> {
  const payload = await openPayload();
  const user = await adminUser(payload);
  const store = process.env['S3_BUCKET'] ? await bucketStore() : localStore();
  const files = sources();
  const docs = await allMedia(payload);
  let changed = 0;
  let current = 0;
  let unmatched = 0;
  let oldBytes = 0;
  let newBytes = 0;
  for (const doc of docs) {
    const filename = doc.filename ?? '';
    const source = files.get(seedName(filename));
    if (!source) {
      unmatched += 1;
      continue;
    }
    const bytes = readFileSync(source);
    if (doc.filesize === bytes.length) {
      current += 1;
      continue;
    }
    const meta = await sharp(bytes).metadata();
    const name = hashedName(filename, bytes);
    const renditions = await store.renditionsOf(doc);
    oldBytes += doc.filesize ?? 0;
    newBytes += bytes.length;
    console.log(
      `  ${doc.id} ${filename} ${kb(doc.filesize ?? 0)} ${doc.width}x${doc.height}` +
        ` -> ${name} ${kb(bytes.length)} ${meta.width}x${meta.height}` +
        `, ${renditions.length} rendition(s) to delete${dryRun ? ' (dry run)' : ''}`,
    );
    if (dryRun) {
      changed += 1;
      continue;
    }
    await payload.update({
      collection: 'media',
      id: doc.id,
      data: {},
      file: { data: bytes, name, mimetype: 'image/jpeg', size: bytes.length },
      overwriteExistingFiles: true,
      overrideAccess: false,
      user,
    });
    await store.remove(renditions);
    const after = await payload.findByID({ collection: 'media', id: doc.id, depth: 0 });
    if (after.filename !== name) {
      throw new Error(`${doc.id}: Payload stored ${after.filename}, not ${name}; stopping`);
    }
    console.log(
      `     stored as ${after.filename}, ${kb(after.filesize ?? 0)}, blur ${after.blur ? `${after.blur.length} chars` : 'missing'}`,
    );
    changed += 1;
  }
  console.log(
    `media-requality: ${changed} ${dryRun ? 'would change' : 'changed'}, ${current} already at this encode, ` +
      `${unmatched} without a source in public/images, ${docs.length} documents; ` +
      `${kb(oldBytes)} -> ${kb(newBytes)} stored`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
