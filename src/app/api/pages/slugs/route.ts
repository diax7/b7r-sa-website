import { getPages } from '@/lib/cms';

/**
 * Top-level slugs the site answers (B0, ADR-032): the published pages. Read by the proxy from
 * the loopback address so unknown URLs get the global 404; regenerated when a page is
 * published (`revalidatePath`) and at most once a minute otherwise.
 */
export const revalidate = 60;

export async function GET(): Promise<Response> {
  const pages = await getPages();
  return Response.json(
    { slugs: pages.map((p) => p.slug) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
