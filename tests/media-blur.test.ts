import type { PayloadRequest } from 'payload';
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { BLUR } from '@/lib/photo';
import { BLUR_FIELD, blurDataUrl, stampBlur } from '@/modules/cms/hooks/blur';
import { Media } from '@/modules/cms/collections/media';

/** A 96x60 photo-like JPEG (a gradient), the way an upload reaches the hook. */
async function jpeg(): Promise<Buffer> {
  const raw = Buffer.alloc(96 * 60 * 3);
  for (let y = 0; y < 60; y++) {
    for (let x = 0; x < 96; x++) {
      const i = (y * 96 + x) * 3;
      raw[i] = Math.round((x / 95) * 255);
      raw[i + 1] = Math.round((y / 59) * 255);
      raw[i + 2] = 120;
    }
  }
  return sharp(raw, { raw: { width: 96, height: 60, channels: 3 } })
    .jpeg({ quality: 90 })
    .toBuffer();
}

type Hook = (args: {
  data: Record<string, unknown>;
  req: PayloadRequest;
  operation: 'create' | 'update';
}) => Promise<Record<string, unknown>>;
const hook = stampBlur as unknown as Hook;

function request(file: unknown, logger = { error: vi.fn() }): PayloadRequest {
  return { file, payload: { logger } } as unknown as PayloadRequest;
}

describe('blurDataUrl (ADR-029, amended 2026-09-19)', () => {
  it('is a 24 px wide WebP data URL of about 300 bytes, keeping the aspect', async () => {
    const url = await blurDataUrl(await jpeg(), 'image/jpeg');
    expect(url).toMatch(/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/);
    expect(url!.length).toBeGreaterThan(100);
    expect(url!.length).toBeLessThan(600);
    const decoded = Buffer.from(url!.slice('data:image/webp;base64,'.length), 'base64');
    const meta = await sharp(decoded).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(BLUR.width);
    expect(meta.height).toBe(15);
  });

  it('is null for anything that is not a raster image', async () => {
    expect(await blurDataUrl(Buffer.from('<svg/>'), 'image/svg+xml')).toBeNull();
    expect(await blurDataUrl(Buffer.from('%PDF-1.4'), 'application/pdf')).toBeNull();
  });
});

describe('stampBlur', () => {
  it('fills the field from the uploaded file', async () => {
    const data = await hook({
      data: { alt: 'صورة' },
      req: request({ data: await jpeg(), mimetype: 'image/jpeg', name: 'a.jpg', size: 1 }),
      operation: 'create',
    });
    expect(data[BLUR_FIELD]).toMatch(/^data:image\/webp;base64,/);
    expect(data['alt']).toBe('صورة');
  });

  it('leaves a save without a file alone: the stored blur stays', async () => {
    const data = await hook({
      data: { alt: 'نص جديد', [BLUR_FIELD]: 'data:image/webp;base64,kept' },
      req: request(undefined),
      operation: 'update',
    });
    expect(data[BLUR_FIELD]).toBe('data:image/webp;base64,kept');
  });

  it('never throws: a file sharp cannot read logs and leaves the field empty', async () => {
    const logger = { error: vi.fn() };
    const data = await hook({
      data: { alt: 'صورة' },
      req: request(
        { data: Buffer.from('not an image'), mimetype: 'image/jpeg', name: 'x.jpg', size: 12 },
        logger,
      ),
      operation: 'create',
    });
    expect(data[BLUR_FIELD]).toBeNull();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0]![0]).toMatchObject({
      msg: 'media: no blur placeholder for x.jpg',
    });
  });

  it('a non-raster file leaves the field empty without an error', async () => {
    const logger = { error: vi.fn() };
    const data = await hook({
      data: {},
      req: request(
        { data: Buffer.from('<svg/>'), mimetype: 'image/svg+xml', name: 'x.svg' },
        logger,
      ),
      operation: 'create',
    });
    expect(data[BLUR_FIELD]).toBeNull();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('the media collection (ADR-029, amended 2026-09-19)', () => {
  it('generates no renditions, hides the blur field, and runs the hook on every change', () => {
    expect(Media.upload).not.toHaveProperty('imageSizes');
    const blur = Media.fields.find((f) => 'name' in f && f.name === BLUR_FIELD);
    expect(blur).toMatchObject({ type: 'text', admin: { hidden: true } });
    expect(Media.hooks?.beforeChange).toContain(stampBlur);
  });

  it("the panel's thumbnail is the optimizer's 384 px transform of the original", () => {
    const upload = Media.upload as { adminThumbnail: (args: { doc: unknown }) => string | null };
    expect(upload.adminThumbnail({ doc: { url: 'https://storage.example/media/a.jpg' } })).toBe(
      '/_next/image?url=https%3A%2F%2Fstorage.example%2Fmedia%2Fa.jpg&w=384&q=75',
    );
    expect(upload.adminThumbnail({ doc: {} })).toBeNull();
  });
});
