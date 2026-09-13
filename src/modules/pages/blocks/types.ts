import type { ComponentType } from 'react';
import type { SectionTone } from '@/components/shared/section';
import type { Block, BlockOf, Page } from '@/content/schema';

export type BlockTone = Extract<SectionTone, 'surface' | 'ground'>;

/** The page's own heading, handed to the first block so the H1 sits inside its section. */
export interface PageHeading {
  title: string;
  lead?: string | undefined;
}

export interface BlockProps<T extends Block['blockType']> {
  block: BlockOf<T>;
  page: Page;
  tone: BlockTone;
  /** Present on the first block only: render it as the H1 of the page. */
  heading?: PageHeading | undefined;
}

export type BlockComponent<T extends Block['blockType']> = ComponentType<BlockProps<T>>;

/** Renderers a page module cannot own (a feature module's section, e.g. the contact form). */
export type ExtraRenderers = Partial<{ [T in Block['blockType']]: BlockComponent<T> }>;
