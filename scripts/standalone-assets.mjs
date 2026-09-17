// After `next build` with `output: 'standalone'`: the standalone folder holds the server and
// the traced node_modules but not the static assets or /public; copy them in so
// `node .next/standalone/server.js` serves the whole site (the Dockerfile does the same with
// COPY). Run by the Railpack build step (railpack.json) and usable by hand.
import { cpSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';

const root = process.cwd();
const standalone = join(root, '.next', 'standalone');
if (!existsSync(join(standalone, 'server.js'))) {
  console.error(
    'standalone-assets: .next/standalone/server.js is missing; run `pnpm build` first.',
  );
  process.exit(1);
}
cpSync(join(root, '.next', 'static'), join(standalone, '.next', 'static'), { recursive: true });
// Local uploads (public/media) are development only; production media lives in the bucket.
const localUploads = join(root, 'public', 'media') + sep;
cpSync(join(root, 'public'), join(standalone, 'public'), {
  recursive: true,
  filter: (source) => !(source + sep).startsWith(localUploads),
});
console.log('standalone-assets: static assets and /public copied into .next/standalone');
