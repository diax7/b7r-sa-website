'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { InstagramIcon, TikTokIcon, WhatsAppIcon, XIcon } from '@/components/shared/brand-icons';
import { Button } from '@/components/shared/button';
import { Container } from '@/components/shared/container';
import { StaticImage } from '@/components/shared/static-image';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ShellCopy } from '@/content/copy';
import type { Navigation, SiteSettings } from '@/content/schema';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';
import { type Locale, localePath } from '@/lib/i18n';
import { isActive } from '@/lib/nav';
import { registerUrl, whatsappUrl } from '@/lib/utm';
import { Burger, burgerButtonClass } from '@/modules/core/header/burger';
import { LanguageSwitch } from '@/modules/core/header/language-switch';

const social =
  'grid size-11 place-items-center rounded-pill border border-border text-text-muted transition-colors duration-(--duration-fast) hover:border-primary hover:text-primary';

/**
 * Mobile navigation (BRD 6.2, ADR-044). A Radix Dialog sheet: focus trap, Escape, scroll lock
 * and focus restore come from Radix. The sheet fades in from above; its top bar mirrors the
 * header (the logo at the start, the language switch and the X at the end) and the header
 * burger becomes invisible while open, with a `DialogClose` at the same spot morphing from
 * the burger into the X, so the eye reads one control and the close control lives inside
 * the focus trap. Below: the links, the CTA, then WhatsApp and the socials as icons.
 */
export function MobileMenu({
  pathname,
  navigation,
  site,
  locale,
  switchable,
  copy,
  autoOpen = false,
}: {
  pathname: string;
  navigation: Navigation;
  site: SiteSettings;
  locale: Locale;
  /** Whether the site exists in the other language (the header decides). */
  switchable: boolean;
  copy: ShellCopy;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Mounted on first tap of the lightweight trigger (see MobileMenuTrigger): open at once.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- opening on mount is the intent
    if (autoOpen) setOpen(true);
  }, [autoOpen]);
  const socials = [
    { href: site.social.x, label: copy.socialAria.x, Icon: XIcon },
    { href: site.social.instagram, label: copy.socialAria.instagram, Icon: InstagramIcon },
    { href: site.social.tiktok, label: copy.socialAria.tiktok, Icon: TikTokIcon },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(burgerButtonClass, open && 'invisible')}
        aria-label={navigation.menuOpenLabel}
        data-testid="menu-open"
      >
        <Burger open={false} />
      </DialogTrigger>
      <DialogContent
        variant="sheet"
        aria-describedby={undefined}
        className="group data-[state=open]:animate-menu-in data-[state=closed]:animate-menu-out lg:hidden"
      >
        <DialogTitle className="sr-only">{navigation.menuOpenLabel}</DialogTitle>
        <Container className="flex h-(--header-h-mobile) items-center justify-between gap-4">
          <Link
            href={localePath(locale, '/')}
            className="shrink-0 rounded-inner"
            aria-label={site.brandName}
            onClick={() => setOpen(false)}
          >
            <StaticImage
              src="/images/logo/logo-header.png"
              alt=""
              width={198}
              height={72}
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex items-center gap-2">
            {switchable && <LanguageSwitch locale={locale} ariaLabel={copy.a11y.switchLanguage} />}
            <DialogClose
              className={burgerButtonClass}
              aria-label={navigation.menuCloseLabel}
              data-testid="menu-close"
            >
              <Burger open morph />
            </DialogClose>
          </div>
        </Container>
        <nav aria-label={copy.a11y.mainNavigation} className="px-4 pt-6 sm:px-6">
          <ul className="flex flex-col gap-1">
            {navigation.primary.map((item, i) => (
              <li
                key={item.href}
                className="animate-rise-in motion-reduce:animate-none"
                style={{ animationDelay: `${120 + i * 40}ms` } as CSSProperties}
              >
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item) ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block rounded-base py-3 text-[28px] leading-tight font-bold text-text transition-colors duration-(--duration-fast) hover:text-primary',
                    isActive(pathname, item) && 'text-primary',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-8 flex flex-col gap-6 border-t border-border px-4 pt-8 sm:px-6">
          <Button asChild size="lg" fullWidth variant={site.ctaShiny ? 'shiny' : 'primary'}>
            <a
              href={registerUrl(env.appUrl, { campaign: 'menu' })}
              data-track="cta_click"
              data-location="menu"
              data-shiny={site.ctaShiny || undefined}
            >
              {navigation.ctaLabel}
            </a>
          </Button>
          <ul className="flex items-center gap-2">
            <li>
              <a
                href={whatsappUrl(site.contact.whatsapp)}
                target="_blank"
                rel="noopener"
                aria-label={copy.socialAria.whatsapp}
                className={cn(social, 'border-whatsapp/30 bg-whatsapp/10 text-whatsapp')}
                data-track="whatsapp_click"
                data-location="menu"
              >
                <WhatsAppIcon size={20} />
              </a>
            </li>
            {socials.map(({ href, label, Icon }) => (
              <li key={href}>
                <a href={href} target="_blank" rel="noopener" aria-label={label} className={social}>
                  <Icon size={18} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
