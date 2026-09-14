import type { Metadata } from 'next';
import { SITE_BLOCK_RENDERERS } from '@/app/(site)/cms-blocks';
import { designedPageMetadata, renderDesignedPage } from '@/modules/pages';

export const generateMetadata = (): Promise<Metadata> => designedPageMetadata('ar', 'how-it-works');

export default function PageRoute() {
  return renderDesignedPage('ar', 'how-it-works', SITE_BLOCK_RENDERERS);
}
