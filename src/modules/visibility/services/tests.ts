import { env } from '@/lib/env';
import type { ServiceTests } from '@/modules/connections/test';
import { bingClient } from '@/modules/visibility/services/bing';
import { pagespeedClient } from '@/modules/visibility/services/pagespeed';
import { propertyFor, searchConsoleClient } from '@/modules/visibility/services/search-console';

const base = () => env.siteUrl ?? 'https://b7r.sa';

/**
 * The Test per service kind (ADR-049 D3), handed to `testConnection` by the route: Search
 * Console lists the account's properties and checks ours is among them; Bing lists the key's
 * sites; PageSpeed runs one mobile audit of the home page (90 s). Each answers a short
 * technical record the row stores as `lastTestMessage` (a property and its permission, a
 * site, a score; on failure what was looked for and what the service had), never the secret.
 * It is written once at test time in the service's own terms, so it is not translated
 * (ADR-056).
 */
export const SERVICE_TESTS: ServiceTests = {
  'google-search-console': async (secret) => {
    const sites = await searchConsoleClient(secret ?? '', base()).sites();
    const property = propertyFor(base());
    const mine = sites.find((s) => s.siteUrl === property || s.siteUrl === `${base()}/`);
    if (!mine) {
      throw new Error(`${property} not found; properties on the account: ${sites.length}`);
    }
    return `${mine.siteUrl} (${mine.permissionLevel})`;
  },
  'bing-webmaster': async (secret) => {
    const sites = await bingClient(secret ?? '', base()).sites();
    const host = new URL(base()).hostname.replace(/^www\./, '');
    const mine = sites.find((s) => s.includes(host));
    if (!mine) throw new Error(`${host} not found; sites on the key: ${sites.length}`);
    return mine;
  },
  pagespeed: async (secret) => {
    const audit = await pagespeedClient(secret).audit(base(), 'mobile');
    if (audit.scores.performance === null) throw new Error('no performance score in the answer');
    return `mobile performance: ${audit.scores.performance}`;
  },
};
