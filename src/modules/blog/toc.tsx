import type { Heading } from '@/lib/lexical';

/**
 * The table of contents (BRD 10.1): the post's H2s as anchor links. A side rail from 1024 px
 * (sticky, on the inline-start side of the body) and a folded list above the body under it.
 * Server-rendered, no JS.
 */
export function TableOfContents({
  headings,
  title,
  variant,
}: {
  headings: Heading[];
  title: string;
  /** `rail` beside the body on wide screens; `folded` inside the article under it. */
  variant: 'rail' | 'folded';
}) {
  if (headings.length < 2) return null;
  const list = (
    <ol className="flex flex-col gap-2 text-small">
      {headings.map((h) => (
        <li key={h.id}>
          <a href={`#${h.id}`} className="text-text-muted hover:text-primary">
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );
  if (variant === 'folded') {
    return (
      <details
        className="rounded-base border border-border bg-ground p-4 lg:hidden"
        data-toc="folded"
      >
        <summary className="cursor-pointer text-small font-medium text-text">{title}</summary>
        <div className="pt-3">{list}</div>
      </details>
    );
  }
  return (
    <nav
      aria-label={title}
      className="hidden lg:sticky lg:top-24 lg:block lg:w-56 lg:shrink-0 lg:self-start"
      data-toc="rail"
    >
      <p className="mb-3 text-caption font-medium text-text-muted">{title}</p>
      {list}
    </nav>
  );
}
