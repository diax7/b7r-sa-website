import type { SectionTone } from '@/components/shared/section';

/**
 * Each block's background: the set an editor picked for it (spec 010, phase 2), else the
 * page's alternation (BRD 3.4), the first section on surface.
 */
export function blockTones(
  blocks: ReadonlyArray<{ background?: string | undefined }>,
): SectionTone[] {
  return blocks.map((block, i) => block.background ?? (i % 2 === 0 ? 'surface' : 'ground'));
}
