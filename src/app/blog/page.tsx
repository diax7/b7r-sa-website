import type { Metadata } from 'next';
import { BlogIndex } from '@/modules/blog';
import { buildMetadata, newsletterCopy } from '@/modules/core';
import { NewsletterForm } from '@/modules/forms';

export const metadata: Metadata = buildMetadata('/blog');

export default function BlogRoute() {
  return <BlogIndex newsletter={<NewsletterForm tone="light" copy={newsletterCopy} />} />;
}
