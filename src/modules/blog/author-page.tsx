import Image from 'next/image';
import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { copyFor } from '@/content/copy';
import { type Author, getPostPage } from '@/lib/cms/blog';
import { type Locale, localePath } from '@/lib/i18n';
import { siteBase } from '@/lib/env';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
import { Pagination } from '@/modules/blog/pagination';
import { PostCard } from '@/modules/blog/post-card';

/** The author page (BRD 10.1): who they are, their links, their posts; `ProfilePage` schema. */
export async function AuthorPage({
  author,
  locale,
  page,
}: {
  author: Author;
  locale: Locale;
  page: number;
}) {
  const { blog: blogCopy, productsPage } = copyFor(locale);
  const base = siteBase();
  const route = `/author/${author.slug}`;
  const listing = await getPostPage(locale, page, { author: author.slug });
  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.profilePage(base, locale, author),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: localePath(locale, '/') },
            { name: blogCopy.title, path: localePath(locale, '/blog') },
            { name: author.name, path: route },
          ]),
        ]}
      />
      <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="author-title">
        <Container className="flex flex-col gap-10">
          <header className="flex flex-col items-start gap-5 md:flex-row md:items-center md:gap-8">
            {author.photo ? (
              <Image
                src={author.photo}
                alt=""
                width={112}
                height={112}
                priority
                className="size-28 rounded-pill object-cover"
              />
            ) : (
              <span className="grid size-28 shrink-0 place-items-center rounded-pill bg-primary text-h1 text-white">
                {author.name.slice(0, 1)}
              </span>
            )}
            <div className="flex flex-col gap-2">
              <p className="eyebrow">{author.role}</p>
              <h1 id="author-title" className="text-h1 text-text">
                {author.name}
              </h1>
              {author.bio && <p className="max-w-prose text-body text-text-muted">{author.bio}</p>}
              {author.sameAs.length > 0 && (
                <ul className="flex flex-wrap gap-3 text-small">
                  {author.sameAs.map((href) => (
                    <li key={href}>
                      <a
                        href={href}
                        target="_blank"
                        rel="me noopener"
                        className="text-primary hover:underline"
                        dir="ltr"
                      >
                        {new URL(href).hostname.replace(/^www\./, '')}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </header>
          <h2 className="text-h3 text-text">
            {blogCopy.authorIntro.replace('{name}', author.name)}
          </h2>
          {listing.posts.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-post-grid="">
              {listing.posts.map((post, i) => (
                <li key={post.slug}>
                  <PostCard post={post} locale={locale} headingLevel="h3" priority={i === 0} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body text-text-muted" data-author-empty="">
              {blogCopy.emptyAuthor}
            </p>
          )}
          <Pagination
            base={localePath(locale, route)}
            page={page}
            totalPages={listing.totalPages}
            copy={blogCopy.pagination}
          />
        </Container>
      </Section>
      <CtaRibbon locale={locale} topTone="surface" page={`author-${author.slug}`} />
    </>
  );
}
