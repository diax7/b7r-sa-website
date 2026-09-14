import type { Metadata } from 'next';
import { authorParams, authorRouteMetadata, renderAuthor } from '@/modules/blog';

interface Params {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

export const generateStaticParams = () => authorParams('ar');

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return authorRouteMetadata('ar', (await params).slug);
}

export default async function AuthorRoute({ params }: Params) {
  return renderAuthor('ar', (await params).slug);
}
