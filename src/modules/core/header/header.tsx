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
 * The island header (BRD 6.2 amended 2026-09-17, ADR-053). A 24 px sentinel at the top of
 * the document drives the scrolled state; the outer wrapper reserves the rest height so the
 * change never shifts layout. At rest a full-width bar, transparent over the hero at the top
 * of `/` only; scrolled, the bar settles into a white capsule below the top edge (the CSS in
 * `globals.css`, `.header-bar`). Desktop: logo, nav, the language switch, the CTA; phones:
 * logo, the CTA and the burger (the switch sits in the menu's top bar).
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
            'header-bar flex items-center',
            transparent ? 'bg-transparent' : 'bg-surface',
          )}
        >
          <Container className="header-inner flex items-center justify-between gap-4 lg:gap-6">
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
              <ul className="header-nav flex items-center gap-8">
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

            <div className="flex items-center gap-1 lg:gap-5">
              {switchable && (
                <div className="hidden lg:block">
                  <LanguageSwitch locale={locale} ariaLabel={copy.a11y.switchLanguage} />
                </div>
              )}
              {/* One CTA for both layouts: compact on phones, the full button on desktop. */}
              <Button
                asChild
                variant={navigation.ctaShiny ? 'shiny' : 'primary'}
                className="h-9 px-4 text-small lg:h-11 lg:px-5 lg:text-button"
              >
                <a
                  href={registerUrl(env.appUrl, { campaign: 'header' })}
                  data-track="cta_click"
                  data-location="header"
                  data-shiny={navigation.ctaShiny || undefined}
                >
                  {navigation.ctaLabel}
                </a>
              </Button>
              <MobileMenuTrigger
                pathname={pathname}
                navigation={navigation}
                site={site}
                locale={locale}
                switchable={switchable}
                copy={copy}
              />
            </div>
          </Container>
        </header>
      </div>
    </>
  );
}
