/**
 * Joins a site path onto the canonical origin; a URL that is already absolute (CMS media
 * on S3, ADR-029) is returned unchanged. For JSON-LD, the sitemap and Open Graph fields.
 */
export function absoluteUrl(base: string, path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return path === '/' ? base : `${base}${path}`;
}
