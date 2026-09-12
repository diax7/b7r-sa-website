'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { InstagramIcon, TikTokIcon, WhatsAppIcon, XIcon } from '@/components/shared/brand-icons';
import { Button } from '@/components/shared/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { navigation } from '@/content/navigation';
import { footerCopy } from '@/content/pages';
import { site } from '@/content/site';
import messages from '@/messages/ar.json';
import { cn } from '@/lib/cn';
import { Burger, burgerButtonClass } from '@/modules/core/header/burger';
import { env } from '@/lib/env';
import { isActive } from '@/lib/nav';
import { loginUrl, registerUrl, whatsappUrl } from '@/lib/utm';

/**
 * Mobile navigation (BRD 6.2). A Radix Dialog sheet: focus trap, Escape, scroll lock and
 * focus restore come from Radix. The header burger becomes invisible while open and a
 * `DialogClose` renders at the same spot inside the sheet, so the eye reads one morphing
 * control and the close control lives inside the focus trap.
 */
export function MobileMenu({
  pathname,
  autoOpen = false,
}: {
  pathname: string;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Mounted on first tap of the lightweight trigger (see MobileMenuTrigger): open at once.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- opening on mount is the intent
    if (autoOpen) setOpen(true);
  }, [autoOpen]);
  const socials = [
    { href: site.social.x, label: footerCopy.socialAria.x, Icon: XIcon },
    { href: site.social.instagram, label: footerCopy.socialAria.instagram, Icon: InstagramIcon },
    { href: site.social.tiktok, label: footerCopy.socialAria.tiktok, Icon: TikTokIcon },
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
        className="data-[state=open]:animate-menu-in data-[state=closed]:animate-menu-out lg:hidden"
      >
        <DialogTitle className="sr-only">{navigation.menuOpenLabel}</DialogTitle>
        <div className="flex h-(--header-h-mobile) items-center justify-end px-4 sm:px-6">
          <DialogClose
            className={burgerButtonClass}
            aria-label={navigation.menuCloseLabel}
            data-testid="menu-close"
          >
            <Burger open />
          </DialogClose>
        </div>
        <nav aria-label={messages.a11y.mainNavigation} className="px-4 pt-6 sm:px-6">
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
        <div className="mt-8 flex flex-col gap-3 border-t border-border px-4 pt-8 sm:px-6">
          <Button asChild size="lg" fullWidth>
            <a
              href={registerUrl(env.appUrl, { campaign: 'menu' })}
              data-track="cta_click"
              data-location="menu"
            >
              {navigation.ctaLabel}
            </a>
          </Button>
          <Button asChild variant="secondary" size="lg" fullWidth>
            <a href={loginUrl(env.appUrl)}>{navigation.loginLabel}</a>
          </Button>
          <a
            href={whatsappUrl(site.contact.whatsapp)}
            target="_blank"
            rel="noopener"
            className="mt-4 inline-flex items-center gap-3 self-start py-2 text-body font-medium text-text hover:text-primary"
            data-track="whatsapp_click"
            data-location="menu"
          >
            <span className="grid size-9 place-items-center rounded-pill bg-whatsapp/10 text-whatsapp">
              <WhatsAppIcon size={18} />
            </span>
            {navigation.menuWhatsappLine}
          </a>
          <ul className="mt-2 flex items-center gap-2">
            {socials.map(({ href, label, Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener"
                  aria-label={label}
                  className="grid size-11 place-items-center rounded-pill border border-border text-text-muted transition-colors duration-(--duration-fast) hover:border-primary hover:text-primary"
                >
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
