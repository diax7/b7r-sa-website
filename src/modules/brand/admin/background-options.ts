import type { Payload } from 'payload';
import { cache } from 'react';
import {
  builtInColours,
  libraryColours,
  type SampleColours,
} from '@/modules/brand/admin/sample-colours';
import { APPEARANCE, toAppearance } from '@/modules/brand/appearance';
import { brandTokens } from '@/modules/brand/css';
import { BUILT_IN_SURFACES, SEA_MIST, SEA_MIST_NAME } from '@/modules/brand/surfaces';
import { adminStringsFor } from '@/modules/cms/admin/strings';

export interface BackgroundOption {
  key: string;
  name: string;
  colours: SampleColours;
}

export interface BackgroundChoicesData {
  /** The section's own background: white or light grey, as the section was designed. */
  own: [SampleColours['background'], SampleColours['background']];
  options: BackgroundOption[];
}

/** The library rows' names by key, as read in the editor's language. */
function namesOf(doc: unknown, locale: 'ar' | 'en'): Map<string, string> {
  const rows = (doc as { surfaces?: unknown } | null)?.surfaces;
  const names = new Map<string, string>([[SEA_MIST.key, SEA_MIST_NAME[locale]]]);
  if (!Array.isArray(rows)) return names;
  for (const row of rows as Array<{ key?: unknown; label?: unknown }>) {
    if (typeof row.key === 'string' && typeof row.label === 'string' && row.label !== '') {
      names.set(row.key, row.label);
    }
  }
  return names;
}

/**
 * What a section's background picker offers (spec 010, phase 2), in the editor's language:
 * the three sets built from the brand in the brand's current colours, then the library's sets
 * in their own. Read with access overridden: an editor picks from sets only an admin edits.
 * Once per request: Payload renders the picker again whenever it rebuilds the form (a block
 * added), and a page has one per block.
 */
export const backgroundOptions = cache(async function backgroundOptions(
  payload: Payload,
  language: string,
): Promise<BackgroundChoicesData> {
  const locale = language === 'ar' ? 'ar' : 'en';
  const doc = await payload.findGlobal({
    slug: APPEARANCE,
    depth: 0,
    overrideAccess: true,
    locale,
  });
  const { appearance } = toAppearance(doc);
  const tokens = brandTokens(appearance.brand);
  const builtIn = adminStringsFor(language).appearance.surfaces.builtIn;
  const names = namesOf(doc, locale);
  return {
    own: [
      builtInColours('surface', tokens).background,
      builtInColours('ground', tokens).background,
    ],
    options: [
      ...BUILT_IN_SURFACES.map((key) => ({
        key,
        name: builtIn[key],
        colours: builtInColours(key, tokens),
      })),
      ...appearance.surfaces.map((set) => ({
        key: set.key,
        name: names.get(set.key) ?? set.key,
        colours: libraryColours(set, tokens),
      })),
    ],
  };
});
