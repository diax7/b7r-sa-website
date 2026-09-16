import type { Payload } from 'payload';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { internalToken, sameToken } from '@/lib/internal-token';
import { BOTS, botOf, looksLikeBot } from '@/lib/traffic/bots';
import { crawlOf } from '@/lib/traffic/crawl';
import { MACHINE_FILES, pagePath, parseCrawl, parseLanding } from '@/lib/traffic/landing';
import { ANSWER_ENGINE_BOTS } from '@/modules/core/seo/robots';
import { channelOf, channels, foldHost, sourceOf } from '@/modules/traffic/channels';
import {
  count,
  FLUSH_AT,
  FLUSH_MS,
  flush,
  KEY_CEILING,
  pending,
  resetCounter,
  startFlusher,
  type TrafficRow,
} from '@/modules/traffic/counter';
import { sinceDay, summarise } from '@/modules/traffic/summary';

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

/** A request as the proxy sees it, from GPTBot unless told otherwise. */
const req = (path: string, init: RequestInit & { ua?: string } = {}) =>
  new Request(`https://b7r.sa${path}`, {
    ...init,
    headers: {
      'user-agent': init.ua ?? 'Mozilla/5.0 (compatible; GPTBot/1.2)',
      ...init.headers,
    },
  });

/** A Payload whose drizzle handle records the SQL it is asked to run, or fails. */
function fakePayload(fail = false) {
  const executed: string[] = [];
  const payload = {
    db: {
      drizzle: {
        execute: async (query: { queryChunks?: unknown[] }) => {
          if (fail) throw new Error('database down');
          executed.push(JSON.stringify(query.queryChunks ?? query));
        },
      },
    },
  } as unknown as Payload;
  return { payload, executed };
}

describe('traffic: where a visitor came from (ADR-048)', () => {
  it('folds a referrer to its host: subdomains, app links and tracking hosts', () => {
    expect(foldHost('https://www.google.com/search?q=b7r')).toBe('google.com');
    expect(foldHost('https://m.facebook.com/')).toBe('facebook.com');
    expect(foldHost('https://l.instagram.com/?u=x')).toBe('instagram.com');
    expect(foldHost('https://lm.facebook.com/l.php')).toBe('facebook.com');
    expect(foldHost('https://t.co/abc')).toBe('x.com');
    expect(foldHost('https://out.reddit.com/t3')).toBe('reddit.com');
    expect(foldHost('android-app://com.google.android.googlequicksearchbox/')).toBe('google.com');
    expect(foldHost('android-app://com.example.app')).toBe('com.example.app');
    expect(foldHost('https://chatgpt.com/')).toBe('chatgpt.com');
    expect(foldHost('')).toBeNull();
    expect(foldHost('not a url')).toBeNull();
    expect(foldHost('ftp://files.example.com/')).toBeNull();
    expect(foldHost('https://user:pw@evil.example.com/')).toBeNull();
    expect(foldHost('https://localhost/')).toBeNull();
    expect(foldHost(`https://${'a'.repeat(120)}.com/`)).toBeNull();
  });

  it('stores one source: a known host, else a known UTM token folded, else the host, else the token, else direct', () => {
    expect(sourceOf({ referrer: 'https://chatgpt.com/c/1', utmSource: '' })).toBe('chatgpt.com');
    expect(sourceOf({ referrer: '', utmSource: 'chatgpt.com' })).toBe('chatgpt.com');
    expect(sourceOf({ referrer: '', utmSource: 'perplexity' })).toBe('perplexity.ai');
    expect(sourceOf({ referrer: '', utmSource: 'Copilot' })).toBe('copilot.microsoft.com');
    // A known host beats a token; a known token beats an unknown host; an unknown token never
    // overrides a known host and, alone, is stored as it is.
    expect(sourceOf({ referrer: 'https://www.google.com/', utmSource: 'chatgpt.com' })).toBe(
      'google.com',
    );
    expect(sourceOf({ referrer: 'https://news.example.com/a', utmSource: 'perplexity' })).toBe(
      'perplexity.ai',
    );
    expect(sourceOf({ referrer: 'https://www.google.com/', utmSource: 'newsletter' })).toBe(
      'google.com',
    );
    expect(sourceOf({ referrer: 'https://news.example.com/a', utmSource: '' })).toBe(
      'news.example.com',
    );
    expect(sourceOf({ referrer: '', utmSource: 'newsletter' })).toBe('newsletter');
    expect(sourceOf({ referrer: '', utmSource: '' })).toBe('direct');
    // The site's own host is an internal move the client missed: nothing to count.
    expect(sourceOf({ referrer: 'https://www.b7r.sa/products', utmSource: '' })).toBeNull();
    expect(sourceOf({ referrer: 'http://b7r.sa/', utmSource: 'x' })).toBeNull();
    expect(
      sourceOf({ referrer: 'https://localhost:3004/', utmSource: '', siteHost: 'localhost:3004' }),
    ).toBe('direct');
    expect(
      sourceOf({
        referrer: 'https://review.example.com/x',
        utmSource: '',
        siteHost: 'review.example.com',
      }),
    ).toBeNull();
  });

  it('derives the channel and its group from a source at read', () => {
    const cases: Array<[string, string, string]> = [
      ['chatgpt.com', 'chatgpt', 'ai'],
      ['chat.openai.com', 'chatgpt', 'ai'],
      ['gemini.google.com', 'gemini', 'ai'],
      ['claude.ai', 'claude', 'ai'],
      ['perplexity.ai', 'perplexity', 'ai'],
      ['copilot.microsoft.com', 'copilot', 'ai'],
      ['grok.com', 'grok', 'ai'],
      ['chat.deepseek.com', 'deepseek', 'ai'],
      ['you.com', 'ai-other', 'ai'],
      ['google.com', 'google', 'search'],
      ['google.com.sa', 'google', 'search'],
      ['google.co.uk', 'google', 'search'],
      ['bing.com', 'bing', 'search'],
      ['duckduckgo.com', 'search-other', 'search'],
      ['instagram.com', 'instagram', 'social'],
      ['tiktok.com', 'tiktok', 'social'],
      ['x.com', 'x', 'social'],
      ['twitter.com', 'x', 'social'],
      ['snapchat.com', 'snapchat', 'social'],
      ['facebook.com', 'facebook', 'social'],
      ['linkedin.com', 'linkedin', 'social'],
      ['youtu.be', 'youtube', 'social'],
      ['whatsapp.com', 'whatsapp', 'social'],
      ['t.me', 'telegram', 'social'],
      ['pinterest.com', 'pinterest', 'social'],
      ['reddit.com', 'reddit', 'social'],
      ['threads.net', 'threads', 'social'],
      ['vk.com', 'social-other', 'social'],
      ['news.example.com', 'referral', 'referral'],
      ['newsletter', 'referral', 'referral'],
      ['direct', 'direct', 'direct'],
    ];
    for (const [source, key, group] of cases) {
      const channel = channelOf(source);
      expect(`${channel.key}/${channel.group}`, source).toBe(`${key}/${group}`);
    }
    // Every channel has a label and a key of its own.
    const keys = channels().map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(channels().every((c) => c.label.length > 0)).toBe(true);
  });
});

describe('traffic: the crawlers (ADR-048)', () => {
  it('knows each bot by its token, longest first, and a browser by none', () => {
    expect(botOf('Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)')?.key).toBe(
      'gptbot',
    );
    expect(botOf('Mozilla/5.0 (compatible; Claude-SearchBot/1.0)')?.key).toBe('claude-searchbot');
    expect(botOf('Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)')?.key).toBe(
      'claudebot',
    );
    expect(
      botOf('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')?.family,
    ).toBe('google');
    expect(
      botOf('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0)')?.key,
    ).toBe('bingbot');
    expect(botOf(CHROME)).toBeNull();
    expect(botOf(null)).toBeNull();
    for (const bot of BOTS)
      expect(botOf(`Mozilla/5.0 (compatible; ${bot.token}/1.0)`)?.key).toBe(bot.key);
  });

  it('covers every answer-engine bot robots.txt names (C-08), so the two lists cannot drift', () => {
    for (const token of ANSWER_ENGINE_BOTS) {
      expect(botOf(`Mozilla/5.0 (compatible; ${token}/1.0)`)?.token, token).toBe(token);
    }
  });

  it('drops a landing from anything that calls itself a bot, and from no user agent', () => {
    expect(looksLikeBot(CHROME)).toBe(false);
    expect(looksLikeBot('Mozilla/5.0 (compatible; GPTBot/1.2)')).toBe(true);
    expect(looksLikeBot('SomeCrawler/3.0')).toBe(true);
    expect(looksLikeBot('python-requests/2.31')).toBe(true);
    expect(looksLikeBot('curl/8.4.0')).toBe(true);
    expect(looksLikeBot(null)).toBe(true);
    expect(looksLikeBot('')).toBe(true);
  });

  it('counts only a document GET of a page or a machine file by a known bot', () => {
    expect(crawlOf(req('/products/hoodie'))).toEqual({ bot: 'gptbot', path: '/products/hoodie' });
    expect(crawlOf(req('/'))).toEqual({ bot: 'gptbot', path: '/' });
    expect(crawlOf(req('/en/llms.txt'))).toEqual({ bot: 'gptbot', path: '/en/llms.txt' });
    expect(crawlOf(req('/blog/post/'))).toEqual({ bot: 'gptbot', path: '/blog/post' });
    expect(crawlOf(req('/products', { ua: CHROME }))).toBeNull();
    expect(crawlOf(req('/products', { method: 'HEAD' }))).toBeNull();
    expect(crawlOf(req('/products', { headers: { rsc: '1' } }))).toBeNull();
    expect(crawlOf(req('/products', { headers: { 'next-router-prefetch': '1' } }))).toBeNull();
    expect(crawlOf(req('/products?_rsc=abc'))).toBeNull();
    expect(crawlOf(req('/favicon.ico'))).toBeNull();
    expect(crawlOf(req('/media/x.jpg'))).toBeNull();
    expect(crawlOf(req('/a/b/c/d/e'))).toBeNull();
  });
});

describe('traffic: what the endpoints accept (ADR-048)', () => {
  it('accepts a page path of zero to four plain segments, the home page included', () => {
    expect(pagePath('/')).toBe('/');
    expect(pagePath('/en')).toBe('/en');
    expect(pagePath('/en/')).toBe('/en');
    expect(pagePath('/products/hoodie')).toBe('/products/hoodie');
    expect(pagePath('/en/blog/category/design')).toBe('/en/blog/category/design');
    expect(pagePath('/a/b/c/d/e')).toBeNull();
    expect(pagePath('/products?x=1')).toBeNull();
    expect(pagePath('/products#top')).toBeNull();
    expect(pagePath('/llms.txt')).toBeNull();
    expect(pagePath('/ملابس')).toBeNull();
    expect(pagePath('products')).toBeNull();
    expect(pagePath(`/${'a'.repeat(200)}`)).toBeNull();
    expect(pagePath(42)).toBeNull();
  });

  it('parses a landing and refuses the rest', () => {
    expect(parseLanding({ path: '/', referrer: 'https://chatgpt.com/', utmSource: '' })).toEqual({
      path: '/',
      referrer: 'https://chatgpt.com/',
      utmSource: '',
    });
    expect(parseLanding({ path: '/products' })).toEqual({
      path: '/products',
      referrer: '',
      utmSource: '',
    });
    expect(parseLanding({ path: '/products', referrer: 'x'.repeat(2001) })).toBeNull();
    expect(parseLanding({ path: '/products', utmSource: 'a b' })).toBeNull();
    expect(parseLanding({ path: '/products', utmSource: 'a'.repeat(101) })).toBeNull();
    expect(parseLanding({ path: '/products', referrer: 7 })).toBeNull();
    expect(parseLanding({ path: 'https://evil.example.com/' })).toBeNull();
    expect(parseLanding(null)).toBeNull();
    expect(parseLanding('/')).toBeNull();
  });

  it('parses a crawl: a bot the table knows, a page or a machine file', () => {
    expect(parseCrawl({ bot: 'gptbot', path: '/llms.txt' })).toEqual({
      bot: 'gptbot',
      path: '/llms.txt',
    });
    expect(parseCrawl({ bot: 'gptbot', path: '/en/products/' })).toEqual({
      bot: 'gptbot',
      path: '/en/products',
    });
    expect(parseCrawl({ bot: 'GPTBot', path: '/' })).toBeNull();
    expect(parseCrawl({ bot: 'unknownbot', path: '/' })).toBeNull();
    expect(parseCrawl({ bot: 'gptbot', path: '/sw.js' })).toBeNull();
    for (const file of MACHINE_FILES)
      expect(parseCrawl({ bot: 'ccbot', path: file })?.path).toBe(file);
  });

  it('derives the internal token from the secret and compares it in constant time', async () => {
    const a = await internalToken('traffic-crawl', 'secret-one');
    const b = await internalToken('traffic-crawl', 'secret-one');
    const c = await internalToken('traffic-crawl', 'secret-two');
    const d = await internalToken('other', 'secret-one');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toBe(d);
    expect(sameToken(a, b)).toBe(true);
    expect(sameToken(a, c)).toBe(false);
    expect(sameToken(a, a.slice(1))).toBe(false);
    await expect(internalToken('x', '')).rejects.toThrow(/PAYLOAD_SECRET/);
  });
});

describe('traffic: the batcher (ADR-048)', () => {
  afterEach(() => {
    resetCounter();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('merges hits by day, kind, source and page, the day stamped in Riyadh when counted', () => {
    const late = new Date('2026-09-15T22:30:00Z'); // 01:30 on the 16th in Riyadh
    count({ kind: 'landing', source: 'chatgpt.com', path: '/' }, late);
    count({ kind: 'landing', source: 'chatgpt.com', path: '/' }, late);
    count({ kind: 'crawl', source: 'gptbot', path: '/llms.txt' }, late);
    count({ kind: 'landing', source: 'chatgpt.com', path: '/' }, new Date('2026-09-15T12:00:00Z'));
    expect(pending()).toEqual([
      { date: '2026-09-16', kind: 'landing', source: 'chatgpt.com', path: '/', hits: 2 },
      { date: '2026-09-16', kind: 'crawl', source: 'gptbot', path: '/llms.txt', hits: 1 },
      { date: '2026-09-15', kind: 'landing', source: 'chatgpt.com', path: '/', hits: 1 },
    ]);
  });

  it('flushes once per key in one statement and empties the map; a failure keeps the rows', async () => {
    const good = fakePayload();
    count({ kind: 'landing', source: 'google.com', path: '/products' });
    count({ kind: 'landing', source: 'google.com', path: '/products' });
    count({ kind: 'crawl', source: 'claudebot', path: '/' });
    await flush(async () => good.payload);
    expect(good.executed).toHaveLength(1);
    expect(good.executed[0]).toContain('ON CONFLICT');
    expect(pending()).toEqual([]);
    const bad = fakePayload(true);
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    count({ kind: 'landing', source: 'direct', path: '/' });
    await flush(async () => bad.payload);
    expect(quiet).toHaveBeenCalledTimes(1);
    expect(pending()).toEqual([expect.objectContaining({ source: 'direct', path: '/', hits: 1 })]);
    // A count that lands while the failed write is in flight is kept too, by addition.
    count({ kind: 'landing', source: 'direct', path: '/' });
    expect(pending()[0]?.hits).toBe(2);
  });

  it('holds the size-triggered flush after a failure until the next tick, and logs once a minute', async () => {
    vi.useFakeTimers();
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let attempts = 0;
    startFlusher(async () => {
      attempts += 1;
      return fakePayload(true).payload;
    });
    // The 500th count asks for a flush; it fails and the rows stay.
    for (let i = 0; i < FLUSH_AT; i++) {
      count({ kind: 'landing', source: `h${i}.example.com`, path: '/' });
    }
    await vi.advanceTimersByTimeAsync(0);
    expect(attempts).toBe(1);
    expect(pending()).toHaveLength(FLUSH_AT);
    // Over the size threshold and failed a moment ago: no new attempt, no new log line.
    for (let i = 0; i < 50; i++) {
      count({ kind: 'landing', source: `late${i}.example.com`, path: '/' });
    }
    await vi.advanceTimersByTimeAsync(0);
    expect(attempts).toBe(1);
    expect(quiet).toHaveBeenCalledTimes(1);
    // The next tick tries again and, still failing within the minute, logs nothing new.
    await vi.advanceTimersByTimeAsync(FLUSH_MS);
    expect(attempts).toBe(2);
    expect(quiet).toHaveBeenCalledTimes(1);
    expect(pending().length).toBe(FLUSH_AT + 50);
  });

  it('drops new keys past the ceiling with one warning; a flush at 500 keys is asked for', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    for (let i = 0; i < KEY_CEILING + 5; i++) {
      count({ kind: 'landing', source: `host-${i}.example.com`, path: '/' });
    }
    expect(pending()).toHaveLength(KEY_CEILING);
    expect(warn).toHaveBeenCalledTimes(1);
    count({ kind: 'landing', source: 'host-0.example.com', path: '/' });
    expect(pending()[0]?.hits).toBe(2);
    expect(FLUSH_AT).toBeLessThan(KEY_CEILING);
  });
});

describe('traffic: the summary (ADR-048)', () => {
  const rows: TrafficRow[] = [
    { date: '2026-09-10', kind: 'landing', source: 'chatgpt.com', path: '/', hits: 4 },
    {
      date: '2026-09-12',
      kind: 'landing',
      source: 'chatgpt.com',
      path: '/products/hoodie',
      hits: 2,
    },
    {
      date: '2026-09-12',
      kind: 'landing',
      source: 'google.com',
      path: '/products/hoodie',
      hits: 3,
    },
    { date: '2026-09-13', kind: 'landing', source: 'instagram.com', path: '/', hits: 1 },
    { date: '2026-09-13', kind: 'landing', source: 'news.example.com', path: '/blog/a', hits: 1 },
    { date: '2026-09-14', kind: 'landing', source: 'direct', path: '/', hits: 5 },
    { date: '2026-09-14', kind: 'crawl', source: 'gptbot', path: '/llms.txt', hits: 7 },
    { date: '2026-09-14', kind: 'crawl', source: 'gptbot', path: '/', hits: 2 },
    { date: '2026-09-14', kind: 'crawl', source: 'googlebot', path: '/products', hits: 9 },
  ];

  it('counts the range back from today in Riyadh', () => {
    expect(sinceDay(7, new Date('2026-09-16T10:00:00Z'))).toBe('2026-09-10');
    expect(sinceDay(1, new Date('2026-09-15T22:30:00Z'))).toBe('2026-09-16');
  });

  it('groups landings by channel, group, source and page, and crawls by bot', () => {
    const s = summarise(rows, 7, '2026-09-10');
    expect(s.landings).toBe(16);
    expect(s.byGroup).toEqual({ ai: 6, search: 3, social: 1, referral: 1, direct: 5 });
    expect(s.byChannel.map((c) => [c.channel.key, c.hits, c.firstDay, c.lastDay])).toEqual([
      ['chatgpt', 6, '2026-09-10', '2026-09-12'],
      ['direct', 5, '2026-09-14', '2026-09-14'],
      ['google', 3, '2026-09-12', '2026-09-12'],
      ['instagram', 1, '2026-09-13', '2026-09-13'],
      ['referral', 1, '2026-09-13', '2026-09-13'],
    ]);
    expect(s.bySource[0]).toMatchObject({ source: 'chatgpt.com', hits: 6 });
    expect(s.byPath.map((p) => [p.path, p.hits, p.top.key])).toEqual([
      ['/', 10, 'direct'],
      ['/products/hoodie', 5, 'google'],
      ['/blog/a', 1, 'referral'],
    ]);
    expect(s.crawls).toBe(18);
    expect(s.byBot.map((b) => [b.bot, b.family, b.hits, b.paths[0]?.path])).toEqual([
      ['googlebot', 'google', 9, '/products'],
      ['gptbot', 'openai', 9, '/llms.txt'],
    ]);
  });

  it('is empty on no rows', () => {
    const s = summarise([], 30, '2026-08-18');
    expect(s.landings).toBe(0);
    expect(s.crawls).toBe(0);
    expect(s.byChannel).toEqual([]);
    expect(s.byGroup.direct).toBe(0);
  });
});
