import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cachedMockup,
  loadMockup,
  preloadMockups,
  savesData,
} from '@/modules/designer/canvas/mockup-image';
import { useMockup } from '@/modules/designer/canvas/use-image';
import { mockupUrls, MOCKUP_WIDTH } from '@/modules/designer/mockup';

/**
 * jsdom never fetches: a set `src` is recorded here and answered only when the test
 * releases it (`answer`), with `load`, or `error` when the URL says `fail`. Holding the
 * answers is what lets a test tell a sequential loader from a parallel one.
 */
const requested: string[] = [];
const waiting = new Map<string, HTMLImageElement>();
let srcSetter: PropertyDescriptor;

function answer(match: string): void {
  for (const [url, img] of waiting) {
    if (!url.includes(match)) continue;
    waiting.delete(url);
    img.dispatchEvent(new Event(url.includes('fail') ? 'error' : 'load'));
  }
}

/** Answers every request as it comes, a microtask later, for the tests that do not care about order. */
function answerAll(): () => void {
  const id = setInterval(() => {
    for (const url of waiting.keys()) answer(url);
  }, 1);
  return () => clearInterval(id);
}

beforeEach(() => {
  requested.length = 0;
  waiting.clear();
  srcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')!;
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    get() {
      return this.getAttribute('src') ?? '';
    },
    set(value: string) {
      this.setAttribute('src', value);
      requested.push(value);
      waiting.set(value, this);
    },
  });
  HTMLImageElement.prototype.decode = () => Promise.resolve();
});

afterEach(() => {
  Object.defineProperty(HTMLImageElement.prototype, 'src', srcSetter);
  vi.unstubAllGlobals();
});

const src = (name: string) => `https://storage.example/media/${name}.jpg`;
const file = (name: string) => `https://storage.example/media/${name}-1080.webp`;

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
    const stop = answerAll();
    const img = await loadMockup(src('hoodie'));
    stop();
    const picture = img.parentElement!;
    expect(picture.tagName).toBe('PICTURE');
    expect(picture.isConnected).toBe(false);
    const source = picture.firstElementChild as HTMLSourceElement;
    expect(source.tagName).toBe('SOURCE');
    expect(source.type).toBe('image/avif');
    expect(source.srcset).toBe('https://storage.example/media/hoodie-1080.avif');
    expect(picture.lastElementChild).toBe(img);
    expect(img.getAttribute('src')).toBe(file('hoodie'));
    expect(img.decoding).toBe('async');
    expect(img.crossOrigin).toBeNull();
  });

  it('caches the element and shares a load in flight', async () => {
    const a = loadMockup(src('tote'));
    const b = loadMockup(src('tote'));
    expect(b).toBe(a);
    answer('tote');
    const img = await a;
    expect(cachedMockup(src('tote'))).toBe(img);
    expect(await loadMockup(src('tote'))).toBe(img);
    expect(requested.filter((u) => u.includes('tote'))).toHaveLength(1);
  });

  it('forgets a failed load so the next call tries again', async () => {
    const stop = answerAll();
    await expect(loadMockup(src('fail-one'))).rejects.toThrow('mockup failed');
    expect(cachedMockup(src('fail-one'))).toBeNull();
    await expect(loadMockup(src('fail-one'))).rejects.toThrow();
    stop();
    expect(requested.filter((u) => u.includes('fail-one'))).toHaveLength(2);
  });
});

describe('preloadMockups', () => {
  it('asks for the next file only once the previous one has answered, and goes on past a failure', async () => {
    const done = preloadMockups([src('a'), src('fail-b'), src('c')]);
    const asked = () => requested.filter((u) => /\/(a|fail-b|c)-1080/.test(u));
    await waitFor(() => expect(asked()).toEqual([file('a')]));
    answer('a');
    await waitFor(() => expect(asked()).toEqual([file('a'), file('fail-b')]));
    answer('fail-b');
    await waitFor(() => expect(asked()).toEqual([file('a'), file('fail-b'), file('c')]));
    answer('c');
    await done;
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

describe('useMockup', () => {
  it('hands back a cached mockup in the same render, and never a stale one for a new source', async () => {
    const stop = answerAll();
    const warm = await loadMockup(src('warm'));
    stop();
    const { result, rerender } = renderHook((s: string) => useMockup(s), {
      initialProps: src('warm'),
    });
    expect(result.current).toBe(warm);
    // A switch to a source nobody has loaded: null until it arrives, never the warm one.
    rerender(src('cold'));
    expect(result.current).toBeNull();
    await waitFor(() => expect(requested).toContain(file('cold')));
    act(() => answer('cold'));
    await waitFor(() => expect(result.current?.getAttribute('src')).toBe(file('cold')));
    // Back to the warm one: from the cache, at once.
    rerender(src('warm'));
    expect(result.current).toBe(warm);
  });
});
