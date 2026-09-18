import { Container } from '@/components/shared/container';
import { Prose } from '@/components/shared/prose';
import { Section } from '@/components/shared/section';
import { copyFor } from '@/content/copy';
import { formatDate } from '@/lib/dates';
import { renderMarkdown, type Heading } from '@/lib/markdown';
import type { BlockProps } from '@/modules/pages/blocks/types';

/** Sticky list of the H2s on desktop (BRD 6.12). */
export function OnThisPage({ headings, label }: { headings: Heading[]; label: string }) {
  if (headings.length === 0) return null;
  return (
    <nav
      aria-label={label}
      className="hidden lg:block lg:self-start lg:sticky lg:top-[calc(var(--header-h)+24px)]"
    >
      <p className="mb-3 text-caption font-medium text-text-muted">{label}</p>
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

/**
 * A legal text (BRD 6.12, Appendix B): Markdown from the admin rendered on the server through
 * the allowlisting renderer, the «آخر تحديث» line, the on-this-page list on desktop.
 */
export function LegalBodyBlock({
  block,
  page,
  locale,
  tone,
  anchor,
  heading,
}: BlockProps<'legalBody'>) {
  const messages = copyFor(locale);
  const { html, headings } = renderMarkdown(block.body, `${anchor}-section`);
  return (
    <Section
      tone={tone}
      className={heading ? 'pt-10 md:pt-16' : undefined}
      aria-labelledby={`${anchor}-title`}
      data-block="legalBody"
    >
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16">
        <article className="flex max-w-(--container-prose) flex-col gap-6">
          <header className="flex flex-col gap-3">
            {heading ? (
              <h1 id={`${anchor}-title`} className="text-h1 text-text">
                {heading.title}
              </h1>
            ) : (
              <h2 id={`${anchor}-title`} className="text-h2 text-text">
                {page.title}
              </h2>
            )}
            <p className="text-small text-text-muted">
              {messages.legal.updatedPrefix}{' '}
              <time dateTime={block.updatedAt}>{formatDate(locale, block.updatedAt)}</time>
            </p>
          </header>
          <Prose html={html} />
        </article>
        <OnThisPage label={messages.legal.onThisPage} headings={headings} />
      </Container>
    </Section>
  );
}
