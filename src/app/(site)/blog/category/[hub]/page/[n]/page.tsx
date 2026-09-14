import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageNumber } from '@/lib/page-number';
import { getHub, getHubs, getPostPage, POSTS_PER_PAGE } from '@/lib/cms/blog';
import { HubPage } from '@/modules/blog';
import { hubMetadata } from '@/modules/core/seo/metadata';

interface Params {
  params: Promise<{ hub: string; n: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const hubs = await getHubs();
  const listings = await Promise.all(hubs.map((hub) => getPostPage(1, { hub: hub.slug })));
  return hubs.flatMap((hub, i) => {
    const pages = Math.ceil((listings[i]?.totalPosts ?? 0) / POSTS_PER_PAGE);
    return Array.from({ length: Math.max(0, pages - 1) }, (_, k) => ({
      hub: hub.slug,
      n: String(k + 2),
    }));
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { hub: slug, n } = await params;
  const page = pageNumber(n);
  const hub = await getHub(slug);
  if (!hub || !page) notFound();
  return hubMetadata(hub, page);
}

export default async function HubPageRoute({ params }: Params) {
  const { hub: slug, n } = await params;
  const page = pageNumber(n);
  const hub = await getHub(slug);
  if (!hub || !page) notFound();
  const listing = await getPostPage(page, { hub: hub.slug });
  if (listing.posts.length === 0) notFound();
  return <HubPage hub={hub} page={page} />;
}
