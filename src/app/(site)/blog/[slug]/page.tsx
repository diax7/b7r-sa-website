import type { Metadata } from 'next';
import { postParams, postRouteMetadata, renderPost } from '@/modules/blog';

interface Params {
  params: Promise<{ slug: string }>;
}

/** A post published after the build gets its page on first request (ISR, ADR-030). */
export const dynamicParams = true;

export const generateStaticParams = () => postParams('ar');

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return postRouteMetadata('ar', (await params).slug);
}

export default async function PostRoute({ params }: Params) {
  return renderPost('ar', (await params).slug);
}
