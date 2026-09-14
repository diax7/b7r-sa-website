/**
 * Writes BRD Appendix H (docs/brd-sections/09-english-copy-bank.md) from the English copy
 * bank (ADR-043): `pnpm copy:appendix`, then `python docs/build-brd.py` and copy the root
 * BRD to docs/. `tests/content-verbatim.test.ts` fails until the two agree, so a change to
 * `content/copy/en.ts` always lands in the BRD.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '../src/content/copy/en';

function* rows(value: unknown, prefix = ''): Generator<[string, string]> {
  if (typeof value === 'string') {
    yield [prefix, value];
  } else if (Array.isArray(value)) {
    yield [prefix, value.join(' · ')];
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      yield* rows(child, prefix ? `${prefix}.${key}` : key);
    }
  }
}

/** A punctuation-only value (the list separator) is shown as code, so the table never holds a bare comma. */
function cell(value: string): string {
  const escaped = value.replaceAll('|', String.raw`\|`);
  return /^[\s\p{P}]+$/u.test(value) ? `\`${escaped}\`` : escaped;
}

const lines = [
  '## 14. Appendix H: The English copy bank (Level 5, ADR-043)',
  '',
  'Every interface string of the English site, key for key with the Arabic bank of §4 (`src/content/copy/en.ts`, written to this table by `pnpm copy:appendix`); `tests/content-verbatim.test.ts` checks the code against this table. Brand in English: "B7R Print". The CMS content in English (products, pages, FAQ, home, settings) is seeded content owed Dhia\'s read (Appendix G pattern). Placeholders in braces are filled by the code.',
  '',
  '| Key | English |',
  '|---|---|',
  ...[...rows(en)].map(([key, value]) => `| \`${key}\` | ${cell(value)} |`),
];
const out = join(process.cwd(), 'docs', 'brd-sections', '09-english-copy-bank.md');
writeFileSync(out, `${lines.join('\n')}\n`);
console.warn(`copy:appendix: ${lines.length - 6} rows written to ${out}`);
