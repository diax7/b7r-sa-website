import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Icon } from '@/components/shared/icon';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

/**
 * Breadcrumb trail (BRD 5.3: product pages and posts only). The last item is the current page
 * (`aria-current`). `ChevronRight` points forward in LTR; `Icon` mirrors it under RTL. Each
 * link is a 44 px hit area (BRD 6.17) without changing the trail's height.
 */
export function Breadcrumbs({ items, label }: { items: BreadcrumbItem[]; label: string }) {
  return (
    <nav aria-label={label} className="text-small text-text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="text-text">
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className="inline-block py-2.5 -my-2.5 hover:text-primary">
                  {item.name}
                </Link>
              )}
              {!last && <Icon icon={ChevronRight} size={16} className="text-text-muted/70" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
