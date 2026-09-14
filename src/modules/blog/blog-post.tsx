import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { Button } from '@/components/shared/button';
import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { copyFor } from '@/content/copy';
import { getSiteSettings } from '@/lib/cms';
import {
  adjacentPosts,
  getAllPosts,
  type Post,
  type PostCard as PostCardData,
  relatedPosts,
} from '@/lib/cms/blog';
import { cn } from '@/lib/cn';
import { formatDate, isoDay } from '@/lib/dates';
import { env, siteBase } from '@/lib/env';
import { type Locale, localePath } from '@/lib/i18n';
import { headingIds, headings, splitAfterSecondHeading } from '@/lib/lexical';
import { registerUrl } from '@/lib/utm';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
import { LexicalProse } from '@/modules/core/rich-text/lexical-prose';
import { PostCard, postMeta } from '@/modules/blog/post-card';
import { ShareButtons } from '@/modules/blog/share-buttons';
import { TableOfContents } from '@/modules/blog/toc';

/** Whether the "updated" line shows: a content update later than the publish day. */
export function showsUpdated(post: Pick<Post, 'publishedAt' | 'contentUpdatedAt'>): boolean {
  return Boolean(post.contentUpdatedAt && isoDay(post.contentUpdatedAt) > isoDay(post.publishedAt));
}

/**
 * Post template (BRD 6.11, 10.1): breadcrumbs, H1, meta with reading time and the updated
 * date, cover, the takeaways box, the table of contents, the body split after the second H2
 * with the CTA between, share, the author card, related posts, previous/next in the hub.
 */
export async function BlogPostPage({ post, locale }: { post: Post; locale: Locale }) {
  const [site, all] = await Promise.all([getSiteSettings(locale), getAllPosts(locale)]);
  const messages = copyFor(locale);
  const { blog: blogCopy, productsPage } = messages;
  const base = siteBase();
  const route = localePath(locale, `/blog/${post.slug}`);
  const url = `${base}${route}`;
  const ids = headingIds(post.body);
  const toc = headings(post.body);
  const [before, after] = splitAfterSecondHeading(post.body);
  const related = relatedPosts(post, all);
  const { previous, next } = adjacentPosts(post, all);
  const crumbs = [
    { name: productsPage.breadcrumbHome, href: localePath(locale, '/') },
    { name: blogCopy.title, href: localePath(locale, '/blog') },
    { name: post.hub.name, href: localePath(locale, `/blog/category/${post.hub.slug}`) },
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
          jsonLd.blogPosting(base, locale, post, site),
          jsonLd.breadcrumbs(
            base,
            crumbs.map((c) => ({ name: c.name, path: c.href })),
          ),
        ]}
      />

      <Section tone="surface" className="pt-6 md:pt-10" aria-labelledby="post-title">
        <Container className="flex flex-col gap-8 lg:flex-row lg:justify-center lg:gap-12">
          <TableOfContents headings={toc} title={blogCopy.toc} variant="rail" />
          <div className="flex w-full max-w-(--container-prose) flex-col gap-8">
            <Breadcrumbs items={crumbs} label={messages.breadcrumbs.label} />
            <article className="flex flex-col gap-8">
              <header className="flex flex-col gap-4">
                <Link
                  href={localePath(locale, `/blog/category/${post.hub.slug}`)}
                  className="eyebrow hover:text-primary"
                >
                  {post.hub.name}
                </Link>
                <h1 id="post-title" className="text-h1 text-text">
                  {post.title}
                </h1>
                <p className="text-small text-text-muted" data-post-meta="">
                  {postMeta(messages, locale, post)}
                  {showsUpdated(post) && post.contentUpdatedAt && (
                    <>
                      {' · '}
                      {blogCopy.updatedPrefix}{' '}
                      <time dateTime={isoDay(post.contentUpdatedAt)}>
                        {formatDate(locale, post.contentUpdatedAt)}
                      </time>
                    </>
                  )}
                </p>
              </header>
              <div className="relative aspect-video overflow-hidden rounded-lg bg-ground">
                <Image
                  src={post.cover.src}
                  alt={post.cover.alt}
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
              <TableOfContents headings={toc} title={blogCopy.toc} variant="folded" />
              <LexicalProse data={before} locale={locale} ids={ids} />
              {cta}
              {after && <LexicalProse data={after} locale={locale} ids={ids} />}
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
                <AuthorCard author={post.author} locale={locale} />
                <AdjacentLinks previous={previous} next={next} locale={locale} copy={blogCopy} />
              </footer>
            </article>
          </div>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section tone="ground" aria-labelledby="related-title">
          <Container className="flex flex-col gap-8">
            <h2 id="related-title" className="text-h2 text-text">
              {blogCopy.relatedTitle}
            </h2>
            <ul className="grid gap-6 md:grid-cols-2" data-related="">
              {related.map((item) => (
                <li key={item.slug}>
                  <PostCard post={item} locale={locale} headingLevel="h3" />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <CtaRibbon
        locale={locale}
        topTone={related.length > 0 ? 'ground' : 'surface'}
        page={`post-${post.slug}`}
      />
    </>
  );
}

function AuthorCard({ author, locale }: { author: Post['author']; locale: Locale }) {
  return (
    <div className="flex items-center gap-4" data-author="">
      {author.photo ? (
        <Image
          src={author.photo}
          alt=""
          width={48}
          height={48}
          className="size-12 rounded-pill object-cover"
        />
      ) : (
        <span className="grid size-12 place-items-center rounded-pill bg-primary text-h4 text-white">
          {author.name.slice(0, 1)}
        </span>
      )}
      <div className="flex flex-col">
        <Link
          href={localePath(locale, `/author/${author.slug}`)}
          className="font-medium text-text hover:text-primary"
        >
          {author.name}
        </Link>
        <span className="text-small text-text-muted">{author.role}</span>
      </div>
    </div>
  );
}

function AdjacentLink({
  post,
  locale,
  label,
  align,
}: {
  post: PostCardData;
  locale: Locale;
  label: string;
  align: 'start' | 'end';
}) {
  return (
    <Link
      href={localePath(locale, `/blog/${post.slug}`)}
      className={cn(
        'flex flex-col gap-1 rounded-base border border-border bg-surface p-4 hover:border-primary',
        align === 'end' && 'text-end',
      )}
    >
      <span className="text-caption text-text-muted">{label}</span>
      <span className="text-small font-medium text-text">{post.title}</span>
    </Link>
  );
}

function AdjacentLinks({
  previous,
  next,
  locale,
  copy,
}: {
  previous: PostCardData | null;
  next: PostCardData | null;
  locale: Locale;
  copy: { previousPost: string; nextPost: string };
}) {
  if (!previous && !next) return null;
  return (
    <nav aria-label={copy.previousPost} className="grid gap-4 md:grid-cols-2" data-adjacent="">
      <div>
        {previous && (
          <AdjacentLink post={previous} locale={locale} label={copy.previousPost} align="start" />
        )}
      </div>
      <div>
        {next && <AdjacentLink post={next} locale={locale} label={copy.nextPost} align="end" />}
      </div>
    </nav>
  );
}
