import Link from 'next/link';
import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import type { BlockOf, FaqItem } from '@/content/schema';
import { copyFor } from '@/content/copy';
import { getFaqs, getHomeFaqs, getSiteSettings } from '@/lib/cms';
import { type Locale, localePath } from '@/lib/i18n';
import { whatsappUrl } from '@/lib/utm';
import { FaqAccordion } from '@/modules/core';
import type { BlockProps } from '@/modules/pages/blocks/types';

type Item = { question: string; answer: string };

/**
 * The entries a `faqList` block shows, in its order (the `home` slice or every group): the
 * schema on the FAQ page reads the same list, so it can never drift from the visible text.
 */
export async function faqItemsFor(
  block: Pick<BlockOf<'faqList'>, 'selection' | 'offset' | 'limit'>,
  locale: Locale,
): Promise<Item[]> {
  if (block.selection === 'home') {
    return (await getHomeFaqs(locale))
      .slice(block.offset, block.limit ? block.offset + block.limit : undefined)
      .map((f) => ({ question: f.question, answer: f.answer }));
  }
  return (await getFaqs(locale)).map((f) => ({ question: f.question, answer: f.answer }));
}

/**
 * Appendix D groups in first-appearance order, each with an id for the in-page nav; `names`
 * maps the select value to the name the page shows (the English names, ADR-043).
 */
export function faqGroups(faq: FaqItem[], prefix = 'faq', names?: Record<string, string>) {
  const groups = new Map<string, Item[]>();
  for (const item of faq) {
    const list = groups.get(item.group) ?? [];
    list.push({ question: item.question, answer: item.answer });
    groups.set(item.group, list);
  }
  return [...groups.entries()].map(([name, items], i) => ({
    name: names?.[name] ?? name,
    id: `${prefix}-group-${i + 1}`,
    items,
  }));
}

/** The closing line with one word carrying the WhatsApp link (BRD 6.10). */
async function BottomLine({ line, word, locale }: { line: string; word: string; locale: Locale }) {
  const site = await getSiteSettings(locale);
  const [before, after] = line.split(word);
  return (
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
        {word}
      </a>
      {after}
    </p>
  );
}

/**
 * FAQ entries from the `faqs` collection (BRD 6.10, 6.4.9, 4.9). `all`: every group as an
 * H2 with its own accordion and a sticky group nav on desktop. `home`: a slice of the home
 * entries (offset/limit) beside a title and a link, the how-it-works mini FAQ.
 */
export async function FaqListBlock({
  block,
  locale,
  tone,
  anchor,
  heading,
}: BlockProps<'faqList'>) {
  const first = Boolean(heading);
  const padding = first ? 'pt-10 md:pt-16' : undefined;
  const messages = copyFor(locale);
  if (block.selection === 'home') {
    const items = await faqItemsFor(block, locale);
    const title = heading?.title ?? block.title;
    return (
      <Section
        tone={tone}
        className={padding}
        aria-labelledby={`${anchor}-title`}
        data-block="faqList"
      >
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
          <div className="flex flex-col items-start gap-6">
            {title && (
              <SectionHeader
                as={first ? 'h1' : 'h2'}
                id={`${anchor}-title`}
                title={title}
                {...(heading?.lead ? { lead: heading.lead } : {})}
              />
            )}
            {block.link && (
              <Link
                href={localePath(locale, block.link.href)}
                className="py-2 font-medium text-primary hover:text-primary-hover"
              >
                {block.link.label}
              </Link>
            )}
          </div>
          <FaqAccordion items={items} />
        </Container>
      </Section>
    );
  }

  const groups = faqGroups(await getFaqs(locale), anchor, messages.faq.groups);
  const title = heading?.title ?? block.title;
  return (
    <Section
      tone={tone}
      className={padding}
      aria-labelledby={`${anchor}-title`}
      data-block="faqList"
    >
      <Container className="flex flex-col gap-12">
        {title && (
          <SectionHeader
            as={first ? 'h1' : 'h2'}
            id={`${anchor}-title`}
            title={title}
            {...(heading?.lead ? { lead: heading.lead } : {})}
          />
        )}
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
                <FaqAccordion items={group.items} />
              </section>
            ))}
            {block.bottomLine && block.bottomLinkWord && (
              <BottomLine locale={locale} line={block.bottomLine} word={block.bottomLinkWord} />
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
