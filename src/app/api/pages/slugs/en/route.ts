import { getPages } from '@/lib/cms';
import { getRedirects } from '@/lib/cms/redirects';
import { localeEnabled } from '@/lib/cms/settings';

/**
 * The English allowlist for the proxy (ADR-043): whether the site is in English at all
 * (the settings and the navigation carry their English), and the slugs `/en/<slug>` answers:
 * the pages published with an English title and the redirect sources. Its own static route
 * so ISR applies as to the Arabic one.
 */
export const revalidate = 60;

export async function GET(): Promise<Response> {
  const enabled = await localeEnabled('en');
  if (!enabled) return Response.json({ enabled, slugs: [] });
  const [pages, redirects] = await Promise.all([getPages('en'), getRedirects()]);
  const slugs = new Set([...pages.map((p) => p.slug), ...redirects.map((r) => r.from.slice(1))]);
  return Response.json({ enabled, slugs: [...slugs] });
}
