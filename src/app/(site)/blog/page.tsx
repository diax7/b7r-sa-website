import type { Metadata } from 'next';
import { blogIndexMetadata, renderBlogIndex } from '@/modules/blog';
import { newsletterCopy } from '@/modules/core';
import { NewsletterForm } from '@/modules/forms';

export const generateMetadata = (): Promise<Metadata> => blogIndexMetadata('ar');

export default function BlogRoute() {
  return renderBlogIndex('ar', <NewsletterForm tone="light" copy={newsletterCopy('ar')} />);
}
