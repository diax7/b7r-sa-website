import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getHub, getHubs } from '@/lib/cms/blog';
import { HubPage } from '@/modules/blog';
import { hubMetadata } from '@/modules/core/seo/metadata';

interface Params {
  params: Promise<{ hub: string }>;
}

/** A hub added in the admin after the build gets its page on first request (ISR). */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getHubs()).map((h) => ({ hub: h.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const hub = await getHub((await params).hub);
  if (!hub) notFound();
  return hubMetadata(hub);
}

export default async function HubRoute({ params }: Params) {
  const hub = await getHub((await params).hub);
  if (!hub) notFound();
  return <HubPage hub={hub} page={1} />;
}
