import type { Metadata } from 'next';
import { buildMetadata } from '@/modules/core/seo/metadata';
import { HomePage } from '@/app/home-page';

export const generateMetadata = (): Promise<Metadata> => buildMetadata('en', '/');

export default function HomeRoute() {
  return <HomePage locale="en" />;
}
