import { Container } from '@/components/shared/container';
import { Prose } from '@/components/shared/prose';
import { Section } from '@/components/shared/section';
import { getLegalPages } from '@/content/legal';
import { legalCopy, productsPage } from '@/content/pages';
import type { LegalPage as LegalPageData } from '@/content/schema';
import { getSeo } from '@/lib/cms';
import { siteBase } from '@/lib/env';
import { renderMarkdown, type Heading } from '@/lib/markdown';
import messages from '@/messages/ar.json';
import { CtaRibbon, JsonLd, jsonLd } from '@/modules/core';

/** Sticky list of the H2s on desktop (BRD 6.12). */
export function OnThisPage({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) return null;
  return (
    <nav
      aria-label={messages.legal.onThisPage}
      className="hidden lg:block lg:self-start lg:sticky lg:top-[calc(var(--header-h)+24px)]"
    >
      <p className="mb-3 text-caption font-medium text-text-muted">{messages.legal.onThisPage}</p>
      <ul className="flex flex-col gap-1 border-s border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="-ms-px block border-s-2 border-transparent py-1.5 ps-4 text-small text-text-muted transition-colors duration-(--duration-fast) hover:border-primary hover:text-primary"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function getLegalPage(slug: LegalPageData['slug']): LegalPageData {
  const page = getLegalPages().find((p) => p.slug === slug);
  if (!page) throw new Error(`Legal page ${slug} missing from content/legal`);
  return page;
}

/** `/terms`, `/shipping`, `/privacy` (BRD 6.12, Appendix B verbatim). */
export async function LegalPage({ slug }: { slug: LegalPageData['slug'] }) {
  const page = getLegalPage(slug);
  const route = `/${slug}`;
  const base = siteBase();
  const seo = await getSeo(route);
  const { html, headings } = renderMarkdown(page.body);

  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.webPage(base, route, seo.title, seo.description, page.updatedAt),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: '/' },
            { name: page.title, path: route },
          ]),
        ]}
      />
      <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="legal-title">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16">
          <article className="flex max-w-(--container-prose) flex-col gap-6">
            <header className="flex flex-col gap-3">
              <h1 id="legal-title" className="text-h1 text-text">
                {page.title}
              </h1>
              <p className="text-small text-text-muted">
                {legalCopy.updatedPrefix}{' '}
                <time dateTime={page.updatedAt}>
                  <bdi dir="ltr">{page.updatedAt}</bdi>
                </time>
              </p>
            </header>
            <Prose html={html} />
          </article>
          <OnThisPage headings={headings} />
        </Container>
      </Section>
      <CtaRibbon topTone="surface" page={slug} />
    </>
  );
}
