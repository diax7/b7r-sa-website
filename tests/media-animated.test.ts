import type { PayloadRequest } from 'payload';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { frameCount, refuseAnimated } from '@/modules/cms/hooks/animated';
import { Media } from '@/modules/cms/collections/media';

/** A 8x8 solid frame as raw pixels. */
function frame(shade: number): Buffer {
  return Buffer.alloc(8 * 8 * 3, shade);
}

async function stillWebp(): Promise<Buffer> {
  return sharp(frame(40), { raw: { width: 8, height: 8, channels: 3 } })
    .webp()
    .toBuffer();
}

/** Two frames stacked, joined as an animation: what an animated WebP upload reaches the hook as. */
async function animatedWebp(): Promise<Buffer> {
  const pages = Buffer.concat([frame(40), frame(200)]);
  return sharp(pages, { raw: { width: 8, height: 16, channels: 3, pageHeight: 8 } })
    .webp({ loop: 0 })
    .toBuffer();
}

type Hook = (args: {
  args: Record<string, unknown>;
  operation: string;
  req: PayloadRequest;
}) => Promise<unknown>;
const hook = refuseAnimated as unknown as Hook;

const request = (file: unknown, language = 'en'): PayloadRequest =>
  ({ file, i18n: { language } }) as unknown as PayloadRequest;

describe('frameCount', () => {
  it('is 1 for a still image and for bytes sharp cannot read, the frames of an animation', async () => {
    expect(await frameCount(await stillWebp())).toBe(1);
    expect(await frameCount(Buffer.from('not an image'))).toBe(1);
    expect(await frameCount(await animatedWebp())).toBe(2);
  });
});

describe('refuseAnimated (ADR-064)', () => {
  it('runs before the operation, on the media collection', () => {
    expect(Media.hooks?.beforeOperation).toContain(refuseAnimated);
  });

  it('lets a still upload, a save without a file and a read through unchanged', async () => {
    const args = { data: {} };
    expect(
      await hook({ args, operation: 'create', req: request({ data: await stillWebp() }) }),
    ).toBe(args);
    expect(await hook({ args, operation: 'update', req: request(undefined) })).toBe(args);
    expect(
      await hook({ args, operation: 'read', req: request({ data: await animatedWebp() }) }),
    ).toBe(args);
  });

  it('refuses an animated upload with a 400 in the language of the panel', async () => {
    const data = await animatedWebp();
    await expect(
      hook({ args: {}, operation: 'create', req: request({ data }) }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'Animated images are not accepted; upload a still image',
    });
    await expect(
      hook({ args: {}, operation: 'update', req: request({ data }, 'ar') }),
    ).rejects.toMatchObject({ status: 400, message: 'الصور المتحركة غير مقبولة؛ ارفع صورة ثابتة' });
  });
});
