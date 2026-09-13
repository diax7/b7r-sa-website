import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { Button } from '@/components/shared/button';
import { Container } from '@/components/shared/container';
import { Prose } from '@/components/shared/prose';
import { Section } from '@/components/shared/section';
import { blogCopy, blogPosts, hubName } from '@/content/blog';
import { loadBlogPost } from '@/content/blog/load';
import { legalCopy, productsPage } from '@/content/pages';
import type { BlogPost as BlogPostData } from '@/content/schema';
import { formatArabicDate } from '@/lib/dates';
import { env, siteBase } from '@/lib/env';
import { renderMarkdown } from '@/lib/markdown';
import { registerUrl } from '@/lib/utm';
import messages from '@/messages/ar.json';
import { CtaRibbon, JsonLd, jsonLd } from '@/modules/core';
import { PostCard, postMeta } from '@/modules/blog/post-card';
import { ShareButtons } from '@/modules/blog/share-buttons';

/** Two related posts: same hub first, then the newest others (BRD 6.11). */
export function relatedPosts(current: BlogPostData): BlogPostData[] {
  const others = blogPosts.filter((p) => p.slug !== current.slug);
  const sameHub = others.filter((p) => p.hub === current.hub);
  const rest = others.filter((p) => p.hub !== current.hub);
  return [...sameHub, ...rest].slice(0, 2);
}

/** Splits rendered HTML before the third H2, i.e. after the second section (BRD 6.11). */
export function splitAfterSecondSection(html: string): [string, string] {
  const matches = [...html.matchAll(/<h2[\s>]/g)];
  const third = matches[2]?.index;
  return third === undefined ? [html, ''] : [html.slice(0, third), html.slice(third)];
}

/** Post template (BRD 6.11). */
export function BlogPostPage({ post }: { post: BlogPostData }) {
  const loaded = loadBlogPost(post);
  const base = siteBase();
  const route = `/blog/${post.slug}`;
  const url = `${base}${route}`;
  const { html } = renderMarkdown(loaded.body);
  const [before, after] = splitAfterSecondSection(html);
  const crumbs = [
    { name: productsPage.breadcrumbHome, href: '/' },
    { name: blogCopy.title, href: '/blog' },
    { name: post.title, href: route },
  ];
  const cta = (
    <aside
      className="my-8 flex flex-col items-start gap-3 rounded-lg bg-accent-tint px-6 py-6 md:flex-row md:items-center md:justify-between"
      data-post-cta=""
    >
      <div className="flex flex-col gap-1">
        <p className="text-h4 text-text">{blogCopy.inPostCta.title}</p>
        <p className="text-body text-text-muted">{blogCopy.inPostCta.text}</p>
      </div>
      <Button asChild trailingArrow={false}>
        <a
          href={registerUrl(env.appUrl, { campaign: 'ribbon', content: `post-${post.slug}` })}
          data-track="cta_click"
          data-location="ribbon"
        >
          {blogCopy.inPostCta.button}
        </a>
      </Button>
    </aside>
  );

  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.blogPosting(base, post, blogCopy.author.name),
          jsonLd.breadcrumbs(
            base,
            crumbs.map((c) => ({ name: c.name, path: c.href })),
          ),
        ]}
      />

      <Section tone="surface" className="pt-6 md:pt-10" aria-labelledby="post-title">
        <Container prose className="flex flex-col gap-8">
          <Breadcrumbs items={crumbs} />
          <article className="flex flex-col gap-8">
            <header className="flex flex-col gap-4">
              <p className="eyebrow">{hubName(post.hub)}</p>
              <h1 id="post-title" className="text-h1 text-text">
                {post.title}
              </h1>
              <p className="text-small text-text-muted">
                {postMeta(post, loaded.readingMinutes)}
                {post.updatedAt !== post.publishedAt && (
                  <>
                    {' · '}
                    {legalCopy.updatedPrefix}{' '}
                    <time dateTime={post.updatedAt}>{formatArabicDate(post.updatedAt)}</time>
                  </>
                )}
              </p>
            </header>
            <div className="relative aspect-video overflow-hidden rounded-lg bg-ground">
              <Image
                src={post.cover}
                alt=""
                fill
                priority
                sizes="(min-width: 800px) 760px, 100vw"
                className="object-cover"
              />
            </div>
            <aside
              className="rounded-base border border-border bg-ground p-6"
              aria-labelledby="post-takeaways-title"
            >
              <h2 id="post-takeaways-title" className="text-h4 mb-3 text-text">
                {blogCopy.takeawaysTitle}
              </h2>
              <ul className="flex list-disc flex-col gap-2 ps-5 text-body text-text">
                {post.takeaways.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </aside>
            <Prose html={before} />
            {cta}
            {after && <Prose html={after} />}
            <footer className="flex flex-col gap-6 border-t border-border pt-6">
              <ShareButtons
                url={url}
                title={post.title}
                label={blogCopy.share}
                copyLabel={messages.share.copy}
                copiedLabel={blogCopy.copied}
                whatsappAria={messages.share.whatsapp}
                xAria={messages.share.x}
              />
              <div className="flex items-center gap-4" data-author="">
                <span className="grid size-12 place-items-center rounded-pill bg-primary text-h4 text-white">
                  {blogCopy.author.name.slice(0, 1)}
                </span>
                <div className="flex flex-col">
                  <Link href="/about" className="font-medium text-text hover:text-primary">
                    {blogCopy.author.name}
                  </Link>
                  <span className="text-small text-text-muted">{blogCopy.author.role}</span>
                </div>
              </div>
            </footer>
          </article>
        </Container>
      </Section>

      <Section tone="ground" aria-labelledby="related-title">
        <Container className="flex flex-col gap-8">
          <h2 id="related-title" className="text-h2 text-text">
            {blogCopy.relatedTitle}
          </h2>
          <ul className="grid gap-6 md:grid-cols-2">
            {relatedPosts(post).map((related) => (
              <li key={related.slug}>
                <PostCard
                  post={related}
                  readingMinutes={loadBlogPost(related).readingMinutes}
                  headingLevel="h3"
                />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaRibbon topTone="ground" page={`post-${post.slug}`} />
    </>
  );
}
