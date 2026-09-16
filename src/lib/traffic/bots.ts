/**
 * The crawlers worth counting (ADR-048): the AI companies' fetchers and trainers, the search
 * engines' bots, the two answer-engine fetchers of C-08. Keyed by the token each puts in its
 * user agent; `Google-Extended` and `Applebot-Extended` are robots.txt tokens, never a user
 * agent, and are not here. Longest token first, so `Claude-SearchBot` is not `ClaudeBot`.
 */
export type BotFamily =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'perplexity'
  | 'microsoft'
  | 'apple'
  | 'meta'
  | 'amazon'
  | 'bytedance'
  | 'commoncrawl'
  | 'duckduckgo'
  | 'yandex';

export interface Bot {
  /** Lowercase, the stored source of a crawl row. */
  key: string;
  /** As the vendor writes it in the user agent. */
  token: string;
  family: BotFamily;
  /** What the bot does: reads to answer a person now, indexes for search, or gathers for training (the Traffic page says which). */
  role: 'answer' | 'search' | 'training';
}

const TABLE: Array<Omit<Bot, 'key'>> = [
  { token: 'OAI-SearchBot', family: 'openai', role: 'search' },
  { token: 'ChatGPT-User', family: 'openai', role: 'answer' },
  { token: 'GPTBot', family: 'openai', role: 'training' },
  { token: 'Claude-SearchBot', family: 'anthropic', role: 'search' },
  { token: 'Claude-User', family: 'anthropic', role: 'answer' },
  { token: 'ClaudeBot', family: 'anthropic', role: 'training' },
  { token: 'Googlebot', family: 'google', role: 'search' },
  { token: 'PerplexityBot', family: 'perplexity', role: 'search' },
  { token: 'Perplexity-User', family: 'perplexity', role: 'answer' },
  { token: 'Bingbot', family: 'microsoft', role: 'search' },
  { token: 'BingPreview', family: 'microsoft', role: 'search' },
  { token: 'Applebot', family: 'apple', role: 'search' },
  { token: 'Meta-ExternalAgent', family: 'meta', role: 'training' },
  { token: 'FacebookBot', family: 'meta', role: 'search' },
  { token: 'Amazonbot', family: 'amazon', role: 'search' },
  { token: 'Bytespider', family: 'bytedance', role: 'training' },
  { token: 'CCBot', family: 'commoncrawl', role: 'training' },
  { token: 'DuckAssistBot', family: 'duckduckgo', role: 'answer' },
  { token: 'YandexBot', family: 'yandex', role: 'search' },
];

export const BOTS: Bot[] = TABLE.map((b) => ({ ...b, key: b.token.toLowerCase() })).toSorted(
  (a, b) => b.token.length - a.token.length,
);

const BY_KEY = new Map(BOTS.map((b) => [b.key, b]));

/** The bot behind a user agent, or null for a browser (or a bot the table does not name). */
export function botOf(userAgent: string | null | undefined): Bot | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  return BOTS.find((b) => ua.includes(b.key)) ?? null;
}

export function botByKey(key: string): Bot | null {
  return BY_KEY.get(key) ?? null;
}

/** A user agent that calls itself a bot without being in the table: a landing to drop, not a crawl. */
const GENERIC_BOT = /bot|crawler|spider|scrape|python-requests|node-fetch|go-http-client|curl\//i;

export function looksLikeBot(userAgent: string | null | undefined): boolean {
  return !userAgent || botOf(userAgent) !== null || GENERIC_BOT.test(userAgent);
}
