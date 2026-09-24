import type { MetadataRoute } from 'next';
import { getSiteSettings } from '@/lib/cms';
import { getAppearance, MANIFEST_ICON_SIZES, paintedColours } from '@/modules/brand';
import { manifest as buildManifest } from '@/modules/core/seo/manifest';

export const revalidate = 60;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [site, appearance] = await Promise.all([getSiteSettings('ar'), getAppearance()]);
  const colour = paintedColours(appearance);
  return buildManifest(site, {
    theme: colour('primary'),
    background: colour('surface'),
    iconSizes: MANIFEST_ICON_SIZES,
  });
}
