'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  LANGUAGE_NAMES,
  languageTag,
  type Locale,
  localePath,
  otherLocale,
  stripLocale,
} from '@/lib/i18n';

/**
 * The language switch (ADR-043): a real link to the other language, never a redirect. The
 * server renders the current path under the other locale, right for every page with a twin
 * (also before hydration and without JavaScript); once mounted, a page that emits no
 * `<link rel="alternate" hreflang>` for the other language (the metadata builders write it
 * only when the twin exists) sends the reader to that language's home instead of a 404.
 * Labelled in the target language, with `lang` and `hreflang` set.
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
  const [href, setHref] = useState(localePath(target, stripLocale(pathname).path));
  useEffect(() => {
    const twin = document.head.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hreflang="${tag}"]`,
    );
    // oxlint-disable-next-line react/set-state-in-effect -- reading the document once it exists is the intent
    setHref(twin?.href ? new URL(twin.href).pathname : localePath(target, '/'));
  }, [tag, target]);
  return (
    <a
      href={href}
      lang={tag}
      hrefLang={tag}
      aria-label={ariaLabel}
      data-language-switch={target}
      className={cn(
        'inline-flex items-center rounded-inner px-2 py-1 text-small font-medium text-text-muted transition-colors duration-(--duration-fast) hover:text-primary',
        className,
      )}
    >
      {LANGUAGE_NAMES[target]}
    </a>
  );
}
