import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { BRAND_PRIMARY_HEX } from '@/lib/tokens';

it('BRAND_PRIMARY_HEX mirrors --color-primary in globals.css', () => {
  const css = readFileSync(join(process.cwd(), 'src', 'styles', 'globals.css'), 'utf8');
  const match = /--color-primary:\s*(#[0-9a-fA-F]{6});/.exec(css);
  expect(match?.[1]?.toLowerCase()).toBe(BRAND_PRIMARY_HEX.toLowerCase());
});
