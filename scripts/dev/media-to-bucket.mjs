// One-off for the launch (RUNBOOK "Deploy", step 4): copy the local uploads (public/media)
// into the production bucket under the `media/` prefix the rows already carry. Reads the
// bucket and its credentials from an env file given as the first argument (never printed);
// skips objects that already exist with the same size; usable again for a re-sync.
//   node scripts/dev/media-to-bucket.mjs .env.cranl.local
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// The SDK is a dependency of the storage plugin (pnpm keeps it under .pnpm), so resolve it
// from the plugin's own folder.
const require = createRequire(import.meta.url);
const storageS3 = dirname(require.resolve('@payloadcms/storage-s3'));
const { HeadObjectCommand, PutObjectCommand, S3Client } = await import(
  pathToFileURL(require.resolve('@aws-sdk/client-s3', { paths: [storageS3] })).href
);

const envFile = process.argv[2];
if (!envFile) {
  console.error('usage: node scripts/dev/media-to-bucket.mjs <env file>');
  process.exit(2);
}
const env = Object.fromEntries(
  readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1).trim()];
    }),
);
for (const name of ['S3_BUCKET', 'S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']) {
  if (!env[name] || env[name].includes('<')) {
    console.error(`media-to-bucket: ${name} is missing or still a placeholder in ${envFile}`);
    process.exit(2);
  }
}

const client = new S3Client({
  region: env['S3_REGION'] || 'auto',
  endpoint: env['S3_ENDPOINT'],
  forcePathStyle: true,
  credentials: {
    accessKeyId: env['S3_ACCESS_KEY_ID'],
    secretAccessKey: env['S3_SECRET_ACCESS_KEY'],
  },
});
const types = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
};

const dir = join(process.cwd(), 'public', 'media');
const files = readdirSync(dir).filter((name) => statSync(join(dir, name)).isFile());
let uploaded = 0;
let kept = 0;
for (const name of files) {
  const key = `media/${name}`;
  const size = statSync(join(dir, name)).size;
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: env['S3_BUCKET'], Key: key }));
    if (head.ContentLength === size) {
      kept += 1;
      continue;
    }
  } catch {
    // Not there yet.
  }
  await client.send(
    new PutObjectCommand({
      Bucket: env['S3_BUCKET'],
      Key: key,
      Body: readFileSync(join(dir, name)),
      ContentType: types[extname(name).toLowerCase()] ?? 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  uploaded += 1;
  if (uploaded % 100 === 0) console.log(`  ${uploaded} uploaded`);
}
console.log(`media-to-bucket: ${uploaded} uploaded, ${kept} already there, ${files.length} files`);
