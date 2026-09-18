/**
 * What `media-blur.ts` and `media-requality.ts` share: the target environment, a Payload
 * instance, the admin the writes run as, and a media document's bytes wherever they live.
 * Not a script of its own.
 */
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import nextEnv from '@next/env';
import { getPayload, type Payload } from 'payload';
import type { Media, User } from '../src/payload-types';

/**
 * `--env <file>` points the script at another database and bucket (production:
 * `.env.cranl.local`): every `KEY=value` row of that file becomes the environment, nothing
 * else is read. Without it the usual env files apply (the review database).
 */
export function loadEnvironment(argv: string[], usage: string): void {
  const flag = argv.indexOf('--env');
  if (flag === -1) {
    nextEnv.loadEnvConfig(process.cwd());
    return;
  }
  const file = argv[flag + 1];
  if (!file || file.startsWith('--')) {
    console.error(usage);
    process.exit(2);
  }
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m) process.env[m[1]!] = m[2]!.trim();
  }
}

export async function openPayload(): Promise<Payload> {
  const { default: config } = await import('../src/payload.config');
  const payload = await getPayload({ config });
  const host = new URL(process.env['DATABASE_URL'] ?? 'postgres://x').hostname;
  const media = process.env['S3_BUCKET'] ? `bucket ${process.env['S3_BUCKET']}` : 'public/media';
  console.log(`database at ${host}, media in ${media}`);
  return payload;
}

/** The first admin, so a write runs under the access rules and is stamped as that person. */
export async function adminUser(payload: Payload): Promise<User> {
  const { docs } = await payload.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
    limit: 1,
    depth: 0,
  });
  const admin = docs[0];
  if (!admin) throw new Error('no admin user in this database (pnpm admin:create)');
  return admin;
}

/** Every media document, oldest first, without relations. */
export async function allMedia(payload: Payload): Promise<Media[]> {
  const { docs } = await payload.find({
    collection: 'media',
    limit: 1000,
    sort: 'id',
    depth: 0,
    pagination: false,
  });
  return docs;
}

/**
 * The stored file of a media document: fetched from its URL when that is absolute (the
 * production bucket, through its CDN), read from `public/media` otherwise.
 */
export async function mediaBytes(doc: Media): Promise<Buffer> {
  const url = doc.url ?? '';
  const filename = doc.filename ?? '';
  if (/^https?:\/\//.test(url) && !url.startsWith(`${process.env['PAYLOAD_PUBLIC_SERVER_URL']}/`)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${filename}: ${response.status} from ${url}`);
    return Buffer.from(await response.arrayBuffer());
  }
  return readFile(join(process.cwd(), 'public', 'media', filename));
}

export const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`;
