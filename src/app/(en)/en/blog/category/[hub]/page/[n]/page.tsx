import type { Metadata } from 'next';
import { hubPageParams, hubRouteMetadata, renderHub } from '@/modules/blog';

interface Params {
  params: Promise<{ hub: string; n: string }>;
}

export const dynamicParams = true;

export const generateStaticParams = () => hubPageParams('en');

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { hub, n } = await params;
  return hubRouteMetadata('en', hub, n);
}

export default async function HubPageRoute({ params }: Params) {
  const { hub, n } = await params;
  return renderHub('en', hub, n);
}
