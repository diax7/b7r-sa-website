import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { TOKEN_HEX } from '@/lib/tokens';

const css = readFileSync(join(process.cwd(), 'src', 'styles', 'globals.css'), 'utf8');

function cssToken(name: string): string | undefined {
  return new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6});`).exec(css)?.[1]?.toLowerCase();
}

it('every TOKEN_HEX entry mirrors its --color-* token', () => {
  for (const [name, hex] of Object.entries(TOKEN_HEX)) {
    expect(cssToken(name), `--color-${name}`).toBe(hex.toLowerCase());
  }
});
