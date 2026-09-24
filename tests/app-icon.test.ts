// @vitest-environment node
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { appIcon } from '@/modules/core/app-icon';

/** Every distinct opaque colour of a PNG, as `r,g,b`. */
async function colours(
  png: ArrayBuffer,
): Promise<{ size: number; opaque: Set<string>; corner: number }> {
  const { data, info } = await sharp(Buffer.from(png))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const opaque = new Set<string>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 255) opaque.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
  }
  return { size: info.width, opaque, corner: data[3]! };
}

describe('an app icon (spec 010, phase 1d)', () => {
  it('is the mark in the colours it is handed, on nothing', async () => {
    const response = appIcon({ size: 192, fill: { accent: '#1a8fd0', primaryDark: '#1a4f99' } });
    expect(response.headers.get('content-type')).toBe('image/png');
    const { size, opaque, corner } = await colours(await response.arrayBuffer());
    expect(size).toBe(192);
    expect(opaque.has('26,143,208')).toBe(true);
    expect(opaque.has('26,79,153')).toBe(true);
    // Neither shipped blue survives: the artwork carries no colour of its own.
    expect(opaque.has('0,152,224')).toBe(false);
    expect(opaque.has('24,88,168')).toBe(false);
    expect(corner, 'the corner is see-through').toBe(0);
  });

  it('sits on the background it is handed: the Apple icon on the page white', async () => {
    const response = appIcon({
      size: 180,
      fill: { accent: '#1a8fd0', primaryDark: '#1a4f99' },
      background: '#ffffff',
    });
    const { size, opaque, corner } = await colours(await response.arrayBuffer());
    expect(size).toBe(180);
    expect(corner).toBe(255);
    expect(opaque.has('255,255,255')).toBe(true);
  });
});
