import type { Metadata } from 'next';
import { authorPageParams, authorRouteMetadata, renderAuthor } from '@/modules/blog';

interface Params {
  params: Promise<{ slug: string; n: string }>;
}

export const dynamicParams = true;

export const generateStaticParams = () => authorPageParams('en');

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, n } = await params;
  return authorRouteMetadata('en', slug, n);
}

export default async function AuthorPageRoute({ params }: Params) {
  const { slug, n } = await params;
  return renderAuthor('en', slug, n);
}
