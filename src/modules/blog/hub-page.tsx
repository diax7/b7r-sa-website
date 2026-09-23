import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { copyFor } from '@/content/copy';
import { getHubs, getPostPage, type Hub } from '@/lib/cms/blog';
import { type Locale, localePath } from '@/lib/i18n';
import { siteBase } from '@/lib/env';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
import { HubChips } from '@/modules/blog/hub-chips';
import { Pagination } from '@/modules/blog/pagination';
import { PostCard } from '@/modules/blog/post-card';

/** A hub page (BRD 10.1): H1, description, the hub's posts, static pagination. */
export async function HubPage({ hub, locale, page }: { hub: Hub; locale: Locale; page: number }) {
  const { blog: blogCopy, productsPage } = copyFor(locale);
  const base = siteBase();
  const route = `/blog/category/${hub.slug}`;
  const [hubs, listing] = await Promise.all([
    getHubs(locale),
    getPostPage(locale, page, { hub: hub.slug }),
  ]);
  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.collectionPage(base, locale, hub, listing.posts),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: localePath(locale, '/') },
            { name: blogCopy.title, path: localePath(locale, '/blog') },
            { name: hub.name, path: route },
          ]),
        ]}
      />
      <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="hub-title">
        <Container className="flex flex-col gap-10">
          <SectionHeader
            as="h1"
            id="hub-title"
            eyebrow={blogCopy.title}
            title={hub.name}
            lead={hub.lead ?? hub.description}
          />
          <HubChips hubs={hubs} locale={locale} allLabel={blogCopy.allHubs} active={hub.slug} />
          {listing.posts.length > 0 ? (
            <ul
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              data-reveal-stagger=""
              data-post-grid=""
            >
              {listing.posts.map((post, i) => (
                <li key={post.slug}>
                  <PostCard post={post} locale={locale} priority={i === 0} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body text-text-muted" data-hub-empty="">
              {blogCopy.emptyHub}
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
      <CtaRibbon locale={locale} page={`hub-${hub.slug}`} />
    </>
  );
}
