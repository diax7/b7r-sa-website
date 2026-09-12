import type { MetadataRoute } from 'next';
import { env, PRODUCTION_SITE_URL } from '@/lib/env';

/**
 * Phase 1a: the preview guard only (BRD 7.2). The full production rule set with the answer
 * engine allow-list lands in Phase 1c with the rest of the SEO layer.
 */
export default function robots(): MetadataRoute.Robots {
  if (!env.isProductionSite) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/'] },
    sitemap: `${PRODUCTION_SITE_URL}/sitemap.xml`,
  };
}
