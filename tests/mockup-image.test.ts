import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cachedMockup,
  loadMockup,
  preloadMockups,
  savesData,
} from '@/modules/designer/canvas/mockup-image';
import { mockupUrls, MOCKUP_WIDTH } from '@/modules/designer/mockup';

/**
 * jsdom never fetches: a set `src` is answered here, one tick later, by `load` unless the
 * URL says `fail`. The order of the answers is the order of the requests, which is what the
 * sequential preload is about.
 */
const requested: string[] = [];
let srcSetter: PropertyDescriptor;

beforeEach(() => {
  requested.length = 0;
  srcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')!;
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    get() {
      return this.getAttribute('src') ?? '';
    },
    set(value: string) {
      this.setAttribute('src', value);
      requested.push(value);
      queueMicrotask(() =>
        this.dispatchEvent(new Event(value.includes('fail') ? 'error' : 'load')),
      );
    },
  });
  HTMLImageElement.prototype.decode = () => Promise.resolve();
});

afterEach(() => {
  Object.defineProperty(HTMLImageElement.prototype, 'src', srcSetter);
  vi.unstubAllGlobals();
});

const src = (name: string) => `https://storage.example/media/${name}.jpg`;

describe('mockupUrls (ADR-064)', () => {
  it('names the two renditions at the one mockup width', () => {
    expect(MOCKUP_WIDTH).toBe(1080);
    expect(mockupUrls(src('tee'))).toEqual({
      avif: 'https://storage.example/media/tee-1080.avif',
      webp: 'https://storage.example/media/tee-1080.webp',
    });
  });
});

describe('loadMockup', () => {
  it('loads through a detached picture: the AVIF source first, the WebP img, src set last', async () => {
    const img = await loadMockup(src('hoodie'));
    const picture = img.parentElement!;
    expect(picture.tagName).toBe('PICTURE');
    expect(picture.isConnected).toBe(false);
    const source = picture.firstElementChild as HTMLSourceElement;
    expect(source.tagName).toBe('SOURCE');
    expect(source.type).toBe('image/avif');
    expect(source.srcset).toBe('https://storage.example/media/hoodie-1080.avif');
    expect(picture.lastElementChild).toBe(img);
    expect(img.getAttribute('src')).toBe('https://storage.example/media/hoodie-1080.webp');
    expect(img.decoding).toBe('async');
    expect(img.crossOrigin).toBeNull();
  });

  it('caches the element and shares a load in flight', async () => {
    const a = loadMockup(src('tote'));
    const b = loadMockup(src('tote'));
    expect(b).toBe(a);
    const img = await a;
    expect(cachedMockup(src('tote'))).toBe(img);
    expect(await loadMockup(src('tote'))).toBe(img);
    expect(requested.filter((u) => u.includes('tote'))).toHaveLength(1);
  });

  it('forgets a failed load so the next call tries again', async () => {
    await expect(loadMockup(src('fail-one'))).rejects.toThrow('mockup failed');
    expect(cachedMockup(src('fail-one'))).toBeNull();
    await expect(loadMockup(src('fail-one'))).rejects.toThrow();
    expect(requested.filter((u) => u.includes('fail-one'))).toHaveLength(2);
  });
});

describe('preloadMockups', () => {
  it('loads one after the other at low priority, and goes on past a failure', async () => {
    await preloadMockups([src('a'), src('fail-b'), src('c')]);
    const order = requested.filter((u) => /\/(a|fail-b|c)-1080/.test(u));
    expect(order).toEqual([
      'https://storage.example/media/a-1080.webp',
      'https://storage.example/media/fail-b-1080.webp',
      'https://storage.example/media/c-1080.webp',
    ]);
    expect(cachedMockup(src('a'))?.fetchPriority).toBe('low');
    expect(cachedMockup(src('fail-b'))).toBeNull();
    expect(cachedMockup(src('c'))).not.toBeNull();
  });

  it('fetches nothing under Data Saver', async () => {
    vi.stubGlobal('navigator', { ...navigator, connection: { saveData: true } });
    expect(savesData()).toBe(true);
    await preloadMockups([src('saved')]);
    expect(requested.some((u) => u.includes('saved'))).toBe(false);
    expect(cachedMockup(src('saved'))).toBeNull();
  });
});
