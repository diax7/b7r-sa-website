'use client';

import { Languages } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import {
  fallbackPath,
  LANGUAGE_NAMES,
  languageTag,
  type Locale,
  localePath,
  otherLocale,
  stripLocale,
} from '@/lib/i18n';

/**
 * The language switch (ADR-043, ADR-044): a real link to the other language, never a
 * redirect, drawn as the translate glyph in a 44 px ring with the target language's name in
 * a CSS tooltip. The href is the current path under the other locale, derived on every
 * render, so it follows client-side navigation (also before hydration and without
 * JavaScript). Once mounted, a page that emits no `<link rel="alternate" hreflang>` for the
 * other language (the metadata builders write it only when the twin exists) sends the reader
 * to that section's listing in the other language instead of a 404.
 */
export function LanguageSwitch({
  locale,
  ariaLabel,
  className,
}: {
  locale: Locale;
  /** «Switch to English» / «التبديل إلى العربية», from the copy bank. */
  ariaLabel: string;
  className?: string | undefined;
}) {
  const target = otherLocale(locale);
  const tag = languageTag(target);
  const pathname = usePathname();
  // The fallback remembers the pathname it was read for, so the frame between a navigation
  // and the effect never shows the previous page's fallback.
  const [fallback, setFallback] = useState<{ pathname: string; href: string } | null>(null);
  useEffect(() => {
    const twin = document.head.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hreflang="${tag}"]`,
    );
    // oxlint-disable-next-line react/set-state-in-effect -- reading the document once it exists is the intent
    setFallback(twin ? null : { pathname, href: fallbackPath(target, stripLocale(pathname).path) });
  }, [pathname, tag, target]);
  const href =
    fallback?.pathname === pathname
      ? fallback.href
      : localePath(target, stripLocale(pathname).path);
  return (
    <a
      href={href}
      lang={tag}
      hrefLang={tag}
      aria-label={ariaLabel}
      data-language-switch={target}
      data-tooltip={LANGUAGE_NAMES[target]}
      className={cn(
        'tooltip grid size-11 place-items-center rounded-pill border border-border text-text transition-colors duration-(--duration-fast) hover:border-primary hover:bg-accent-tint hover:text-primary',
        className,
      )}
    >
      <Icon icon={Languages} size={20} />
    </a>
  );
}
