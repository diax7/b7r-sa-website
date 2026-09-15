/**
 * The kinds of connection (ADR-047): the four vendors the AI SDK speaks, an OpenAI-compatible
 * endpoint for any other AI with an API, and the mock the tests and the review server run
 * on (refused in production, as before). A kind names the factory in `model.ts`; its default
 * model and rates are the vendor's published ones at the time of writing, filled into a new
 * connection that leaves them empty and editable afterwards.
 */
export const CONNECTION_KINDS = [
  'openai',
  'anthropic',
  'google',
  'deepseek',
  'openai-compatible',
  'mock',
] as const;

export type ConnectionKind = (typeof CONNECTION_KINDS)[number];

export interface KindInfo {
  label: { ar: string; en: string };
  defaultModel: string;
  /** USD per million tokens, input and output. */
  rates: { input: number; output: number };
  /** The kind calls a URL the connection names (`https://` only). */
  needsBaseUrl: boolean;
}

export const KINDS: Record<ConnectionKind, KindInfo> = {
  openai: {
    label: { ar: 'OpenAI', en: 'OpenAI' },
    defaultModel: 'gpt-4.1',
    rates: { input: 2, output: 8 },
    needsBaseUrl: false,
  },
  anthropic: {
    label: { ar: 'Anthropic (Claude)', en: 'Anthropic (Claude)' },
    defaultModel: 'claude-sonnet-4-5',
    rates: { input: 3, output: 15 },
    needsBaseUrl: false,
  },
  google: {
    label: { ar: 'Google (Gemini)', en: 'Google (Gemini)' },
    defaultModel: 'gemini-2.5-pro',
    rates: { input: 1.25, output: 10 },
    needsBaseUrl: false,
  },
  deepseek: {
    label: { ar: 'DeepSeek', en: 'DeepSeek' },
    defaultModel: 'deepseek-chat',
    rates: { input: 0.27, output: 1.1 },
    needsBaseUrl: false,
  },
  'openai-compatible': {
    label: { ar: 'خدمة متوافقة مع OpenAI', en: 'OpenAI-compatible endpoint' },
    defaultModel: '',
    rates: { input: 0, output: 0 },
    needsBaseUrl: true,
  },
  mock: {
    label: { ar: 'تجريبي (اختبارات فقط)', en: 'Mock (tests only)' },
    defaultModel: 'mock',
    rates: { input: 0, output: 0 },
    needsBaseUrl: false,
  },
};

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
