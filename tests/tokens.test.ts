import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { BRAND_PRIMARY_HEX, TOKEN_HEX } from '@/lib/tokens';

const css = readFileSync(join(process.cwd(), 'src', 'styles', 'globals.css'), 'utf8');

function cssToken(name: string): string | undefined {
  return new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6});`).exec(css)?.[1]?.toLowerCase();
}

it('BRAND_PRIMARY_HEX mirrors --color-primary in globals.css', () => {
  expect(cssToken('primary')).toBe(BRAND_PRIMARY_HEX.toLowerCase());
});

it('every TOKEN_HEX entry mirrors its --color-* token', () => {
  for (const [name, hex] of Object.entries(TOKEN_HEX)) {
    expect(cssToken(name), `--color-${name}`).toBe(hex.toLowerCase());
  }
});
