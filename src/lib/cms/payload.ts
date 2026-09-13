import 'server-only';
// The config is the CMS module's entry point; `lib` importing it is the one intended
// exception to the modules → lib direction (constitution VII, ADR-024).
import config from '@payload-config';
import { getPayload, type Payload } from 'payload';

/** The Payload Local API client (BRD 9.6): one instance per process, created lazily. */
export function cms(): Promise<Payload> {
  return getPayload({ config });
}

export { PUBLIC_READ, PUBLISHED } from '@/lib/cms/read';
