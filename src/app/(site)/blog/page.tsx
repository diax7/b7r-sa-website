import type { Metadata } from 'next';
import { BlogIndex } from '@/modules/blog';
import { newsletterCopy } from '@/modules/core';
import { buildMetadata } from '@/modules/core/seo/metadata';
import { NewsletterForm } from '@/modules/forms';

export const generateMetadata = (): Promise<Metadata> => buildMetadata('/blog');

export default function BlogRoute() {
  return <BlogIndex newsletter={<NewsletterForm tone="light" copy={newsletterCopy} />} />;
}
