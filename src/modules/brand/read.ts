import 'server-only';
import type { Viewport } from 'next';
import { cache } from 'react';
import { mediaUrl } from '@/lib/cms/mappers';
import { cms } from '@/lib/cms/payload';
import {
  type Appearance,
  APPEARANCE,
  paintedColours,
  toAppearance,
} from '@/modules/brand/appearance';
import type { LogoImage } from '@/modules/core/logo-image';
import type { Media } from '@/payload-types';

export interface SiteAppearance extends Appearance {
  /** The Logo tab's uploads; `null` keeps the shipped image in that place. */
  logo: { primary: LogoImage | null; onDark: LogoImage | null };
}

const NO_LOGO: SiteAppearance['logo'] = { primary: null, onDark: null };

function logoOf(value: number | Media | null | undefined): LogoImage | null {
  if (!value || typeof value === 'number') return null;
  const src = mediaUrl(value);
  if (!src || !value.width || !value.height) return null;
  return { src, width: value.width, height: value.height };
}

/**
 * The Appearance global for a render (spec 010), read once per request with access
 * overridden, as every public read of a global is. A stored value that cannot be used is
 * replaced by the shipped one and logged (`toAppearance`), and a read that fails outright
 * leaves the site in its shipped appearance and says so: this runs in the head of every page
 * and the global 404, so it degrades rather than taking them down (ADR-061).
 */
export const getAppearance = cache(async (): Promise<SiteAppearance> => {
  try {
    const payload = await cms();
    const doc = await payload.findGlobal({ slug: APPEARANCE, depth: 1, overrideAccess: true });
    const { appearance, problems } = toAppearance(doc);
    for (const problem of problems) console.warn(problem);
    return {
      ...appearance,
      logo: {
        primary: logoOf(doc.logoPrimary),
        onDark: logoOf(doc.logoOnDark),
      },
    };
  } catch (error) {
    console.warn(
      `appearance: the global could not be read (${error instanceof Error ? error.message : String(error)}); the shipped appearance applies`,
    );
    return { ...toAppearance(null).appearance, logo: NO_LOGO };
  }
});

/** The viewport of every site document: the phone's browser bar in the primary the site paints. */
export async function siteViewport(): Promise<Viewport> {
  const colour = paintedColours(await getAppearance());
  return { width: 'device-width', initialScale: 1, themeColor: colour('primary') };
}
