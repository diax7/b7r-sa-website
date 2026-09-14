import type { ComponentType } from 'react';
import type { SectionTone } from '@/components/shared/section';
import type { Block, BlockOf, Page } from '@/content/schema';
import type { Locale } from '@/lib/i18n';

export type BlockTone = Extract<SectionTone, 'surface' | 'ground'>;

/** The page's own heading, handed to the first block so the H1 sits inside its section. */
export interface PageHeading {
  title: string;
  lead?: string | undefined;
}

export interface BlockProps<T extends Block['blockType']> {
  block: BlockOf<T>;
  page: Page;
  locale: Locale;
  tone: BlockTone;
  /**
   * Unique per page and readable in a URL: the block's short name, numbered from the second
   * block of the same type (`faq`, `faq-2`). Element ids derive from it.
   */
  anchor: string;
  /** Present on the first block only: render it as the H1 of the page. */
  heading?: PageHeading | undefined;
}

/** Short names for the anchors (and the `data-block` hook the e2e uses). */
export const BLOCK_ANCHORS: Record<Block['blockType'], string> = {
  richText: 'text',
  story: 'story',
  cards: 'cards',
  steps: 'steps',
  profitEquation: 'profit',
  faqList: 'faq',
  miskCredential: 'misk',
  contact: 'contact',
  legalBody: 'legal',
  mediaBanner: 'banner',
};

/** `faq`, then `faq-2`, `faq-3`… for repeated block types on one page. */
export function blockAnchors(blocks: ReadonlyArray<Pick<Block, 'blockType'>>): string[] {
  const seen = new Map<string, number>();
  return blocks.map((b) => {
    const base = BLOCK_ANCHORS[b.blockType];
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });
}

export type BlockComponent<T extends Block['blockType']> = ComponentType<BlockProps<T>>;

/** Renderers a page module cannot own (a feature module's section, e.g. the contact form). */
export type ExtraRenderers = Partial<{ [T in Block['blockType']]: BlockComponent<T> }>;
