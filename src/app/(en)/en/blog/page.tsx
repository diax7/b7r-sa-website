import type { Metadata } from 'next';
import { blogIndexMetadata, renderBlogIndex } from '@/modules/blog';
import { newsletterCopy } from '@/modules/core';
import { NewsletterForm } from '@/modules/forms';

export const generateMetadata = (): Promise<Metadata> => blogIndexMetadata('en');

export default function BlogRoute() {
  return renderBlogIndex('en', <NewsletterForm tone="light" copy={newsletterCopy('en')} />);
}
