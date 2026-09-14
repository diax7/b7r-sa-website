import 'server-only';
// The config is the CMS module's entry point; `lib` importing it is the one intended
// exception to the modules → lib direction (constitution VII, ADR-024).
import config from '@payload-config';
import { getPayload, type Payload } from 'payload';

/**
 * The Payload Local API client (BRD 9.6): one instance per process, created lazily. `cron`
 * starts the jobs runner on that instance (ADR-033), the first page render or health probe
 * after a boot does it, not the first admin visit; Payload itself refuses during `next build`.
 */
export function cms(): Promise<Payload> {
  return getPayload({ config, cron: true });
}

export { inLocale, publicRead, PUBLISHED } from '@/lib/cms/read';
