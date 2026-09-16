import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The admin's components never reach the public stylesheet (ADR-039 principle 6): every
 * folder `admin.css` scans for Tailwind classes is excluded from the site's `globals.css`,
 * and every admin folder under `src/modules` is scanned by `admin.css`.
 */
const sources = (css: string, negated: boolean): string[] =>
  [...css.matchAll(/@source(?<not>\s+not)?\s+'([^']+)'/g)]
    .filter((m) => Boolean(m.groups?.['not']) === negated)
    .map((m) => m[2]!.replace(/^(\.\.\/)+/, ''));

describe('admin CSS stays out of the site (ADR-039)', () => {
  const admin = readFileSync('src/app/(payload)/admin.css', 'utf8');
  const site = readFileSync('src/styles/globals.css', 'utf8');
  it('every admin folder admin.css scans is excluded from globals.css', () => {
    const scanned = sources(admin, false).filter((s) => s.includes('admin'));
    const excluded = sources(site, true);
    expect(scanned.length).toBeGreaterThan(0);
    for (const folder of scanned) expect(excluded, folder).toContain(folder);
  });
  it('every module admin folder is scanned by admin.css', () => {
    const scanned = sources(admin, false);
    for (const folder of [
      'modules/cms/admin',
      'modules/ai-content/admin',
      'modules/connections/admin',
      'modules/traffic/admin',
    ]) {
      expect(scanned, folder).toContain(folder);
    }
  });
});
