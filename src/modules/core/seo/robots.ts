import type { MetadataRoute } from 'next';

/** Search and retrieval bots that get an explicit allow (BRD 7.2, decision C-08). */
export const ANSWER_ENGINE_BOTS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Bingbot',
  'Applebot',
];

/**
 * robots.txt (BRD 7.2). Any host other than the production origin gets `Disallow: /` so
 * previews never rank; production allows everything except the API, the future admin, the
 * hub filter query and UTM variants, and names the answer-engine bots explicitly.
 */
export function robotsRules(isProductionSite: boolean, base: string): MetadataRoute.Robots {
  if (!isProductionSite) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/*?hub=', '/*&utm_'] },
      ...ANSWER_ENGINE_BOTS.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
