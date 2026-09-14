import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { blogCopy } from '@/content/blog';
import { productsPage } from '@/content/pages';
import { getHubs, getPostPage, type Hub } from '@/lib/cms/blog';
import { siteBase } from '@/lib/env';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
import { HubChips } from '@/modules/blog/hub-chips';
import { Pagination } from '@/modules/blog/pagination';
import { PostCard } from '@/modules/blog/post-card';

/** A hub page (BRD 10.1): H1, description, the hub's posts, static pagination. */
export async function HubPage({ hub, page }: { hub: Hub; page: number }) {
  const base = siteBase();
  const route = `/blog/category/${hub.slug}`;
  const [hubs, listing] = await Promise.all([getHubs(), getPostPage(page, { hub: hub.slug })]);
  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.collectionPage(base, hub, listing.posts),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: '/' },
            { name: blogCopy.title, path: '/blog' },
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
          <HubChips hubs={hubs} active={hub.slug} />
          {listing.posts.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-post-grid="">
              {listing.posts.map((post, i) => (
                <li key={post.slug}>
                  <PostCard post={post} priority={i === 0} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body text-text-muted" data-hub-empty="">
              {blogCopy.emptyHub}
            </p>
          )}
          <Pagination base={route} page={page} totalPages={listing.totalPages} />
        </Container>
      </Section>
      <CtaRibbon topTone="surface" page={`hub-${hub.slug}`} />
    </>
  );
}
