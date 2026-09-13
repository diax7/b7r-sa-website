import type { Metadata } from 'next';
import { SITE_BLOCK_RENDERERS } from '@/app/(site)/cms-blocks';
import { cmsPageMetadata } from '@/modules/core/seo/metadata';
import { CmsPage } from '@/modules/pages';

export const generateMetadata = (): Promise<Metadata> => cmsPageMetadata('terms');

export default function TermsRoute() {
  return <CmsPage slug="terms" renderers={SITE_BLOCK_RENDERERS} />;
}
