import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { faq } from '@/content/faq';
import { faqPage, productsPage } from '@/content/pages';
import { getSeo, getSiteSettings } from '@/lib/cms';
import { siteBase } from '@/lib/env';
import { whatsappUrl } from '@/lib/utm';
import messages from '@/messages/ar.json';
import { CtaRibbon, FaqAccordionLoader, FaqStaticList, JsonLd, jsonLd } from '@/modules/core';

const ROUTE = '/faq';

/** Appendix D groups in first-appearance order. */
export function faqGroups() {
  const groups = new Map<string, Array<{ question: string; answer: string }>>();
  for (const item of faq) {
    const list = groups.get(item.group) ?? [];
    list.push({ question: item.question, answer: item.answer });
    groups.set(item.group, list);
  }
  return [...groups.entries()].map(([name, items], i) => ({
    name,
    id: `faq-group-${i + 1}`,
    items,
  }));
}

/**
 * Full FAQ (BRD 6.10): each Appendix D group as an H2 with its own accordion, a sticky
 * in-page group nav on desktop (start column), and the WhatsApp line at the end. No FAQPage
 * schema (rich results discontinued).
 */
export async function FaqPage() {
  const copy = faqPage;
  const base = siteBase();
  const [seo, site] = await Promise.all([getSeo(ROUTE), getSiteSettings()]);
  const groups = faqGroups();
  // Only the platform word in the bottom line becomes the link.
  const [before, after] = copy.bottomLine.split(copy.bottomLinkWord);

  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.webPage(base, ROUTE, seo.title, seo.description),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: '/' },
            { name: copy.title, path: ROUTE },
          ]),
        ]}
      />

      <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="faq-page-title">
        <Container className="flex flex-col gap-12">
          <SectionHeader as="h1" id="faq-page-title" title={copy.title} lead={copy.lead} />
          <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
            <nav
              aria-label={messages.faq.groupsNav}
              className="hidden lg:block lg:self-start lg:sticky lg:top-[calc(var(--header-h)+24px)]"
            >
              <ul className="flex flex-col gap-1 border-s border-border">
                {groups.map((group) => (
                  <li key={group.id}>
                    <a
                      href={`#${group.id}`}
                      className="-ms-px block border-s-2 border-transparent py-2 ps-4 text-small text-text-muted transition-colors duration-(--duration-fast) hover:border-primary hover:text-primary"
                    >
                      {group.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex flex-col gap-14">
              {groups.map((group) => (
                <section key={group.id} id={group.id} aria-labelledby={`${group.id}-title`}>
                  <h2 id={`${group.id}-title`} className="text-h3 mb-4 text-text">
                    {group.name}
                  </h2>
                  <FaqAccordionLoader
                    items={group.items}
                    fallback={<FaqStaticList items={group.items} />}
                  />
                </section>
              ))}
              <p className="text-body text-text-muted">
                {before}
                <a
                  href={whatsappUrl(site.contact.whatsapp)}
                  target="_blank"
                  rel="noopener"
                  className="font-medium text-primary hover:text-primary-hover"
                  data-track="whatsapp_click"
                  data-location="contact"
                >
                  {copy.bottomLinkWord}
                </a>
                {after}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <CtaRibbon topTone="surface" page="faq" />
    </>
  );
}
