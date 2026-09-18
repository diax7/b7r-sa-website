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
   * What the vendor charges per web search beyond tokens, in USD (the ledger, ADR-049 D5),
   * for a model family `searchFeeFor` does not know; `searchFeeFor` decides for the known
   * ones (OpenAI's mini and nano at $25 a thousand, Gemini 3 at $14). DeepSeek, a compatible
   * endpoint and the mock search nothing through us.
   */
  searchFeeUsd: number;
}

export const KINDS: Record<ConnectionKind, KindInfo> = {
  openai: {
    label: { ar: 'OpenAI', en: 'OpenAI' },
    speaks: 'ai',
    defaultModel: 'gpt-4.1-mini',
    rates: { input: 0.4, output: 1.6 },
    needsBaseUrl: false,
    secret: 'apiKey',
    searchFeeUsd: 0.01,
  },
  anthropic: {
    label: { ar: 'Anthropic (Claude)', en: 'Anthropic (Claude)' },
    speaks: 'ai',
    defaultModel: 'claude-haiku-4-5',
    rates: { input: 1, output: 5 },
    needsBaseUrl: false,
    secret: 'apiKey',
    searchFeeUsd: 0.01,
  },
  google: {
    label: { ar: 'Google (Gemini)', en: 'Google (Gemini)' },
    speaks: 'ai',
    defaultModel: 'gemini-3-flash-preview',
    rates: { input: 0.5, output: 3 },
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

/**
 * The vendors' published prices per million tokens for the models a connection is likely to
 * name (2026-09-16), so the estimate follows the model, not only the kind: picking
 * `gpt-4.1-mini` on an OpenAI row costs a fifth of `gpt-4.1`. A model not listed keeps the
 * rates the row has; the rates stay editable.
 */
export const MODEL_RATES: Record<string, { input: number; output: number }> = {
  'gpt-4.1': { input: 2, output: 8 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-5': { input: 1.25, output: 10 },
  'gpt-5-mini': { input: 0.25, output: 2 },
  'gpt-5-nano': { input: 0.05, output: 0.4 },
  'claude-sonnet-4-5': { input: 3, output: 15 },
  'claude-opus-4-1': { input: 15, output: 75 },
  'claude-haiku-4-5': { input: 1, output: 5 },
  'gemini-2.5-pro': { input: 1.25, output: 10 },
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
  'gemini-3.1-pro-preview': { input: 2, output: 12 },
  'gemini-3-flash-preview': { input: 0.5, output: 3 },
  'deepseek-chat': { input: 0.27, output: 1.1 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },
};

/** The known rates of a model id, exact or by its dated variant (`claude-sonnet-4-5-20250929`). */
export function ratesForModel(model: string): { input: number; output: number } | null {
  const id = model.trim().toLowerCase();
  if (MODEL_RATES[id]) return MODEL_RATES[id];
  // The longest family wins: `gpt-4.1-mini-2025-04-14` is the mini, not `gpt-4.1`.
  const known = Object.keys(MODEL_RATES)
    .filter((k) => id.startsWith(`${k}-`))
    .toSorted((a, b) => b.length - a.length)[0];
  return known ? MODEL_RATES[known]! : null;
}

/**
 * What the vendor charges per web search beyond tokens, by model family (2026-09-16):
 * OpenAI $10 per thousand calls on the full models and $25 on the mini and nano ones;
 * Anthropic $10 per thousand searches; Google $35 per thousand grounded prompts on Gemini
 * 2.5 and $14 on Gemini 3. Zero where the kind offers no search through us.
 */
export function searchFeeFor(kind: ConnectionKind, model: string): number {
  const id = model.toLowerCase();
  if (kind === 'openai') return /mini|nano/.test(id) ? 0.025 : 0.01;
  if (kind === 'google') return /gemini-3/.test(id) ? 0.014 : 0.035;
  return KINDS[kind].searchFeeUsd;
}

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
