import type { Metadata } from 'next';
import { buildMetadata } from '@/modules/core/seo/metadata';
import { FaqPage } from '@/modules/pages';

export const generateMetadata = (): Promise<Metadata> => buildMetadata('/faq');

export default function FaqRoute() {
  return <FaqPage />;
}
