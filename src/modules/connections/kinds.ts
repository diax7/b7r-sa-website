/**
 * The kinds of connection (ADR-047, ADR-049): the four vendors the AI SDK speaks, an
 * OpenAI-compatible endpoint for any other AI with an API, the mock the tests and the review
 * server run on (refused in production, as before), and the three services the visibility
 * score reads (Search Console by a service account, Bing Webmaster and PageSpeed by an API
 * key). `speaks` says which: the engine's picker and the citation ledger take `ai`, the
 * nightly pull takes `service`. An AI kind names the factory in `model.ts`; its default model
 * and rates are the vendor's published ones at the time of writing, filled into a new
 * connection that leaves them empty and editable afterwards.
 */
export const CONNECTION_KINDS = [
  'openai',
  'anthropic',
  'google',
  'deepseek',
  'openai-compatible',
  'mock',
  'google-search-console',
  'bing-webmaster',
  'pagespeed',
] as const;

export type ConnectionKind = (typeof CONNECTION_KINDS)[number];

export type Speaks = 'ai' | 'service';

export interface KindInfo {
  label: { ar: string; en: string };
  speaks: Speaks;
  defaultModel: string;
  /** USD per million tokens, input and output. */
  rates: { input: number; output: number };
  /** The kind calls a URL the connection names (`https://` only). */
  needsBaseUrl: boolean;
  /** What the secret is, for the field's label and its guide. */
  secret: 'apiKey' | 'serviceAccount';
  /**
   * What the vendor charges per web search beyond tokens, in USD (the ledger, ADR-049 D5):
   * OpenAI and Anthropic $10 per thousand searches, Google $35 per thousand grounded prompts;
   * DeepSeek, a compatible endpoint and the mock search nothing through us.
   */
  searchFeeUsd: number;
}

export const KINDS: Record<ConnectionKind, KindInfo> = {
  openai: {
    label: { ar: 'OpenAI', en: 'OpenAI' },
    speaks: 'ai',
    defaultModel: 'gpt-4.1',
    rates: { input: 2, output: 8 },
    needsBaseUrl: false,
    secret: 'apiKey',
    searchFeeUsd: 0.01,
  },
  anthropic: {
    label: { ar: 'Anthropic (Claude)', en: 'Anthropic (Claude)' },
    speaks: 'ai',
    defaultModel: 'claude-sonnet-4-5',
    rates: { input: 3, output: 15 },
    needsBaseUrl: false,
    secret: 'apiKey',
    searchFeeUsd: 0.01,
  },
  google: {
    label: { ar: 'Google (Gemini)', en: 'Google (Gemini)' },
    speaks: 'ai',
    defaultModel: 'gemini-2.5-pro',
    rates: { input: 1.25, output: 10 },
    needsBaseUrl: false,
    secret: 'apiKey',
    searchFeeUsd: 0.035,
  },
  deepseek: {
    label: { ar: 'DeepSeek', en: 'DeepSeek' },
    speaks: 'ai',
    defaultModel: 'deepseek-chat',
    rates: { input: 0.27, output: 1.1 },
    needsBaseUrl: false,
    secret: 'apiKey',
    searchFeeUsd: 0,
  },
  'openai-compatible': {
    label: { ar: 'خدمة متوافقة مع OpenAI', en: 'OpenAI-compatible endpoint' },
    speaks: 'ai',
    defaultModel: '',
    rates: { input: 0, output: 0 },
    needsBaseUrl: true,
    secret: 'apiKey',
    searchFeeUsd: 0,
  },
  mock: {
    label: { ar: 'تجريبي (اختبارات فقط)', en: 'Mock (tests only)' },
    speaks: 'ai',
    defaultModel: 'mock',
    rates: { input: 0, output: 0 },
    needsBaseUrl: false,
    secret: 'apiKey',
    searchFeeUsd: 0,
  },
  'google-search-console': {
    label: { ar: 'Google Search Console', en: 'Google Search Console' },
    speaks: 'service',
    defaultModel: '',
    rates: { input: 0, output: 0 },
    needsBaseUrl: false,
    secret: 'serviceAccount',
    searchFeeUsd: 0,
  },
  'bing-webmaster': {
    label: { ar: 'Bing Webmaster Tools', en: 'Bing Webmaster Tools' },
    speaks: 'service',
    defaultModel: '',
    rates: { input: 0, output: 0 },
    needsBaseUrl: false,
    secret: 'apiKey',
    searchFeeUsd: 0,
  },
  pagespeed: {
    label: { ar: 'PageSpeed Insights', en: 'PageSpeed Insights' },
    speaks: 'service',
    defaultModel: '',
    rates: { input: 0, output: 0 },
    needsBaseUrl: false,
    secret: 'apiKey',
    searchFeeUsd: 0,
  },
};

/** The kinds that speak a given way, for the picker's filter and the jobs. */
export function kindsThat(speaks: Speaks): ConnectionKind[] {
  return CONNECTION_KINDS.filter((k) => KINDS[k].speaks === speaks);
}

export function isServiceKind(kind: unknown): boolean {
  return isConnectionKind(kind) && KINDS[kind].speaks === 'service';
}

export function isConnectionKind(value: unknown): value is ConnectionKind {
  return typeof value === 'string' && (CONNECTION_KINDS as readonly string[]).includes(value);
}

/** `AI_CONTENT_MOCK=1` lets a mock connection run; the production assert refuses it. */
export function mockAllowed(raw: Record<string, string | undefined> = process.env): boolean {
  return raw['AI_CONTENT_MOCK'] === '1';
}

/** What a connection tells the engine (and the test): read with the key revealed. */
export interface ConnectionSpec {
  id: number;
  label: string;
  kind: ConnectionKind;
  model: string;
  apiKey: string | null;
  baseUrl: string | null;
  rates: { inputPerMillionUsd: number; outputPerMillionUsd: number };
  /** Null: no limit. */
  monthlyLimitUsd: number | null;
  enabled: boolean;
}
