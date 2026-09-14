import type { Metadata } from 'next';
import { hubParams, hubRouteMetadata, renderHub } from '@/modules/blog';

interface Params {
  params: Promise<{ hub: string }>;
}

/** A hub added in the admin after the build gets its page on first request (ISR). */
export const dynamicParams = true;

export const generateStaticParams = () => hubParams('en');

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return hubRouteMetadata('en', (await params).hub);
}

export default async function HubRoute({ params }: Params) {
  return renderHub('en', (await params).hub);
}
