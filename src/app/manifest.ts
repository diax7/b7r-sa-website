import type { MetadataRoute } from 'next';
import { manifest as buildManifest } from '@/modules/core/seo/manifest';

export default function manifest(): MetadataRoute.Manifest {
  return buildManifest();
}
