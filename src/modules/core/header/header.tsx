'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/shared/button';
import { Container } from '@/components/shared/container';
import { navigation } from '@/content/navigation';
import { site } from '@/content/site';
import messages from '@/messages/ar.json';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';
import { isActive } from '@/lib/nav';
import { loginUrl, registerUrl } from '@/lib/utm';
import { MobileMenuTrigger } from '@/modules/core/header/mobile-menu-trigger';

/**
 * Sticky header (BRD 6.2). A 24 px sentinel at the top of the document drives the scrolled
 * state; the outer wrapper reserves `--header-h` so the inner shrink never shifts layout.
 * Transparent over the hero at the top of `/` only.
 */
export function Header() {
  const pathname = usePathname();
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

  const transparent = pathname === '/' && !scrolled;

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
            <Link href="/" className="shrink-0 rounded-inner" aria-label={site.brandName}>
              <Image
                src="/images/logo/logo-header.png"
                alt=""
                width={198}
                height={72}
                priority
                className={cn(
                  'w-auto transition-[height] duration-(--duration-base) ease-(--ease-standard)',
                  scrolled ? 'h-7 lg:h-[30px]' : 'h-7 lg:h-9',
                )}
              />
            </Link>

            <nav aria-label={messages.a11y.mainNavigation} className="hidden lg:block">
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
                          active && 'is-active text-primary',
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="hidden items-center gap-6 lg:flex">
              <a
                href={loginUrl(env.appUrl)}
                className="text-body font-medium text-text transition-colors duration-(--duration-fast) hover:text-primary"
              >
                {navigation.loginLabel}
              </a>
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

            <MobileMenuTrigger pathname={pathname} />
          </Container>
        </header>
      </div>
    </>
  );
}
