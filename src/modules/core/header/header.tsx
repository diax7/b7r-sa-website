'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/shared/button';
import { Container } from '@/components/shared/container';
import type { ShellCopy } from '@/content/copy';
import type { Navigation, SiteSettings } from '@/content/schema';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';
import { type Locale, localePath, otherLocale } from '@/lib/i18n';
import { isActive } from '@/lib/nav';
import { registerUrl } from '@/lib/utm';
import { LanguageSwitch } from '@/modules/core/header/language-switch';
import { MobileMenuTrigger } from '@/modules/core/header/mobile-menu-trigger';

/**
 * Sticky header (BRD 6.2, ADR-044). A 24 px sentinel at the top of the document drives the
 * scrolled state; the outer wrapper reserves `--header-h` so the inner shrink never shifts
 * layout. Transparent over the hero at the top of `/` only. Desktop: logo, nav, the language
 * switch, the CTA; phones: logo and burger (the switch sits in the menu's top bar).
 */
export interface ShellData {
  navigation: Navigation;
  site: SiteSettings;
  locale: Locale;
  /** The locales the site is in; the switch renders only when the other one is among them. */
  locales: readonly Locale[];
  copy: ShellCopy;
}

export function Header({ navigation, site, locale, locales, copy }: ShellData) {
  const pathname = usePathname();
  const switchable = locales.includes(otherLocale(locale));
  const [scrolled, setScrolled] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(entry ? !entry.isIntersecting : false),
      {
        threshold: 0,
      },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const home = localePath(locale, '/');
  const transparent = pathname === home && !scrolled;

  return (
    <>
      <div
        ref={sentinel}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 start-0 h-6 w-px"
      />
      <div className="sticky top-0 z-50 h-(--header-h-mobile) lg:h-(--header-h)">
        <header
          data-scrolled={scrolled || undefined}
          data-transparent={transparent || undefined}
          className={cn(
            'flex h-(--header-h-mobile) items-center transition-[height,background-color,box-shadow] duration-(--duration-base) ease-(--ease-standard) lg:h-(--header-h)',
            transparent ? 'bg-transparent' : 'bg-surface',
            scrolled &&
              'h-(--header-h-scrolled) bg-surface/85 shadow-header backdrop-blur-[12px] lg:h-(--header-h-scrolled)',
          )}
        >
          <Container className="flex items-center justify-between gap-6">
            <Link href={home} className="shrink-0 rounded-inner" aria-label={site.brandName}>
              <Image
                src="/images/logo/logo-header.png"
                alt=""
                width={198}
                height={72}
                sizes="198px"
                priority
                className={cn(
                  'w-auto transition-[height] duration-(--duration-base) ease-(--ease-standard)',
                  scrolled ? 'h-7 lg:h-8' : 'h-8 lg:h-11',
                )}
              />
            </Link>

            <nav aria-label={copy.a11y.mainNavigation} className="hidden lg:block">
              <ul className="flex items-center gap-8">
                {navigation.primary.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'nav-link relative py-2 text-body font-medium text-text transition-colors duration-(--duration-fast) hover:text-primary',
                          active && 'is-active font-bold text-primary',
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="hidden items-center gap-5 lg:flex">
              {switchable && (
                <LanguageSwitch locale={locale} ariaLabel={copy.a11y.switchLanguage} />
              )}
              <Button asChild>
                <a
                  href={registerUrl(env.appUrl, { campaign: 'header' })}
                  data-track="cta_click"
                  data-location="header"
                >
                  {navigation.ctaLabel}
                </a>
              </Button>
            </div>

            <MobileMenuTrigger
              pathname={pathname}
              navigation={navigation}
              site={site}
              locale={locale}
              switchable={switchable}
              copy={copy}
            />
          </Container>
        </header>
      </div>
    </>
  );
}
