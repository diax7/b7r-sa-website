import type { Payload } from 'payload';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { accessToken, forgetTokens, SEARCH_CONSOLE_SCOPE, signJwt } from '@/lib/google-jwt';
import { parseServiceAccount, type ServiceAccountKey } from '@/lib/service-account';
import {
  maskOfServiceAccount,
  readValue,
  secretField,
  serviceAccountProblem,
} from '@/modules/cms/fields/secret-field';
import { isServiceKind, KINDS, kindsThat, takesBaseUrl } from '@/modules/connections/kinds';
import { Connections } from '@/modules/connections/collection';
import { testConnection } from '@/modules/connections/test';
import {
  auditUrls,
  pull,
  suggestTopics,
  TOPIC_MIN_IMPRESSIONS,
  topicPriority,
} from '@/modules/visibility/pull';
import {
  bingClient,
  bingDate,
  parseQueryStats,
  parseTrafficStats,
  parseUserSites,
} from '@/modules/visibility/services/bing';
import {
  pagespeedClient,
  parseAudit,
  PAGESPEED_TIMEOUT_MS,
} from '@/modules/visibility/services/pagespeed';
import {
  parseRows,
  parseSites,
  parseTotals,
  propertyFor,
  searchConsoleClient,
  windowEnding,
} from '@/modules/visibility/services/search-console';
import { scoreTrend, signalRows } from '@/modules/visibility/signals';

/** A PKCS#8 PEM of a fresh RSA key, so the JWT test signs with a key nobody holds. */
async function freshKey(): Promise<{ pem: string; publicKey: CryptoKey }> {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const der = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(der)));
  const lines = b64.match(/.{1,64}/g)!.join('\n');
  return {
    pem: `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----\n`,
    publicKey: pair.publicKey,
  };
}

const fromBase64url = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

const keyFile = (privateKey: string, extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    type: 'service_account',
    client_email: 'seo@b7r-site.iam.gserviceaccount.com',
    private_key: privateKey,
    private_key_id: 'kid-1',
    token_uri: 'https://oauth2.googleapis.com/token',
    ...extra,
  });

/** A fetch that answers by URL substring and records what it was asked. */
function fakeFetch(answers: Array<[string, unknown, number?]>) {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    const hit = answers.find(([part]) => url.includes(part));
    if (!hit) return new Response('not found', { status: 404 });
    return Response.json(hit[1], { status: hit[2] ?? 200 });
  }) as typeof fetch;
  return { fetcher, calls };
}

/** A request whose `find` says how many other rows exist. */
const withOthers = (totalDocs: number) =>
  ({ payload: { find: async () => ({ totalDocs, docs: [] }) } }) as never;

/** A Payload holding one connection row of the given kind. */
const connectionOf = (kind: string, apiKey: string | null) =>
  ({
    find: async () => ({ docs: [] }),
    findByID: async ({ id }: { id: number }) => ({
      id,
      kind,
      apiKey,
      model: '',
      baseUrl: null,
      enabled: true,
    }),
    update: async () => ({}),
  }) as unknown as Payload;

/** A Payload whose `find` answers per collection and whose `create` records the rows. */
function fakePayload(byCollection: Record<string, unknown[]>) {
  const created: Array<Record<string, unknown>> = [];
  const payload = {
    find: async ({ collection }: { collection: string }) => {
      const docs = byCollection[collection] ?? [];
      return { docs, totalDocs: docs.length };
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      created.push(data);
      return data;
    },
  } as unknown as Payload;
  return { payload, created };
}

describe('the service account key and the JWT flow (ADR-049)', () => {
  afterEach(() => forgetTokens());

  it('parses the three fields of a key file and names what a bad paste lacks', async () => {
    const { pem } = await freshKey();
    const key = parseServiceAccount(keyFile(pem));
    expect(key).toMatchObject({
      clientEmail: 'seo@b7r-site.iam.gserviceaccount.com',
      privateKeyId: 'kid-1',
      tokenUri: 'https://oauth2.googleapis.com/token',
    });
    expect(parseServiceAccount('sk-abc')).toMatch(/not JSON/);
    expect(parseServiceAccount('{"type":"authorized_user"}')).toMatch(/not a service account/);
    expect(parseServiceAccount(keyFile(pem, { client_email: 'nope' }))).toMatch(/client_email/);
    expect(parseServiceAccount(keyFile(pem, { private_key: 'x' }))).toMatch(/private_key/);
    // The token endpoint is Google's whatever the file says: a signed assertion goes nowhere else.
    expect(parseServiceAccount(keyFile(pem, { token_uri: 'https://evil.example/token' }))).toMatch(
      /token_uri is not https:\/\/oauth2\.googleapis\.com\/token/,
    );
    const { token_uri: _omitted, ...withoutUri } = JSON.parse(keyFile(pem)) as Record<
      string,
      unknown
    >;
    expect(parseServiceAccount(JSON.stringify(withoutUri))).toMatchObject({
      tokenUri: 'https://oauth2.googleapis.com/token',
    });
  });

  it('signs an RS256 assertion Google can verify, with the scope, the issuer and an hour', async () => {
    const { pem, publicKey } = await freshKey();
    const key = parseServiceAccount(keyFile(pem)) as ServiceAccountKey;
    const now = new Date('2026-09-16T10:00:00Z');
    const jwt = await signJwt(key, SEARCH_CONSOLE_SCOPE, now);
    const [header, claims, signature] = jwt.split('.') as [string, string, string];
    expect(JSON.parse(new TextDecoder().decode(fromBase64url(header)))).toEqual({
      alg: 'RS256',
      typ: 'JWT',
      kid: 'kid-1',
    });
    expect(JSON.parse(new TextDecoder().decode(fromBase64url(claims)))).toEqual({
      iss: key.clientEmail,
      scope: SEARCH_CONSOLE_SCOPE,
      aud: key.tokenUri,
      iat: 1789552800,
      exp: 1789552800 + 3600,
    });
    expect(
      await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        publicKey,
        fromBase64url(signature),
        new TextEncoder().encode(`${header}.${claims}`),
      ),
    ).toBe(true);
  });

  it('exchanges the assertion once and serves the token from memory until it nears expiry', async () => {
    const { pem } = await freshKey();
    const key = parseServiceAccount(keyFile(pem)) as ServiceAccountKey;
    const { fetcher, calls } = fakeFetch([
      ['oauth2.googleapis.com/token', { access_token: 'ya29.one', expires_in: 3600 }],
    ]);
    const t0 = new Date('2026-09-16T10:00:00Z');
    expect(await accessToken(key, SEARCH_CONSOLE_SCOPE, fetcher, t0)).toBe('ya29.one');
    expect(await accessToken(key, SEARCH_CONSOLE_SCOPE, fetcher, t0)).toBe('ya29.one');
    expect(calls).toHaveLength(1);
    const body = calls[0]!.init!.body as URLSearchParams;
    expect(body.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    expect(body.get('assertion')).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    // Within the last minute of its life the token is fetched again.
    await accessToken(key, SEARCH_CONSOLE_SCOPE, fetcher, new Date(t0.getTime() + 3_550_000));
    expect(calls).toHaveLength(2);
    // A refusal is an error carrying Google's reason, not a token.
    const refused = fakeFetch([
      ['token', { error: 'invalid_grant', error_description: 'Invalid JWT Signature.' }, 400],
    ]);
    forgetTokens();
    await expect(accessToken(key, SEARCH_CONSOLE_SCOPE, refused.fetcher, t0)).rejects.toThrow(
      /answered 400 \(invalid_grant: Invalid JWT Signature\.\)/,
    );
  });
});

describe('the secret field for a service account (ADR-049)', () => {
  it('refuses a paste that is no key file on service-account rows only, and masks as the account e-mail', async () => {
    const { pem } = await freshKey();
    const field = secretField(
      'apiKey',
      { ar: 'مفتاح', en: 'Key' },
      { serviceAccountWhen: (row) => row['kind'] === 'google-search-console' },
    );
    if (field.type !== 'text') throw new Error('a text field');
    const beforeChange = field.hooks!.beforeChange![0]!;
    const save = (value: unknown, kind: string) =>
      beforeChange({
        value,
        siblingData: { kind },
        collection: { slug: 'connections' },
        originalDoc: {},
        path: ['apiKey'],
        context: {},
        req: {
          payload: { encrypt: (plain: string) => `enc(${plain.length})`, db: {} },
        },
      } as never);
    expect(await save('sk-live', 'openai')).toBe('enc(7)');
    // A field-level error (status 400, the reason on the field), as the form shows it.
    await expect(save('sk-live', 'google-search-console')).rejects.toMatchObject({
      status: 400,
      data: {
        collection: 'connections',
        errors: [
          { path: 'apiKey', message: 'Service account key: not JSON: paste the whole key file' },
        ],
      },
    });
    await expect(save('{"type":"user"}', 'google-search-console')).rejects.toMatchObject({
      data: { errors: [{ path: 'apiKey', message: expect.stringMatching(/not a service/) }] },
    });
    expect(await save(keyFile(pem), 'google-search-console')).toBe(`enc(${keyFile(pem).length})`);
    expect(await save('', 'google-search-console')).toBeNull();
    expect(serviceAccountProblem('••••@x.iam.gserviceaccount.com')).toBeNull();
    expect(serviceAccountProblem(undefined)).toBeNull();
    expect(maskOfServiceAccount(keyFile(pem))).toBe('••••@b7r-site.iam.gserviceaccount.com');
    expect(maskOfServiceAccount('garbage')).toBe('••••????');
    // The read hook picks the mask by the row's kind.
    const afterRead = field.hooks!.afterRead![0]!;
    const read = (kind: string) =>
      afterRead({
        value: 'enc',
        req: { context: {}, payload: { decrypt: () => keyFile(pem) } },
        siblingData: { kind },
      } as never);
    expect(read('google-search-console')).toBe('••••@b7r-site.iam.gserviceaccount.com');
    expect(read('openai')).toBe(`••••${keyFile(pem).slice(-4)}`);
    expect(readValue({ stored: 'enc', reveal: true, decrypt: () => 'plain' })).toBe('plain');
  });
});

describe('the service kinds (ADR-049)', () => {
  it('names six service kinds the engine picker leaves out', () => {
    expect(kindsThat('service')).toEqual([
      'google-search-console',
      'bing-webmaster',
      'pagespeed',
      'umami',
      'google-calendar',
      'mock-calendar',
    ]);
    // The calendar takes the same key file as Search Console (ADR-062); the mock has none.
    expect(KINDS['google-calendar'].secret).toBe('serviceAccount');
    expect(KINDS['mock-calendar']).toMatchObject({ secret: 'apiKey', needsBaseUrl: false });
    expect(kindsThat('ai')).not.toContain('pagespeed');
    expect(isServiceKind('bing-webmaster')).toBe(true);
    expect(isServiceKind('umami')).toBe(true);
    expect(isServiceKind('openai')).toBe(false);
    expect(isServiceKind(undefined)).toBe(false);
    expect(KINDS['google-search-console'].secret).toBe('serviceAccount');
    expect(KINDS.pagespeed.secret).toBe('apiKey');
    expect(KINDS.umami).toMatchObject({ secret: 'apiKey', needsBaseUrl: false });
    // Umami's address is optional (the Cloud when empty); a compatible endpoint's required.
    expect(takesBaseUrl('umami')).toBe(true);
    expect(takesBaseUrl('openai-compatible')).toBe(true);
    expect(takesBaseUrl('pagespeed')).toBe(false);
    expect(takesBaseUrl(undefined)).toBe(false);
  });

  it('allows one enabled connection per service kind', async () => {
    const hook = Connections.hooks!.beforeValidate!.find((h) =>
      h.toString().includes('isServiceKind'),
    )!;
    const data = { kind: 'pagespeed', enabled: true, label: 'PSI' };
    await expect(hook({ data, req: withOthers(1), operation: 'create' } as never)).rejects.toThrow(
      /One connection of the kind "PageSpeed Insights"/,
    );
    expect(await hook({ data, req: withOthers(0), operation: 'create' } as never)).toBe(data);
    // A second AI connection, or a disabled service one, is fine.
    expect(
      await hook({ data: { kind: 'openai', enabled: true }, req: withOthers(1) } as never),
    ).toMatchObject({ kind: 'openai' });
    expect(
      await hook({ data: { kind: 'pagespeed', enabled: false }, req: withOthers(1) } as never),
    ).toMatchObject({ enabled: false });
  });

  it('dispatches a service kind Test to its client and refuses one without a key', async () => {
    const ran: string[] = [];
    const services = {
      pagespeed: async (secret: string | null) => {
        ran.push(`psi:${secret}`);
        return 'mobile performance: 96';
      },
      'bing-webmaster': async () => 'https://b7r.sa/',
    };
    expect(await testConnection(connectionOf('pagespeed', null), 3, services)).toMatchObject({
      ok: true,
      message: 'mobile performance: 96',
    });
    expect(ran).toEqual(['psi:null']);
    expect(await testConnection(connectionOf('bing-webmaster', null), 4, services)).toMatchObject({
      ok: false,
      message: expect.stringMatching(/no key saved/),
    });
    expect(
      await testConnection(connectionOf('google-search-console', '{}'), 5, services),
    ).toMatchObject({ ok: false, message: expect.stringMatching(/no test for the kind/) });
  });
});

describe('Search Console (ADR-049 D4)', () => {
  it('names the domain property and a 28-day window ending three days back', () => {
    expect(propertyFor('https://www.b7r.sa')).toBe('sc-domain:b7r.sa');
    expect(windowEnding(new Date('2026-09-16T10:00:00Z'))).toEqual({
      from: '2026-08-17',
      to: '2026-09-13',
    });
  });

  it('reads the totals row (no keys), the rows by a dimension and the sites out of the API shapes', () => {
    // A query without dimensions answers one keyless row: the property's totals.
    expect(
      parseTotals({
        rows: [{ clicks: 41, impressions: 2210, ctr: 0.01855, position: 14.3 }],
        responseAggregationType: 'byProperty',
      }),
    ).toEqual({ clicks: 41, impressions: 2210, ctr: 0.01855, position: 14.3 });
    expect(parseTotals({ responseAggregationType: 'byProperty' })).toEqual({
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
    });
    expect(
      parseRows({
        rows: [
          { keys: ['طباعة تيشيرت'], clicks: 12, impressions: 340, ctr: 0.035, position: 8.2 },
          { clicks: 1 },
          { keys: [7] },
        ],
      }),
    ).toEqual([{ key: 'طباعة تيشيرت', clicks: 12, impressions: 340, ctr: 0.035, position: 8.2 }]);
    expect(parseRows({})).toEqual([]);
    expect(parseRows(null)).toEqual([]);
    expect(
      parseSites({
        siteEntry: [{ siteUrl: 'sc-domain:b7r.sa', permissionLevel: 'siteFullUser' }, { x: 1 }],
      }),
    ).toEqual([{ siteUrl: 'sc-domain:b7r.sa', permissionLevel: 'siteFullUser' }]);
  });

  it('pulls totals and the three breakdowns with a bearer token; a bad status is an error', async () => {
    const { pem } = await freshKey();
    const { fetcher, calls } = fakeFetch([
      ['oauth2.googleapis.com/token', { access_token: 'ya29.t', expires_in: 3600 }],
      ['/sites', { siteEntry: [{ siteUrl: 'sc-domain:b7r.sa', permissionLevel: 'siteOwner' }] }],
    ]);
    // The totals query has no dimension and answers a keyless row; the three others answer keyed rows.
    const byBody = fetcher;
    const routed = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes('searchAnalytics')) {
        calls.push({ url: String(input), init });
        const asked = JSON.parse(String(init?.body)) as { dimensions?: string[] };
        return Response.json(
          asked.dimensions
            ? { rows: [{ keys: [`${asked.dimensions[0]}-1`], clicks: 2, impressions: 9 }] }
            : { rows: [{ clicks: 41, impressions: 2210, ctr: 0.0186, position: 14.3 }] },
        );
      }
      return byBody(input, init);
    }) as typeof fetch;
    const fetcher2 = routed;
    const client = searchConsoleClient(keyFile(pem), 'https://b7r.sa', fetcher2);
    expect(await client.sites()).toEqual([
      { siteUrl: 'sc-domain:b7r.sa', permissionLevel: 'siteOwner' },
    ]);
    const snapshot = await client.pull(new Date('2026-09-16T10:00:00Z'));
    expect(snapshot).toMatchObject({
      property: 'sc-domain:b7r.sa',
      from: '2026-08-17',
      to: '2026-09-13',
      totals: { clicks: 41, impressions: 2210, position: 14.3 },
    });
    expect(snapshot.queries).toEqual([
      { key: 'query-1', clicks: 2, impressions: 9, ctr: 0, position: 0 },
    ]);
    expect(snapshot.pages[0]?.key).toBe('page-1');
    expect(snapshot.countries[0]?.key).toBe('country-1');
    const queries = calls.filter((c) => c.url.includes('searchAnalytics'));
    expect(queries).toHaveLength(4);
    expect(new Headers(queries[0]!.init!.headers).get('authorization')).toBe('Bearer ya29.t');
    expect(JSON.parse(String(queries[1]!.init!.body))).toMatchObject({
      dimensions: ['query'],
      rowLimit: 25,
    });
    expect(() => searchConsoleClient('not json', 'https://b7r.sa', fetcher)).toThrow(/not JSON/);
    forgetTokens();
    const down = fakeFetch([
      ['token', { access_token: 'ya29.t' }],
      ['searchAnalytics', { error: 'quota' }, 429],
    ]);
    await expect(
      searchConsoleClient(keyFile(pem), 'https://b7r.sa', down.fetcher).pull(new Date()),
    ).rejects.toThrow(/answered 429/);
  });
});

describe('Bing Webmaster (ADR-049 D4)', () => {
  it('reads the JSON API shapes: the wrapped dates, the sites, the daily rows, the queries merged', () => {
    expect(bingDate('/Date(1757980800000)/')).toBe('2025-09-16');
    expect(bingDate('/Date(1757980800000+0000)/')).toBe('2025-09-16');
    expect(bingDate('2026-09-01T00:00:00')).toBe('2026-09-01');
    expect(bingDate('soon')).toBeNull();
    expect(parseUserSites({ d: [{ Url: 'https://b7r.sa/' }, { Url: 3 }] })).toEqual([
      'https://b7r.sa/',
    ]);
    expect(
      parseTrafficStats({
        d: [
          { Date: '/Date(1757980800000)/', Clicks: 3, Impressions: 40 },
          { Date: 'bad', Clicks: 1 },
        ],
      }),
    ).toEqual([{ date: '2025-09-16', clicks: 3, impressions: 40 }]);
    expect(
      parseQueryStats({
        d: [
          { Query: 'تيشيرت', Clicks: 1, Impressions: 10, AvgImpressionPosition: 4 },
          { Query: 'تيشيرت', Clicks: 2, Impressions: 20, AvgImpressionPosition: 6 },
          { Query: 'hoodie', Clicks: 0, Impressions: 50 },
          { Clicks: 9 },
        ],
      }),
    ).toEqual([
      { query: 'hoodie', clicks: 0, impressions: 50, position: 0 },
      { query: 'تيشيرت', clicks: 3, impressions: 30, position: 6 },
    ]);
  });

  it('pulls the last 28 days and the queries with the key as a query parameter', async () => {
    // Forty rows over two months, newest first: the last 28 by date, whatever the order.
    const days = Array.from({ length: 40 }, (_, i) => ({
      Date: `2026-${i < 28 ? '08' : '07'}-${String(1 + (i % 28)).padStart(2, '0')}T00:00:00`,
      Clicks: 1,
      Impressions: i < 28 ? 2 : 100,
    })).toReversed();
    const { fetcher, calls } = fakeFetch([
      ['GetUserSites', { d: [{ Url: 'https://b7r.sa/' }] }],
      ['GetRankAndTrafficStats', { d: days }],
      ['GetQueryStats', { d: [{ Query: 'q', Clicks: 1, Impressions: 5 }] }],
    ]);
    const client = bingClient('bing-key', 'https://b7r.sa', fetcher);
    expect(await client.sites()).toEqual(['https://b7r.sa/']);
    const snapshot = await client.pull();
    expect(snapshot.days).toHaveLength(28);
    expect(snapshot.days[0]?.date).toBe('2026-08-01');
    expect(snapshot.days.at(-1)?.date).toBe('2026-08-28');
    expect(snapshot.totals).toEqual({ clicks: 28, impressions: 56 });
    expect(snapshot.queries[0]).toMatchObject({ query: 'q' });
    expect(calls.every((c) => new URL(c.url).searchParams.get('apikey') === 'bing-key')).toBe(true);
    const refused = fakeFetch([['GetUserSites', { Message: 'no' }, 401]]);
    await expect(bingClient('x', 'https://b7r.sa', refused.fetcher).sites()).rejects.toThrow(
      /answered 401/,
    );
  });
});

describe('PageSpeed (ADR-049 D4)', () => {
  const body = {
    lighthouseResult: {
      categories: {
        performance: { score: 0.955 },
        accessibility: { score: 1 },
        'best-practices': { score: 0.79 },
        seo: { score: 0.92 },
      },
      audits: {
        'largest-contentful-paint': { numericValue: 1834.2 },
        'cumulative-layout-shift': { numericValue: 0.01 },
      },
    },
    loadingExperience: { metrics: { INTERACTION_TO_NEXT_PAINT: { percentile: 120 } } },
  };

  it('turns one run into the row: scores as 0 to 100, LCP and CLS from the lab, INP from the field', () => {
    expect(parseAudit('https://b7r.sa/', 'mobile', body)).toEqual({
      url: 'https://b7r.sa/',
      strategy: 'mobile',
      scores: { performance: 96, accessibility: 100, bestPractices: 79, seo: 92 },
      lcpMs: 1834.2,
      cls: 0.01,
      inpMs: 120,
    });
    expect(parseAudit('https://b7r.sa/', 'desktop', {})).toMatchObject({
      scores: { performance: null, seo: null },
      lcpMs: null,
      inpMs: null,
    });
  });

  it('audits every URL on both strategies, keeps a partial row when one fails, strips URLs from the reason', async () => {
    const { fetcher, calls } = fakeFetch([
      ['url=https%3A%2F%2Fb7r.sa%2Fblog', { error: 'lighthouse failed' }, 500],
      ['runPagespeed', body],
    ]);
    const snapshot = await pagespeedClient('psi-key', fetcher).pull([
      'https://b7r.sa/',
      'https://b7r.sa/blog',
    ]);
    expect(snapshot.audits.map((a) => `${a.strategy} ${a.url}`)).toEqual([
      'mobile https://b7r.sa/',
      'desktop https://b7r.sa/',
    ]);
    expect(snapshot.errors).toEqual([
      { url: 'https://b7r.sa/blog', strategy: 'mobile', error: 'PageSpeed answered 500' },
      { url: 'https://b7r.sa/blog', strategy: 'desktop', error: 'PageSpeed answered 500' },
    ]);
    const first = new URL(calls[0]!.url);
    expect(first.searchParams.get('key')).toBe('psi-key');
    expect(first.searchParams.getAll('category')).toEqual([
      'performance',
      'accessibility',
      'best-practices',
      'seo',
    ]);
    expect(PAGESPEED_TIMEOUT_MS).toBe(90_000);
    // No key: the public quota, no `key` parameter.
    const open = fakeFetch([['runPagespeed', body]]);
    await pagespeedClient(null, open.fetcher).audit('https://b7r.sa/', 'mobile');
    expect(new URL(open.calls[0]!.url).searchParams.has('key')).toBe(false);
  });
});

describe('the pull: the audited pages, the topics it suggests, the page reads (ADR-049 D4)', () => {
  it('audits the home, the catalogue, the first product, the blog and the newest post', async () => {
    const { payload } = fakePayload({
      products: [{ slug: 'hoodie' }],
      posts: [{ slug: 'how-to-print' }],
    });
    expect(await auditUrls(payload, 'https://b7r.sa')).toEqual([
      'https://b7r.sa/',
      'https://b7r.sa/products',
      'https://b7r.sa/products/hoodie',
      'https://b7r.sa/blog',
      'https://b7r.sa/blog/how-to-print',
    ]);
    expect(await auditUrls(fakePayload({}).payload, 'https://b7r.sa')).toEqual([
      'https://b7r.sa/',
      'https://b7r.sa/products',
      'https://b7r.sa/blog',
    ]);
  });

  it('suggests non-brand queries with enough impressions as backlog topics, once each, to the nearest hub', async () => {
    const hubs = [
      { id: 1, name: 'طباعة', description: 'كل ما يخص الطباعة على التيشيرت' },
      { id: 2, name: 'Hoodies', description: 'hoodie printing' },
    ];
    const { payload, created } = fakePayload({
      categories: hubs,
      'ai-topics': [{ primaryKeyword: 'already here' }],
    });
    const snapshot = {
      property: 'sc-domain:b7r.sa',
      from: '2026-08-17',
      to: '2026-09-13',
      totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      pages: [],
      countries: [],
      queries: [
        { key: 'بحر برنت', clicks: 9, impressions: 900, ctr: 0, position: 1 },
        { key: 'b7r print', clicks: 9, impressions: 900, ctr: 0, position: 1 },
        { key: 'طباعة تيشيرت', clicks: 1, impressions: TOPIC_MIN_IMPRESSIONS, ctr: 0, position: 9 },
        { key: 'hoodie printing riyadh', clicks: 0, impressions: 120, ctr: 0, position: 12 },
        { key: 'already here', clicks: 0, impressions: 500, ctr: 0, position: 3 },
        { key: 'thin', clicks: 0, impressions: TOPIC_MIN_IMPRESSIONS - 1, ctr: 0, position: 3 },
        { key: 'x'.repeat(101), clicks: 0, impressions: 999, ctr: 0, position: 3 },
      ],
    };
    expect(await suggestTopics(payload, snapshot)).toBe(2);
    expect(created.map((c) => [c['title'], c['language'], c['hub'], c['source']])).toEqual([
      ['hoodie printing riyadh', 'en', 2, 'searchConsole'],
      ['طباعة تيشيرت', 'ar', 1, 'searchConsole'],
    ]);
    expect(created[0]).toMatchObject({ status: 'backlog', intent: 'informational' });
    // The priority stays inside the field's 1 to 5 whatever the impressions.
    expect(created.map((c) => c['priority'])).toEqual([3, 2]);
    expect([0, 50, 99, 316, 1_000, 5_000, 1e9].map(topicPriority)).toEqual([1, 2, 3, 3, 4, 5, 5]);
  });

  it('writes the Search Console row before suggesting topics; a topics failure costs nothing', async () => {
    const { pem } = await freshKey();
    const written: string[] = [];
    const warned: string[] = [];
    const payload = {
      find: async ({ collection, where }: { collection: string; where: unknown }) => {
        if (collection === 'connections') {
          const asked = JSON.stringify(where).includes('google-search-console');
          const docs = asked ? [{ id: 1, kind: 'google-search-console', enabled: true }] : [];
          return { docs, totalDocs: docs.length };
        }
        if (collection === 'categories') throw new Error('hubs unreadable');
        return { docs: [], totalDocs: 0 };
      },
      findByID: async () => ({
        id: 1,
        kind: 'google-search-console',
        apiKey: keyFile(pem),
        model: '',
        baseUrl: null,
        enabled: true,
      }),
      findGlobal: async () => {
        throw new Error('no globals in this test');
      },
      db: {
        drizzle: {
          // `upsertMetric`'s statement carries the source as its second parameter.
          execute: async (q: { queryChunks?: unknown[] }) => {
            const params = (q.queryChunks ?? []).filter((c) => typeof c === 'string');
            written.push(String(params[1] ?? '?'));
          },
        },
      },
      logger: { warn: (o: { msg: string }) => warned.push(o.msg), info: () => {} },
    } as unknown as Payload;
    const { fetcher } = fakeFetch([
      ['oauth2.googleapis.com/token', { access_token: 'ya29.t', expires_in: 3600 }],
      ['searchAnalytics', { rows: [{ keys: ['q'], clicks: 1, impressions: 500 }] }],
    ]);
    vi.stubGlobal('fetch', fetcher);
    try {
      const result = await pull(payload, new Date('2026-09-16T01:00:00Z'));
      expect(result.pulled).toEqual(['search-console']);
      expect(written).toEqual(['search-console']);
      expect(result.topicsAdded).toBe(0);
      expect(warned.some((m) => /topic suggestions failed: hubs unreadable/.test(m))).toBe(true);
      // The score row fails on this bare fake (no globals): named, the pull goes on.
      expect(result.failed.map((f) => f.source)).toEqual(['score']);
    } finally {
      vi.unstubAllGlobals();
      forgetTokens();
    }
  });

  it('reads the latest snapshot per service, which are connected, and the week-old score', async () => {
    const rows: Record<string, unknown[]> = {
      metrics: [],
      connections: [{ kind: 'pagespeed' }, { kind: 'openai' }],
    };
    const payload = {
      find: async ({ collection, where }: { collection: string; where: unknown }) => {
        if (collection !== 'metrics') return { docs: rows[collection] ?? [] };
        const source = (where as { source: { equals: string } }).source.equals;
        const docs = (rows['metrics'] as Array<{ source: string }>).filter(
          (m) => m.source === source,
        );
        return { docs };
      },
    } as unknown as Payload;
    expect(await signalRows(payload)).toEqual({
      searchConsole: null,
      bing: null,
      pagespeed: null,
      connected: { 'google-search-console': false, 'bing-webmaster': false, pagespeed: true },
    });
    expect(await scoreTrend(payload, 70)).toBeNull();
    rows['metrics'] = [
      { source: 'pagespeed', date: '2026-09-16', data: { audits: [], errors: [] } },
      { source: 'score', date: '2026-09-16', data: { overall: 70 } },
      { source: 'score', date: '2026-09-09', data: { overall: 64 } },
    ];
    expect((await signalRows(payload)).pagespeed).toEqual({
      date: '2026-09-16',
      data: { audits: [], errors: [] },
    });
    expect(await scoreTrend(payload, 70)).toEqual({
      since: { date: '2026-09-09', overall: 64 },
      delta: 6,
    });
    // One row alone is no trend.
    rows['metrics'] = [{ source: 'score', date: '2026-09-16', data: { overall: 70 } }];
    expect(await scoreTrend(payload, 70)).toBeNull();
  });
});
