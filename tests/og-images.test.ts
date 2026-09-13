import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { products } from '@/content/products';

/** PNG IHDR: width and height are the two big-endian uint32s after the 16-byte signature+chunk header. */
function pngSize(path: string): { width: number; height: number; bytes: number } {
  const buf = readFileSync(path);
  expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bytes: statSync(path).size };
}

const MAX_BYTES = 300 * 1024;

describe('Open Graph images (BRD 7.3, ADR-020)', () => {
  const files = [
    join('public', 'og', 'default.png'),
    ...products.map((p) => join('public', 'og', 'products', `${p.slug}.png`)),
  ];

  it.each(files)('%s exists at 1200x630 under 300 kB', (file) => {
    const { width, height, bytes } = pngSize(join(process.cwd(), file));
    expect([width, height]).toEqual([1200, 630]);
    expect(bytes).toBeLessThan(MAX_BYTES);
  });
});
