import type { ReactNode } from 'react';
import { Card } from '@/components/shared/card';
import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { blogCopy, blogHubs, blogPosts } from '@/content/blog';
import { loadBlogPost } from '@/content/blog/load';
import { footerCopy, productsPage } from '@/content/pages';
import { getSeo } from '@/lib/cms';
import { siteBase } from '@/lib/env';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
import { HubFilter } from '@/modules/blog/hub-filter';
import { PostCard } from '@/modules/blog/post-card';

const ROUTE = '/blog';

/**
 * Blog index (BRD 6.11): hub chips, post cards, newsletter block. The newsletter form comes
 * in as a slot from the route (same pattern as the footer) so this module never imports the
 * forms module.
 */
export async function BlogIndex({ newsletter }: { newsletter: ReactNode }) {
  const base = siteBase();
  const seo = await getSeo(ROUTE);
  const posts = blogPosts
    .map((post) => loadBlogPost(post))
    .toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.webPage(base, ROUTE, seo.title, seo.description),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: '/' },
            { name: blogCopy.title, path: ROUTE },
          ]),
        ]}
      />

      <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="blog-title">
        <Container className="flex flex-col gap-10">
          <SectionHeader as="h1" id="blog-title" title={blogCopy.title} lead={blogCopy.lead} />
          <HubFilter hubs={blogHubs} allLabel={blogCopy.allHubs} grid="[data-post-grid]" />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-post-grid="">
            {posts.map((post) => (
              <li key={post.slug}>
                <PostCard post={post} readingMinutes={post.readingMinutes} />
              </li>
            ))}
          </ul>
          <p hidden className="text-body text-text-muted" data-hub-empty="">
            {blogCopy.emptyHub}
          </p>
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

      <CtaRibbon topTone="ground" page="blog" />
    </>
  );
}
