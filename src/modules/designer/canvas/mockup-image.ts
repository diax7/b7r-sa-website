import { mockupUrls } from '@/modules/designer/mockup';

/**
 * The mockup images the Konva canvas draws (ADR-064), loaded through a `<picture>` built
 * off the document (an AVIF `<source>`, a WebP `<img>`): the browser runs the one source
 * selection it ran for the static preview, so the canvas's file is the preview's by
 * construction, with no format probe. A browser that ignores a detached `<source>` loads
 * the WebP, still a right answer. Loaded elements stay in a module map keyed by the
 * mockup's source, so a product switch draws from memory, and a load in flight is shared
 * by the canvas and the preload. No `crossOrigin`: nothing reads the canvas back (the
 * mockup node is only cached, Konva's hit canvas draws colour keys); the day an export
 * ships, `crossOrigin` goes on the preview, the preload and this element alike.
 */
const loaded = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement>>();

/** The loaded element for a mockup source, when it has arrived. */
export function cachedMockup(src: string): HTMLImageElement | null {
  return loaded.get(src) ?? null;
}

function fetchMockup(src: string, priority: 'auto' | 'low'): Promise<HTMLImageElement> {
  const urls = mockupUrls(src);
  return new Promise((resolve, reject) => {
    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.type = 'image/avif';
    source.srcset = urls.avif;
    const img = document.createElement('img');
    img.decoding = 'async';
    img.fetchPriority = priority;
    picture.append(source, img);
    img.addEventListener(
      'load',
      () => {
        loaded.set(src, img);
        resolve(img);
      },
      { once: true },
    );
    img.addEventListener('error', () => reject(new Error(`mockup failed: ${src}`)), {
      once: true,
    });
    // `src` last: the source set is read when it is set, with the `<source>` in place.
    img.src = urls.webp;
  });
}

/** Loads a mockup once; a second call while it is in flight, or after, returns the same element. */
export function loadMockup(
  src: string,
  priority: 'auto' | 'low' = 'auto',
): Promise<HTMLImageElement> {
  const hit = loaded.get(src);
  if (hit) return Promise.resolve(hit);
  const inFlight = pending.get(src);
  if (inFlight) return inFlight;
  const load = fetchMockup(src, priority).finally(() => pending.delete(src));
  pending.set(src, load);
  return load;
}

/** Whether the person asked for less data (Chrome's Data Saver): then nothing is preloaded. */
export function savesData(): boolean {
  const connection = (navigator as { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/**
 * Loads the mockups a person has not chosen yet, one after the other at low priority, so
 * a product switch has nothing to fetch and nothing to decode; a failed one is dropped and
 * the click loads it the normal way. Skipped under Data Saver.
 */
export async function preloadMockups(sources: string[]): Promise<void> {
  if (savesData()) return;
  // One at a time on purpose: five fetches at once would compete with the page's own.
  for (const src of sources) {
    try {
      // oxlint-disable-next-line no-await-in-loop -- sequential by design
      const img = await loadMockup(src, 'low');
      // oxlint-disable-next-line no-await-in-loop -- sequential by design
      await img.decode();
    } catch {
      // Dropped: `loadMockup` has forgotten it, so the switch fetches it again.
    }
  }
}
