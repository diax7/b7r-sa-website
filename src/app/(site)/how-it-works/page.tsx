import type { Metadata } from 'next';
import { buildMetadata } from '@/modules/core/seo/metadata';
import { HowItWorksPage } from '@/modules/pages';

export const generateMetadata = (): Promise<Metadata> => buildMetadata('/how-it-works');

export default function HowItWorksRoute() {
  return <HowItWorksPage />;
}
