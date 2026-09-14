import type { ReactNode } from 'react';
import { Card } from '@/components/shared/card';
import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { copyFor } from '@/content/copy';
import { getSeo } from '@/lib/cms';
import { getHubs, getPostIndex, getPostPage } from '@/lib/cms/blog';
import { siteBase } from '@/lib/env';
import { type Locale, localePath } from '@/lib/i18n';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
import { HubChips } from '@/modules/blog/hub-chips';
import { Pagination, pageHref } from '@/modules/blog/pagination';
import { PostCard } from '@/modules/blog/post-card';
import { BlogSearch } from '@/modules/blog/search';

const ROUTE = '/blog';

/**
 * Blog index (BRD 6.11, 10.1): the hub strip, the newest post featured, the latest grid,
 * static pagination, the search island, the newsletter block. Page 1 is `/blog`; the
 * newsletter form comes in as a slot from the route so this module never imports the forms
 * module.
 */
export async function BlogIndex({
  locale,
  page,
  newsletter,
}: {
  locale: Locale;
  page: number;
  newsletter: ReactNode;
}) {
  const base = siteBase();
  const [seo, hubs, listing, index] = await Promise.all([
    getSeo(locale, ROUTE),
    getHubs(locale),
    getPostPage(locale, page),
    getPostIndex(locale),
  ]);
  const { blog: blogCopy, footer: footerCopy, productsPage } = copyFor(locale);
  const featured = page === 1 ? (listing.posts[0] ?? null) : null;
  const rest = page === 1 ? listing.posts.slice(1) : listing.posts;
  const route = pageHref(ROUTE, page);
  const listingPath = localePath(locale, ROUTE);

  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.webPage(base, locale, route, seo.title, seo.description),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: localePath(locale, '/') },
            { name: blogCopy.title, path: listingPath },
          ]),
        ]}
      />

      <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="blog-title">
        <Container className="flex flex-col gap-10">
          <SectionHeader as="h1" id="blog-title" title={blogCopy.title} lead={blogCopy.lead} />
          <HubChips hubs={hubs} locale={locale} allLabel={blogCopy.allHubs} />
          <BlogSearch
            index={index}
            basePath={listingPath}
            copy={blogCopy.search}
            grid="[data-post-listing]"
          />
          <div className="flex flex-col gap-10" data-post-listing="">
            {featured && <PostCard post={featured} locale={locale} featured priority />}
            {rest.length > 0 && (
              <>
                {page === 1 && <h2 className="text-h3 text-text">{blogCopy.latest}</h2>}
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-post-grid="">
                  {rest.map((post) => (
                    <li key={post.slug}>
                      <PostCard
                        post={post}
                        locale={locale}
                        headingLevel={page === 1 ? 'h3' : 'h2'}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
            {listing.posts.length === 0 && (
              <p className="text-body text-text-muted" data-hub-empty="">
                {blogCopy.emptyHub}
              </p>
            )}
            <Pagination
              base={listingPath}
              page={page}
              totalPages={listing.totalPages}
              copy={blogCopy.pagination}
            />
          </div>
        </Container>
      </Section>

      <Section tone="ground" aria-labelledby="blog-newsletter-title">
        <Container className="flex justify-center">
          <Card radius="lg" className="flex w-full max-w-xl flex-col gap-5 p-6 md:p-8">
            <h2 id="blog-newsletter-title" className="text-h3 text-text">
              {footerCopy.newsletterTitle}
            </h2>
            {newsletter}
          </Card>
        </Container>
      </Section>

      <CtaRibbon locale={locale} topTone="ground" page="blog" />
    </>
  );
}
