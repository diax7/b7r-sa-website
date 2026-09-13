import type { MetadataRoute } from 'next';
import { site } from '@/content/site';
import { TOKEN_HEX } from '@/lib/tokens';

/** Web app manifest (BRD 7.3): Arabic, RTL, brand colours, `display: browser`. */
export function manifest(): MetadataRoute.Manifest {
  return {
    name: site.brandName,
    short_name: site.brandName,
    description: site.tagline,
    lang: 'ar',
    dir: 'rtl',
    start_url: '/',
    display: 'browser',
    theme_color: TOKEN_HEX.primary,
    background_color: TOKEN_HEX.surface,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
