import { botByKey } from '@/lib/traffic/bots';

/**
 * What the two counting endpoints accept (ADR-048): a landing from the beacon and a crawl
 * from the proxy. Pure, so the bounds are unit-tested without a server. A path is the page
 * as requested: `/`, `/en`, or one to four segments of `[A-Za-z0-9_-]`, no dot, no query, at
 * most 200 characters; a crawl may also name one of the machine files the bots read.
 */
export const PATH_MAX = 200;
export const REFERRER_MAX = 2000;
export const UTM_MAX = 100;

export const MACHINE_FILES = [
  '/llms.txt',
  '/en/llms.txt',
  '/robots.txt',
  '/sitemap.xml',
  '/feed.xml',
  '/en/feed.xml',
] as const;

const SEGMENT = /^[A-Za-z0-9_-]+$/;
const UTM_TOKEN = /^[A-Za-z0-9._-]+$/;

export interface Landing {
  path: string;
  referrer: string;
  utmSource: string;
}

export interface Crawl {
  bot: string;
  path: string;
}

/** A page path normalised (no trailing slash but on `/`), or null when it is not a page. */
export function pagePath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > PATH_MAX || !value.startsWith('/')) return null;
  if (value.includes('?') || value.includes('#') || value.includes('.')) return null;
  const trimmed = value.length > 1 && value.endsWith('/') ? value.slice(0, -1) : value;
  if (trimmed === '/') return '/';
  const segments = trimmed.slice(1).split('/');
  if (segments.length > 4 || !segments.every((s) => SEGMENT.test(s))) return null;
  return trimmed;
}

/** A page path or one of the machine files. */
export function crawlPath(value: unknown): string | null {
  if (typeof value === 'string' && (MACHINE_FILES as readonly string[]).includes(value)) {
    return value;
  }
  return pagePath(value);
}

export function parseLanding(body: unknown): Landing | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const path = pagePath(b['path']);
  if (!path) return null;
  const referrer = b['referrer'] ?? '';
  if (typeof referrer !== 'string' || referrer.length > REFERRER_MAX) return null;
  const utmSource = b['utmSource'] ?? '';
  if (typeof utmSource !== 'string' || utmSource.length > UTM_MAX) return null;
  if (utmSource && !UTM_TOKEN.test(utmSource)) return null;
  return { path, referrer, utmSource };
}

export function parseCrawl(body: unknown): Crawl | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const bot = typeof b['bot'] === 'string' && botByKey(b['bot']) ? b['bot'] : null;
  const path = crawlPath(b['path']);
  return bot && path ? { bot, path } : null;
}
