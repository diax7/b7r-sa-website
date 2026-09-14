import { describe, expect, it } from 'vitest';
import { absolutizeHtml, buildFeed } from '@/modules/blog/feed';

const BASE = 'https://b7r.sa';
const channel = { title: 'مدونة بحر', description: 'أدلة عملية.', base: BASE };
const item = {
  slug: 'first',
  title: 'عنوان <أول>',
  excerpt: 'مقتطف & شيء',
  publishedAt: '2026-09-13T09:00:00.000Z',
  contentUpdatedAt: null,
  authorName: 'ضياء',
  hubName: 'البداية',
  html: '<p>اقرأ <a href="/how-it-works">كيف تعمل</a> <img src="/media/x.jpg" alt=""> ]]> نهاية</p>',
  cover: { src: '/media/cover.jpg', bytes: 104_000, mime: 'image/jpeg' },
};

describe('RSS feed (BRD 10.1, ADR-041)', () => {
  it('escapes text, makes links absolute, keeps the HTML inside CDATA', () => {
    const xml = buildFeed(channel, [item]);
    expect(xml).toContain('<title>عنوان &lt;أول&gt;</title>');
    expect(xml).toContain('<description>مقتطف &amp; شيء</description>');
    expect(xml).toContain(`<link>${BASE}/blog/first</link>`);
    expect(xml).toContain(`href="${BASE}/how-it-works"`);
    expect(xml).toContain(`src="${BASE}/media/x.jpg"`);
    expect(xml).toContain(']]]]><![CDATA[>');
    expect(xml).toContain('<pubDate>Sun, 13 Sep 2026 09:00:00 GMT</pubDate>');
    expect(xml).toContain(`<atom:link href="${BASE}/feed.xml" rel="self"`);
  });

  it('carries the cover as an enclosure with its real size, or no enclosure at all', () => {
    const withCover = buildFeed(channel, [item]);
    expect(withCover).toContain(
      `<enclosure url="${BASE}/media/cover.jpg" type="image/jpeg" length="104000" />`,
    );
    const without = buildFeed(channel, [{ ...item, cover: undefined }]);
    expect(without).not.toContain('<enclosure');
  });

  it('absolutizes only root-relative hrefs and srcs', () => {
    expect(
      absolutizeHtml(BASE, '<a href="/x">a</a> <a href="//cdn/x">b</a> <a href="https://z">c</a>'),
    ).toBe(`<a href="${BASE}/x">a</a> <a href="//cdn/x">b</a> <a href="https://z">c</a>`);
  });
});
