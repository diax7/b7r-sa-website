import {
  convertLexicalToHTML,
  defaultHTMLConverters,
  LinkHTMLConverter,
} from '@payloadcms/richtext-lexical/html';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { getSeo } from '@/lib/cms';
import { getFeedPosts } from '@/lib/cms/blog';
import { siteBase } from '@/lib/env';
import { type Locale, languageTag } from '@/lib/i18n';
import { docHref } from '@/lib/lexical';
import { buildFeed } from '@/modules/blog/feed';

/**
 * The RSS 2.0 feed of one language (BRD 10.1, ADR-043): the latest 20 posts that exist in
 * that language, with their full text and internal links under the language's prefix. The
 * two route files (`/feed.xml`, `/en/feed.xml`) are thin wrappers over this.
 */
export async function feedResponse(locale: Locale): Promise<Response> {
  const base = siteBase();
  const converters = {
    ...defaultHTMLConverters,
    ...LinkHTMLConverter({
      internalDocToHref: ({ linkNode }) => docHref(linkNode.fields.doc, locale) ?? '/',
    }),
  };
  const [seo, posts] = await Promise.all([getSeo(locale, '/blog'), getFeedPosts(locale)]);
  const xml = buildFeed(
    { title: seo.title, description: seo.description, base, locale, language: languageTag(locale) },
    posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
      contentUpdatedAt: post.contentUpdatedAt,
      authorName: post.author.name,
      hubName: post.hub.name,
      cover:
        post.cover.bytes && post.cover.mime
          ? { src: post.cover.src, bytes: post.cover.bytes, mime: post.cover.mime }
          : undefined,
      html: convertLexicalToHTML({
        data: post.body as unknown as SerializedEditorState,
        converters,
        disableContainer: true,
      }),
    })),
  );
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
