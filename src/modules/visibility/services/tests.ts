import { env } from '@/lib/env';
import type { ServiceTests } from '@/modules/connections/test';
import { bingClient } from '@/modules/visibility/services/bing';
import { pagespeedClient } from '@/modules/visibility/services/pagespeed';
import { propertyFor, searchConsoleClient } from '@/modules/visibility/services/search-console';

const base = () => env.siteUrl ?? 'https://b7r.sa';

/**
 * The Test per service kind (ADR-049 D3), handed to `testConnection` by the route: Search
 * Console lists the account's properties and checks ours is among them; Bing lists the key's
 * sites; PageSpeed runs one mobile audit of the home page (90 s). Each answers a sentence the
 * row records, never the secret.
 */
export const SERVICE_TESTS: ServiceTests = {
  'google-search-console': async (secret) => {
    const sites = await searchConsoleClient(secret ?? '', base()).sites();
    const property = propertyFor(base());
    const mine = sites.find((s) => s.siteUrl === property || s.siteUrl === `${base()}/`);
    if (!mine) {
      throw new Error(
        `the account reads ${sites.length} propert${sites.length === 1 ? 'y' : 'ies'} but not ${property}: add it as a user of the property`,
      );
    }
    return `${mine.siteUrl} (${mine.permissionLevel})`;
  },
  'bing-webmaster': async (secret) => {
    const sites = await bingClient(secret ?? '', base()).sites();
    const host = new URL(base()).hostname.replace(/^www\./, '');
    const mine = sites.find((s) => s.includes(host));
    if (!mine) throw new Error(`the key sees ${sites.length} site(s) but not ${host}`);
    return mine;
  },
  pagespeed: async (secret) => {
    const audit = await pagespeedClient(secret).audit(base(), 'mobile');
    if (audit.scores.performance === null)
      throw new Error('the answer carried no performance score');
    return `mobile performance ${audit.scores.performance} on the home page`;
  },
};
