import 'server-only';
import config from '@payload-config';
import { getPayload, type Payload } from 'payload';

/** The Payload Local API client (BRD 9.6): one instance per process, created lazily. */
export function cms(): Promise<Payload> {
  return getPayload({ config });
}

/** Every public read: the Arabic locale, published documents only (drafts stay in the admin). */
export const PUBLIC_READ = { locale: 'ar', draft: false, overrideAccess: true } as const;
