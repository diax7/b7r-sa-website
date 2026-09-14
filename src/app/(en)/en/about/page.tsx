import type { Metadata } from 'next';
import { SITE_BLOCK_RENDERERS } from '@/app/(site)/cms-blocks';
import { designedPageMetadata, renderDesignedPage } from '@/modules/pages';

export const generateMetadata = (): Promise<Metadata> => designedPageMetadata('en', 'about');

export default function PageRoute() {
  return renderDesignedPage('en', 'about', SITE_BLOCK_RENDERERS);
}
