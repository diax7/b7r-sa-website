import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllPosts, getPost } from '@/lib/cms/blog';
import { BlogPostPage } from '@/modules/blog';
import { postMetadata } from '@/modules/core/seo/metadata';

interface Params {
  params: Promise<{ slug: string }>;
}

/**
 * A post published in the admin after the build gets its page on first request (ISR), so
 * unknown slugs must reach the page and `notFound()` (ADR-030, as products).
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getAllPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return postMetadata(post);
}

export default async function PostRoute({ params }: Params) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  return <BlogPostPage post={post} />;
}
