/**
 * Where a visitor came from (ADR-048), in two halves. At write time `sourceOf()` turns a
 * referrer and a `utm_source` into one stored word, the source: a host folded of its
 * `www.`/`m.`/`l.` and app-link forms, a known UTM token folded to its host, or `direct`. At
 * read time `channelOf()` turns a source into a channel and its group. The channel is never
 * stored, so this table can grow next month and re-bucket the whole history.
 */
export type ChannelGroup = 'ai' | 'search' | 'social' | 'referral' | 'direct';

export interface Channel {
  key: string;
  group: ChannelGroup;
  /** A proper noun, the same in both panel languages. */
  label: string;
}

const CHANNELS: Channel[] = [
  { key: 'chatgpt', group: 'ai', label: 'ChatGPT' },
  { key: 'gemini', group: 'ai', label: 'Gemini' },
  { key: 'claude', group: 'ai', label: 'Claude' },
  { key: 'perplexity', group: 'ai', label: 'Perplexity' },
  { key: 'copilot', group: 'ai', label: 'Copilot' },
  { key: 'grok', group: 'ai', label: 'Grok' },
  { key: 'deepseek', group: 'ai', label: 'DeepSeek' },
  { key: 'ai-other', group: 'ai', label: 'Other AI' },
  { key: 'google', group: 'search', label: 'Google' },
  { key: 'bing', group: 'search', label: 'Bing' },
  { key: 'search-other', group: 'search', label: 'Other search' },
  { key: 'instagram', group: 'social', label: 'Instagram' },
  { key: 'tiktok', group: 'social', label: 'TikTok' },
  { key: 'x', group: 'social', label: 'X' },
  { key: 'snapchat', group: 'social', label: 'Snapchat' },
  { key: 'facebook', group: 'social', label: 'Facebook' },
  { key: 'linkedin', group: 'social', label: 'LinkedIn' },
  { key: 'youtube', group: 'social', label: 'YouTube' },
  { key: 'whatsapp', group: 'social', label: 'WhatsApp' },
  { key: 'telegram', group: 'social', label: 'Telegram' },
  { key: 'pinterest', group: 'social', label: 'Pinterest' },
  { key: 'reddit', group: 'social', label: 'Reddit' },
  { key: 'threads', group: 'social', label: 'Threads' },
  { key: 'social-other', group: 'social', label: 'Other social' },
  { key: 'referral', group: 'referral', label: 'Other sites' },
  { key: 'direct', group: 'direct', label: 'Direct' },
];

const BY_KEY = new Map(CHANNELS.map((c) => [c.key, c]));

/** A folded host and the channel it belongs to. One line per host; subdomains fold first. */
const HOSTS: Record<string, string> = {
  'chatgpt.com': 'chatgpt',
  'chat.openai.com': 'chatgpt',
  'openai.com': 'chatgpt',
  'gemini.google.com': 'gemini',
  'bard.google.com': 'gemini',
  'aistudio.google.com': 'gemini',
  'claude.ai': 'claude',
  'anthropic.com': 'claude',
  'perplexity.ai': 'perplexity',
  'copilot.microsoft.com': 'copilot',
  'grok.com': 'grok',
  'x.ai': 'grok',
  'chat.deepseek.com': 'deepseek',
  'deepseek.com': 'deepseek',
  'you.com': 'ai-other',
  'poe.com': 'ai-other',
  'meta.ai': 'ai-other',
  'chat.mistral.ai': 'ai-other',
  'mistral.ai': 'ai-other',
  'duckduckgo.com': 'search-other',
  'search.yahoo.com': 'search-other',
  'yahoo.com': 'search-other',
  'yandex.com': 'search-other',
  'yandex.ru': 'search-other',
  'ecosia.org': 'search-other',
  'search.brave.com': 'search-other',
  'baidu.com': 'search-other',
  'instagram.com': 'instagram',
  'tiktok.com': 'tiktok',
  'x.com': 'x',
  'twitter.com': 'x',
  'snapchat.com': 'snapchat',
  'facebook.com': 'facebook',
  'messenger.com': 'facebook',
  'linkedin.com': 'linkedin',
  'youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'whatsapp.com': 'whatsapp',
  'telegram.org': 'telegram',
  't.me': 'telegram',
  'pinterest.com': 'pinterest',
  'reddit.com': 'reddit',
  'threads.net': 'threads',
  'threads.com': 'threads',
  'vk.com': 'social-other',
  'tumblr.com': 'social-other',
};

/** `utm_source` tokens the assistants append to the links they show, and the host each stands for. */
const UTM_TOKENS: Record<string, string> = {
  'chatgpt.com': 'chatgpt.com',
  chatgpt: 'chatgpt.com',
  openai: 'chatgpt.com',
  perplexity: 'perplexity.ai',
  copilot: 'copilot.microsoft.com',
  gemini: 'gemini.google.com',
  claude: 'claude.ai',
  grok: 'grok.com',
  deepseek: 'chat.deepseek.com',
};

/** The app-link and tracking hosts folded to the site they stand for. */
const HOST_ALIASES: Record<string, string> = {
  'android-app://com.google.android.googlequicksearchbox': 'google.com',
  'android-app://com.google.android.gm': 'gmail.com',
  't.co': 'x.com',
  'out.reddit.com': 'reddit.com',
  'away.vk.com': 'vk.com',
  'l.facebook.com': 'facebook.com',
  'lm.facebook.com': 'facebook.com',
  'l.instagram.com': 'instagram.com',
  'l.messenger.com': 'facebook.com',
};

const SUBDOMAINS = /^(?:www|m|l|lm|mobile|amp)\./;
const APP_LINK = /^android-app:\/\/([a-z0-9.]+)/i;
const HOST_MAX = 100;

/**
 * The referrer's host as the table keys it: lowercase, the `www.`/`m.`/`l.` prefixes and the
 * app-link forms folded, or null when there is no usable host (empty, malformed, no dot).
 */
export function foldHost(referrer: string): string | null {
  const trimmed = referrer.trim();
  if (!trimmed) return null;
  const app = APP_LINK.exec(trimmed);
  if (app) {
    const key = `android-app://${app[1]!.toLowerCase()}`;
    return HOST_ALIASES[key] ?? app[1]!.toLowerCase();
  }
  let host: string;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    host = url.hostname.toLowerCase();
  } catch {
    return null;
  }
  const aliased = HOST_ALIASES[host];
  if (aliased) return aliased;
  host = host.replace(SUBDOMAINS, '');
  if (!host.includes('.') || host.length > HOST_MAX) return null;
  return host;
}

const SITE_HOST = /^(?:www\.)?b7r\.sa$/;
const GOOGLE = /^google\.[a-z.]+$/;
const BING = /^bing\.[a-z.]+$/;

/** The site's own hostname without its port, as `foldHost` would fold it, or null. */
function ownHost(siteHost: string | undefined): string | null {
  if (!siteHost) return null;
  try {
    return new URL(`http://${siteHost}`).hostname.toLowerCase().replace(SUBDOMAINS, '');
  } catch {
    return null;
  }
}

/** The channel key of a host the table knows (Google and Bing on any top-level domain), or null. */
function knownHost(host: string): string | null {
  return HOSTS[host] ?? (GOOGLE.test(host) ? 'google' : BING.test(host) ? 'bing' : null);
}

/**
 * The one stored word for a landing: a referrer host the table knows, else a known UTM token
 * folded to its host, else the referrer host as it is, else an unknown UTM token (it reads as
 * a referral with the token as its name), else `direct`. Null when the referrer is the
 * site's own host (an internal move the client missed): nothing to count.
 */
export function sourceOf(args: {
  referrer: string;
  utmSource: string;
  /** The site's own host, dropped when it shows as a referrer; `b7r.sa` and `www.` always are. */
  siteHost?: string;
}): string | null {
  const host = foldHost(args.referrer);
  if (host && (SITE_HOST.test(host) || host === ownHost(args.siteHost))) return null;
  const token = args.utmSource.trim().toLowerCase();
  if (host && knownHost(host)) return host;
  if (token && UTM_TOKENS[token]) return UTM_TOKENS[token];
  if (host) return host;
  if (token) return token;
  return 'direct';
}

/** A source's channel: the table's, Google and Bing on any top-level domain, else a referral. */
export function channelOf(source: string): Channel {
  if (source === 'direct') return BY_KEY.get('direct')!;
  const key = knownHost(source);
  return (key ? BY_KEY.get(key) : undefined) ?? BY_KEY.get('referral')!;
}

export const CHANNEL_GROUPS: ChannelGroup[] = ['ai', 'search', 'social', 'referral', 'direct'];

export function channels(): Channel[] {
  return CHANNELS;
}
