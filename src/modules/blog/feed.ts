import { absoluteUrl } from '@/lib/absolute-url';

/**
 * RSS 2.0 for `/feed.xml` (BRD 10.1): the latest posts with their full HTML in
 * `content:encoded`. Pure: the route reads the CMS, renders each body to HTML and hands the
 * rows here. Every link and image is made absolute so a reader shows them off-site.
 */
export interface FeedChannel {
  title: string;
  description: string;
  base: string;
  language?: string;
}

export interface FeedItem {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  contentUpdatedAt: string | null;
  authorName: string;
  hubName: string;
  html: string;
  cover: string;
}

function escape(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** `href="/x"` and `src="/x"` become absolute; `//` and other schemes are left alone. */
export function absolutizeHtml(base: string, html: string): string {
  return html.replaceAll(/\b(href|src)="(\/(?!\/)[^"]*)"/g, (_, attr: string, path: string) => {
    return `${attr}="${absoluteUrl(base, path)}"`;
  });
}

function rfc822(iso: string): string {
  return new Date(iso).toUTCString();
}

export function buildFeed(channel: FeedChannel, items: FeedItem[]): string {
  const latest = items[0]?.publishedAt ?? new Date().toISOString();
  const entries = items
    .map((item) => {
      const url = `${channel.base}/blog/${item.slug}`;
      const html = absolutizeHtml(channel.base, item.html);
      return `    <item>
      <title>${escape(item.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(item.publishedAt)}</pubDate>
      <dc:creator>${escape(item.authorName)}</dc:creator>
      <category>${escape(item.hubName)}</category>
      <description>${escape(item.excerpt)}</description>
      <enclosure url="${escape(absoluteUrl(channel.base, item.cover))}" type="image/jpeg" length="0" />
      <content:encoded><![CDATA[${html.replaceAll(']]>', ']]]]><![CDATA[>')}]]></content:encoded>
    </item>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(channel.title)}</title>
    <link>${channel.base}/blog</link>
    <atom:link href="${channel.base}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escape(channel.description)}</description>
    <language>${channel.language ?? 'ar'}</language>
    <lastBuildDate>${rfc822(latest)}</lastBuildDate>
${entries}
  </channel>
</rss>
`;
}
