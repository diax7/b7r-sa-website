/**
 * Writes the seed's bodies of the three Level 1 posts, in both languages, as DRAFTS of the
 * published posts (ADR-050): the live text stays until an admin reads the draft in the admin
 * and publishes it. The English search title rides along when the seed names one. Run it
 * after a rewrite of `src/content/seed/blog/*.md`; a post the seed does not know is left alone.
 */
import nextEnv from '@next/env';
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';
import { getPayload } from 'payload';

nextEnv.loadEnvConfig(process.cwd());

async function main(): Promise<number> {
  // Imported after the env files are loaded: the config reads DATABASE_URL and the secret at import.
  const { default: config } = await import('../src/payload.config');
  const { blogPostBody, blogPosts } = await import('../src/content/seed/blog');
  const { blogPostBodyEn, blogPostsEn } = await import('../src/content/seed/en/blog');
  const { postBodyField } = await import('../src/lib/cms/post-body');
  const payload = await getPayload({ config });
  const editorConfig = editorConfigFactory.fromField({ field: postBodyField(payload) });
  const context = { disableRevalidate: true };
  let written = 0;
  for (const seed of blogPosts) {
    const found = await payload.find({
      collection: 'posts',
      where: { slug: { equals: seed.slug } },
      limit: 1,
      depth: 0,
      draft: true,
    });
    const post = found.docs[0];
    if (!post) {
      console.warn(`content:drafts: ${seed.slug} is not in the database; seed first.`);
      continue;
    }
    const ar = convertMarkdownToLexical({ editorConfig, markdown: blogPostBody(seed.slug) });
    await payload.update({
      collection: 'posts',
      id: post.id,
      locale: 'ar',
      draft: true,
      data: { body: ar as never },
      context,
    });
    const english = blogPostsEn[seed.slug];
    if (english) {
      const en = convertMarkdownToLexical({ editorConfig, markdown: blogPostBodyEn(seed.slug) });
      const current = await payload.findByID({
        collection: 'posts',
        id: post.id,
        locale: 'en',
        depth: 0,
        draft: true,
      });
      await payload.update({
        collection: 'posts',
        id: post.id,
        locale: 'en',
        draft: true,
        data: {
          body: en as never,
          ...(english.seoTitle ? { seo: { ...current.seo, title: english.seoTitle } } : {}),
        },
        context,
      });
    }
    written += 1;
    console.warn(
      `content:drafts: ${seed.slug}: a draft in both languages, the live text unchanged.`,
    );
  }
  console.warn(`content:drafts: ${written} post(s) drafted; publish them under Blog → Posts.`);
  return 0;
}

try {
  process.exit(await main());
} catch (error) {
  console.error('content:drafts failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
