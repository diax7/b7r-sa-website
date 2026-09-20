import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `next.config.ts` is transpiled by Next with SWC before anything else runs, and an `@/`
 * alias inside a module it imports is rewritten against the project root, so a nested
 * module's `@/lib/photo` becomes `./src/lib/photo` resolved from `src/lib/`: the config
 * fails to load and the build stops. tsc, oxlint and vitest all resolve the alias, so only
 * the build sees it (ADR-064, the 2026-09-20 review). This walks every module the config
 * reaches through `./src/…` and its relative imports and refuses a value import through
 * the alias; a `type` import is erased and safe.
 */
const ROOT = resolve(__dirname, '..');
const IMPORT = /^import\s+(type\s+)?[^'"]*?from\s+'([^']+)'/gm;

function localImports(file: string): Array<{ type: boolean; from: string }> {
  const source = readFileSync(file, 'utf8');
  return [...source.matchAll(IMPORT)].map((m) => ({ type: Boolean(m[1]), from: m[2]! }));
}

function reachableFrom(entry: string): string[] {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const { from } of localImports(file)) {
      if (!from.startsWith('./') && !from.startsWith('../')) continue;
      queue.push(resolve(dirname(file), `${from}.ts`));
    }
  }
  return [...seen];
}

describe('the modules next.config.ts reaches', () => {
  const config = resolve(ROOT, 'next.config.ts');
  const modules = reachableFrom(config).filter((f) => f !== config);

  it('are more than none, and none imports a value through the @/ alias', () => {
    expect(modules.length).toBeGreaterThan(2);
    const offenders = modules.flatMap((file) =>
      localImports(file)
        .filter(({ type, from }) => !type && from.startsWith('@/'))
        .map(({ from }) => `${file.slice(ROOT.length + 1)} imports ${from}`),
    );
    expect(offenders).toEqual([]);
  });

  it('gives the image config the rendition ladder, one candidate per file (ADR-064)', () => {
    const source = readFileSync(config, 'utf8');
    expect(source).toContain('deviceSizes: [...DEVICE_SIZES]');
    expect(source).toContain('imageSizes: [...IMAGE_SIZES]');
    expect(modules).toContain(resolve(ROOT, 'src/lib/renditions.ts'));
  });
});
