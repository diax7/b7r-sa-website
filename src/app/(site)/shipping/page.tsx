import type { Metadata } from 'next';
import { SITE_BLOCK_RENDERERS } from '@/app/(site)/cms-blocks';
import { cmsPageMetadata } from '@/modules/core/seo/metadata';
import { CmsPage } from '@/modules/pages';

export const generateMetadata = (): Promise<Metadata> => cmsPageMetadata('shipping');

export default function ShippingRoute() {
  return <CmsPage slug="shipping" renderers={SITE_BLOCK_RENDERERS} />;
}
