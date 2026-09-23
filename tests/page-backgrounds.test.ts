import { describe, expect, it } from 'vitest';
import { toPage } from '@/lib/cms/mappers';
import { blockTones } from '@/modules/pages/tones';
import type { Page as PageDoc } from '@/payload-types';

/** A published page of three short blocks, each naming the background given. */
function pageDoc(backgrounds: Array<string | null | undefined>): PageDoc {
  return {
    id: 3,
    slug: 'about',
    title: 'من نحن',
    blocks: backgrounds.map((background, i) => ({
      id: `b${i}`,
      blockType: 'miskCredential',
      title: 'عضوية مسك',
      text: 'نص',
      ...(background === undefined ? {} : { background }),
    })),
    seo: { title: 'من نحن', description: 'وصف الصفحة' },
    updatedAt: '2026-09-23T00:00:00.000Z',
    createdAt: '2026-09-23T00:00:00.000Z',
    _status: 'published',
  } as PageDoc;
}

describe('a page block’s background (spec 010, phase 2)', () => {
  it('reaches the page contract, and a key of the wrong shape is dropped, not fatal', () => {
    const page = toPage(pageDoc(['sea-mist', null, 'Not A Key']));
    expect(page.blocks.map((block) => block.background)).toEqual([
      'sea-mist',
      undefined,
      undefined,
    ]);
  });

  it('keeps the designed tone for a set that no longer exists', () => {
    const known = new Set(['surface', 'ground', 'deep-sea', 'sea-mist']);
    const page = toPage(pageDoc(['dune', 'sea-mist']), { backgrounds: known });
    expect(page.blocks.map((block) => block.background)).toEqual([undefined, 'sea-mist']);
    expect(blockTones(page.blocks)).toEqual(['surface', 'sea-mist']);
  });

  it('replaces the alternation for its block only', () => {
    const page = toPage(pageDoc([undefined, 'deep-sea', undefined]));
    expect(blockTones(page.blocks)).toEqual(['surface', 'deep-sea', 'surface']);
    expect(blockTones(toPage(pageDoc([undefined, undefined])).blocks)).toEqual([
      'surface',
      'ground',
    ]);
  });
});
