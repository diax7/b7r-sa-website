import Link from 'next/link';
import { blogCopy } from '@/content/blog';
import type { Hub } from '@/lib/cms/blog';
import { cn } from '@/lib/cn';

/** The hub strip (BRD 10.1): links to the hub pages, the current one marked; «الكل» is `/blog`. */
export function HubChips({ hubs, active }: { hubs: Hub[]; active?: string | undefined }) {
  const chip = (href: string, slug: string, name: string) => {
    const current = (active ?? '') === slug;
    return (
      <li key={slug || 'all'}>
        <Link
          href={href}
          aria-current={current ? 'page' : undefined}
          className={cn(
            'inline-flex h-10 items-center rounded-pill border px-4 text-small font-medium transition-colors duration-(--duration-fast)',
            current
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-surface text-text hover:border-primary hover:text-primary',
          )}
        >
          {name}
        </Link>
      </li>
    );
  };
  return (
    <ul className="flex flex-wrap gap-2" data-hub-chips="">
      {chip('/blog', '', blogCopy.allHubs)}
      {hubs.map((h) => chip(`/blog/category/${h.slug}`, h.slug, h.name))}
    </ul>
  );
}
