import Link from 'next/link';
import type { SiteCopy } from '@/content/copy';
import { cn } from '@/lib/cn';

/**
 * Static pagination (ADR-041): every page is a route of its own (`{base}/page/{n}`, page 1 is
 * `{base}`), so nothing here reads the query string and the listings stay prerendered.
 */
export function pageHref(base: string, page: number): string {
  return page <= 1 ? base : `${base}/page/${page}`;
}

export function Pagination({
  base,
  page,
  totalPages,
  copy: s,
}: {
  /** The listing's path under the locale's prefix (`/en/blog`). */
  base: string;
  page: number;
  totalPages: number;
  copy: SiteCopy['blog']['pagination'];
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const chip = (n: number) => (
    <li key={n}>
      <Link
        href={pageHref(base, n)}
        aria-current={n === page ? 'page' : undefined}
        aria-label={s.page.replace('{n}', String(n))}
        className={cn(
          'inline-flex size-10 items-center justify-center rounded-pill border text-small font-medium transition-colors duration-(--duration-fast)',
          n === page
            ? 'border-primary bg-primary text-white'
            : 'border-border bg-surface text-text hover:border-primary hover:text-primary',
        )}
      >
        {n}
      </Link>
    </li>
  );
  return (
    <nav
      aria-label={s.label}
      className="flex items-center justify-between gap-4"
      data-pagination=""
    >
      <span className="text-small text-text-muted">
        {page > 1 ? (
          <Link href={pageHref(base, page - 1)} rel="prev" className="hover:text-primary">
            {s.previous}
          </Link>
        ) : null}
      </span>
      <ul className="flex flex-wrap items-center justify-center gap-2">{pages.map(chip)}</ul>
      <span className="text-small text-text-muted">
        {page < totalPages ? (
          <Link href={pageHref(base, page + 1)} rel="next" className="hover:text-primary">
            {s.next}
          </Link>
        ) : null}
      </span>
    </nav>
  );
}
