import 'server-only';
import { cache } from 'react';
import { cms, PUBLIC_READ } from '@/lib/cms/payload';
import type { SiteRedirect } from '@/lib/resolve-slug';

export { resolveSlug, type SiteRedirect, type SlugResolution } from '@/lib/resolve-slug';

/** Admin-added redirects (the seeded list is also here, for the admin's eyes; ADR-032). */
export const getRedirects = cache(async (): Promise<SiteRedirect[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: 'redirects',
    ...PUBLIC_READ,
    depth: 1,
    limit: 500,
    pagination: false,
  });
  const rows: SiteRedirect[] = [];
  for (const doc of docs) {
    const target = doc.to;
    if (!target) continue;
    const to =
      target.type === 'reference'
        ? typeof target.reference?.value === 'object' && target.reference.value
          ? `/${target.reference.value.slug}`
          : undefined
        : (target.url ?? undefined);
    if (!to) continue;
    rows.push({ from: doc.from, to, permanent: doc.type !== '302' });
  }
  return rows;
});
