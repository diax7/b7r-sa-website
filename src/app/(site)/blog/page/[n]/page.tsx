import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostPage, POSTS_PER_PAGE } from '@/lib/cms/blog';
import { pageNumber } from '@/lib/page-number';
import { BlogIndex } from '@/modules/blog';
import { newsletterCopy } from '@/modules/core';
import { blogPageMetadata } from '@/modules/core/seo/metadata';
import { NewsletterForm } from '@/modules/forms';

interface Params {
  params: Promise<{ n: string }>;
}

/**
 * Pages 2 and up of the blog index (ADR-041): static routes, so `/blog` never reads a query
 * string. A page beyond the last, page 1 (which is `/blog`) and anything that is not a
 * number are 404s.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const total = (await getAllPosts()).length;
  const pages = Math.ceil(total / POSTS_PER_PAGE);
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ n: String(i + 2) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = pageNumber((await params).n);
  if (!page) notFound();
  return blogPageMetadata(page);
}

export default async function BlogPageRoute({ params }: Params) {
  const page = pageNumber((await params).n);
  if (!page) notFound();
  const listing = await getPostPage(page);
  if (listing.posts.length === 0) notFound();
  return (
    <BlogIndex page={page} newsletter={<NewsletterForm tone="light" copy={newsletterCopy} />} />
  );
}
