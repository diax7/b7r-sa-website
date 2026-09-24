import type { MetadataRoute } from 'next';
import type { SiteSettings } from '@/content/schema';

/** What the manifest takes from the brand (spec 010), read by the app layer. */
export interface ManifestBrand {
  /** The phone's browser bar: the primary the site paints. */
  theme: string;
  /** The splash behind the icon: the page's white. */
  background: string;
  /** The widths the icon route draws from the mark, each served at `/icon/<width>`. */
  iconSizes: readonly number[];
}

/** Web app manifest (BRD 7.3): Arabic, RTL, the brand's colours, `display: browser`. */
export function manifest(site: SiteSettings, brand: ManifestBrand): MetadataRoute.Manifest {
  return {
    name: site.brandName,
    short_name: site.brandName,
    description: site.tagline,
    lang: 'ar',
    dir: 'rtl',
    start_url: '/',
    display: 'browser',
    theme_color: brand.theme,
    background_color: brand.background,
    icons: brand.iconSizes.map((size) => ({
      src: `/icon/${size}`,
      sizes: `${size}x${size}`,
      type: 'image/png',
    })),
  };
}
