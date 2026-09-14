'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { LANGUAGE_NAMES, languageTag, type Locale, localePath, otherLocale } from '@/lib/i18n';

/**
 * The language switch (ADR-043): a real link to the other language, never a redirect. The
 * server renders the other locale's home; once mounted it points at the page's twin when the
 * page emits one (`<link rel="alternate" hreflang>`, which the metadata builders write only
 * when the twin exists). Labelled in the target language, with `lang` and `hreflang` set.
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
  const [href, setHref] = useState(localePath(target, '/'));
  useEffect(() => {
    const twin = document.head.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hreflang="${tag}"]`,
    );
    // oxlint-disable-next-line react/set-state-in-effect -- reading the document once it exists is the intent
    if (twin?.href) setHref(new URL(twin.href).pathname);
  }, [tag]);
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
