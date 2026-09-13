import type { Metadata } from 'next';
import { buildMetadata } from '@/modules/core/seo/metadata';
import { AboutPage } from '@/modules/pages';

export const generateMetadata = (): Promise<Metadata> => buildMetadata('/about');

export default function AboutRoute() {
  return <AboutPage />;
}
