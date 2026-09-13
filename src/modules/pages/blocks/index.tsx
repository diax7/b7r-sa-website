import type { Block } from '@/content/schema';
import { CardsBlock } from '@/modules/pages/blocks/cards';
import { FaqListBlock } from '@/modules/pages/blocks/faq-list';
import { LegalBodyBlock } from '@/modules/pages/blocks/legal-body';
import { MediaBannerBlock } from '@/modules/pages/blocks/media-banner';
import { MiskCredentialBlock } from '@/modules/pages/blocks/misk-credential';
import { ProfitEquationBlock } from '@/modules/pages/blocks/profit-equation';
import { RichTextBlock } from '@/modules/pages/blocks/rich-text';
import { StepsBlock } from '@/modules/pages/blocks/steps';
import { StoryBlock } from '@/modules/pages/blocks/story';
import type { BlockComponent, ExtraRenderers } from '@/modules/pages/blocks/types';

/** The renderers this module owns; feature-module sections (contact) come from the app. */
const OWN: ExtraRenderers = {
  richText: RichTextBlock,
  story: StoryBlock,
  cards: CardsBlock,
  steps: StepsBlock,
  profitEquation: ProfitEquationBlock,
  faqList: FaqListBlock,
  miskCredential: MiskCredentialBlock,
  legalBody: LegalBodyBlock,
  mediaBanner: MediaBannerBlock,
};

export function rendererFor<T extends Block['blockType']>(
  type: T,
  extra: ExtraRenderers,
): BlockComponent<T> {
  const found = (extra[type] ?? OWN[type]) as BlockComponent<T> | undefined;
  if (!found) throw new Error(`No renderer for block «${type}»`);
  return found;
}
