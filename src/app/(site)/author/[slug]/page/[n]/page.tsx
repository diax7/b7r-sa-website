import type { Metadata } from 'next';
import { authorPageParams, authorRouteMetadata, renderAuthor } from '@/modules/blog';

interface Params {
  params: Promise<{ slug: string; n: string }>;
}

export const dynamicParams = true;

export const generateStaticParams = () => authorPageParams('ar');

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, n } = await params;
  return authorRouteMetadata('ar', slug, n);
}

export default async function AuthorPageRoute({ params }: Params) {
  const { slug, n } = await params;
  return renderAuthor('ar', slug, n);
}
