import {
  convertLexicalToHTML,
  defaultHTMLConverters,
  LinkHTMLConverter,
} from '@payloadcms/richtext-lexical/html';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { getSeo } from '@/lib/cms';
import { getFeedPosts } from '@/lib/cms/blog';
import { siteBase } from '@/lib/env';
import { docHref } from '@/lib/lexical';
import { buildFeed } from '@/modules/blog';

/** Regenerated on publish (`revalidatePath('/feed.xml')`) and at most once a minute. */
export const revalidate = 60;

const converters = {
  ...defaultHTMLConverters,
  ...LinkHTMLConverter({
    internalDocToHref: ({ linkNode }) => docHref(linkNode.fields.doc) ?? '/',
  }),
};

/** RSS 2.0, the latest 20 posts with their full text (BRD 10.1). */
export async function GET(): Promise<Response> {
  const base = siteBase();
  const [seo, posts] = await Promise.all([getSeo('/blog'), getFeedPosts()]);
  const xml = buildFeed(
    { title: seo.title, description: seo.description, base },
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
