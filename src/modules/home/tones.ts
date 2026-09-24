import type { SectionTone } from '@/components/shared/section';

export type HomeTone = Extract<SectionTone, 'surface' | 'ground'>;

/**
 * Alternating section tones (BRD 3.4) over the sections that actually render: each rendered
 * section takes the opposite tone of the previous rendered one, starting after `previous`;
 * a section that is not rendered keeps the sequence where it was.
 */
export function alternateTones<K extends string>(
  shown: Record<K, boolean>,
  previous: HomeTone,
): Record<K, HomeTone> {
  const tones = {} as Record<K, HomeTone>;
  let last = previous;
  for (const key of Object.keys(shown) as K[]) {
    if (shown[key]) last = last === 'surface' ? 'ground' : 'surface';
    tones[key] = last;
  }
  return tones;
}

/**
 * The tone each section paints (spec 010, phase 2): the background set an editor picked for
 * it, else the tone it was designed with.
 */
export function sectionTones<K extends string>(
  designed: Record<K, SectionTone>,
  picks: Partial<Record<string, string>> = {},
): Record<K, SectionTone> {
  const tones = {} as Record<K, SectionTone>;
  for (const key of Object.keys(designed) as K[]) tones[key] = picks[key] ?? designed[key];
  return tones;
}
