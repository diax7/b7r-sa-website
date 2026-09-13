import type { MetadataRoute } from 'next';
import { getSiteSettings } from '@/lib/cms';
import { manifest as buildManifest } from '@/modules/core/seo/manifest';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  return buildManifest(await getSiteSettings());
}
