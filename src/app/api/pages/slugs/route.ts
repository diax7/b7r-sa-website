import { getPages } from '@/lib/cms';
import { getRedirects } from '@/lib/cms/redirects';

/**
 * Top-level slugs the Arabic site answers (B0, ADR-032): the published pages and the
 * redirect sources. Read by the proxy from the loopback address so unknown URLs get the
 * global 404; regenerated when a page or a redirect changes (`revalidatePath`) and at most
 * once a minute otherwise.
 */
export const revalidate = 60;

export async function GET(): Promise<Response> {
  const [pages, redirects] = await Promise.all([getPages('ar'), getRedirects()]);
  const slugs = new Set([...pages.map((p) => p.slug), ...redirects.map((r) => r.from.slice(1))]);
  return Response.json({ slugs: [...slugs] });
}
