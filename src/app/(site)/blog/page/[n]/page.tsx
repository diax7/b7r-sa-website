import type { Metadata } from 'next';
import { blogPageParams, blogPageRouteMetadata, renderBlogPage } from '@/modules/blog';
import { newsletterCopy } from '@/modules/core';
import { NewsletterForm } from '@/modules/forms';

interface Params {
  params: Promise<{ n: string }>;
}

/** Pages 2 and up of the blog index (ADR-041): static routes, never a query string. */
export const dynamicParams = true;

export const generateStaticParams = () => blogPageParams('ar');

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return blogPageRouteMetadata('ar', (await params).n);
}

export default async function BlogPageRoute({ params }: Params) {
  return renderBlogPage(
    'ar',
    (await params).n,
    <NewsletterForm tone="light" copy={newsletterCopy('ar')} />,
  );
}
