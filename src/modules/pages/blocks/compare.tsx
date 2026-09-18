import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { copyFor } from '@/content/copy';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/dates';
import type { BlockProps } from '@/modules/pages/blocks/types';

const cell = 'border-b border-border px-4 py-3 align-top text-body text-text';
const head = 'border-b-2 border-border px-4 py-3 text-start text-small font-medium text-text-muted';

/**
 * A comparison (ADR-050, BRD 7.4): a criteria table with the criterion column sticky under
 * a narrow screen, then "best for" and "not best for", then the date the other side's pages
 * were read. Plain HTML a reader and an engine lift as is; no link leaves the site.
 */
export function CompareBlock({ block, locale, tone, anchor, heading }: BlockProps<'compare'>) {
  const Heading = heading ? 'h1' : 'h2';
  // The two lists sit one level under the block's own heading, so the outline never skips a
  // level: H2 under the page's H1, H3 under a later block's H2 (site audit 2026-09-18, item 5).
  const ListHeading = heading ? 'h2' : 'h3';
  const messages = copyFor(locale).compare;
  const title = heading?.title ?? block.title;
  return (
    <Section
      tone={tone}
      className={heading ? 'pt-10 md:pt-16' : undefined}
      aria-labelledby={`${anchor}-title`}
      data-block="compare"
    >
      <Container className="flex flex-col gap-8">
        <div className="flex max-w-prose flex-col gap-3">
          {title && (
            <Heading
              id={`${anchor}-title`}
              className={cn(heading ? 'text-h1' : 'text-h2', 'text-text')}
            >
              {title}
            </Heading>
          )}
          {heading?.lead && <p className="lead text-text-muted">{heading.lead}</p>}
          {block.intro && <p className="text-body text-text-muted">{block.intro}</p>}
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-card">
          <table className="w-full min-w-[36rem] border-collapse">
            <caption className="sr-only">
              {messages.caption.replace('{ours}', block.ours).replace('{theirs}', block.theirs)}
            </caption>
            <thead>
              <tr>
                <th scope="col" className={cn(head, 'sticky start-0 z-10 bg-surface')}>
                  {messages.criterion}
                </th>
                <th scope="col" className={cn(head, 'text-primary')}>
                  {block.ours}
                </th>
                <th scope="col" className={head}>
                  {block.theirs}
                </th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.criterion}>
                  <th
                    scope="row"
                    className={cn(cell, 'sticky start-0 z-10 bg-surface font-medium')}
                  >
                    {row.criterion}
                  </th>
                  <td className={cell}>{row.ours}</td>
                  <td className={cn(cell, 'text-text-muted')}>{row.theirs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <div
            className="flex flex-col gap-3 rounded-lg bg-accent-tint p-6"
            data-compare-list="best"
          >
            <ListHeading className="text-h4 text-text">
              {messages.bestFor.replace('{ours}', block.ours)}
            </ListHeading>
            <ul className="flex list-disc flex-col gap-2 ps-5 text-body text-text">
              {block.bestFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div
            className="flex flex-col gap-3 rounded-lg border border-border p-6"
            data-compare-list="not"
          >
            <ListHeading className="text-h4 text-text">
              {messages.notBestFor.replace('{ours}', block.ours)}
            </ListHeading>
            <ul className="flex list-disc flex-col gap-2 ps-5 text-body text-text-muted">
              {block.notBestFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        {block.closing && <p className="max-w-prose text-body text-text">{block.closing}</p>}
        <p className="text-small text-text-muted">
          {messages.asOf.replace('{theirs}', block.theirs)}{' '}
          <time dateTime={block.asOf}>{formatDate(locale, block.asOf)}</time>
          {messages.asOfTail}
        </p>
      </Container>
    </Section>
  );
}
