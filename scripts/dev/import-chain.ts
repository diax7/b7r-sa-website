/**
 * Prints the static import chains from a module to `server-only` (a dev check for the
 * Payload config's graph, which the CLI loads under plain Node): `pnpm tsx
 * scripts/dev/import-chain.ts src/modules/cms/index.ts`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = process.cwd();
const start = resolve(root, process.argv[2] ?? 'src/modules/cms/index.ts');

function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = join(root, 'src', spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(from), spec);
  else return null;
  for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
    try {
      readFileSync(`${base}${ext}`);
      return `${base}${ext}`;
    } catch {
      // try the next extension
    }
  }
  return null;
}

const seen = new Set<string>();
const found: string[][] = [];

function walk(file: string, chain: string[]): void {
  if (seen.has(file)) return;
  seen.add(file);
  const source = readFileSync(file, 'utf8');
  // Static imports only: `import(...)` is loaded on demand and is fine.
  const re = /^\s*(?:import|export)\s[^;]*?from\s+['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]/gm;
  for (const m of source.matchAll(re)) {
    const spec = m[1] ?? m[2] ?? '';
    if (spec === 'server-only') {
      found.push([...chain, file]);
      continue;
    }
    const next = resolveImport(file, spec);
    if (next) walk(next, [...chain, file]);
  }
}

walk(start, []);
if (found.length === 0) console.warn('no static chain to server-only');
for (const chain of found) {
  console.warn(chain.map((f) => f.replace(root, '').replaceAll('\\', '/')).join('\n  -> '));
  console.warn('  -> server-only\n');
}
