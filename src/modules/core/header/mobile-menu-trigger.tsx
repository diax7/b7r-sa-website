'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ShellCopy } from '@/content/copy';
import type { Navigation, SiteSettings } from '@/content/schema';
import type { Locale } from '@/lib/i18n';
import type { LogoImage } from '@/modules/core/logo-image';
import { Burger, burgerButtonClass } from '@/modules/core/header/burger';

const MobileMenu = dynamic(
  () => import('@/modules/core/header/mobile-menu').then((m) => m.MobileMenu),
  {
    ssr: false,
    // Keeps the control in place while the sheet chunk downloads; the burger stays a burger
    // so the morph into the X plays once, when the sheet mounts (ADR-044).
    loading: () => (
      <button type="button" className={burgerButtonClass} disabled>
        <Burger open={false} />
      </button>
    ),
  },
);

const preload = () => void import('@/modules/core/header/mobile-menu');

/**
 * The burger is server-rendered and cheap; the Radix sheet (focus trap, scroll lock) is
 * fetched on first intent (pointer/touch/focus) so it never sits in the home page's initial
 * JS (BRD 7.8). Once loaded, the sheet owns the open state and renders its own trigger.
 */
export function MobileMenuTrigger({
  pathname,
  navigation,
  site,
  locale,
  switchable,
  copy,
  logo,
}: {
  pathname: string;
  navigation: Navigation;
  site: SiteSettings;
  locale: Locale;
  switchable: boolean;
  copy: ShellCopy;
  logo: LogoImage | null;
}) {
  const [wanted, setWanted] = useState(false);

  if (wanted)
    return (
      <MobileMenu
        pathname={pathname}
        navigation={navigation}
        site={site}
        locale={locale}
        switchable={switchable}
        copy={copy}
        logo={logo}
        autoOpen
      />
    );

  return (
    <button
      type="button"
      className={burgerButtonClass}
      aria-label={navigation.menuOpenLabel}
      aria-haspopup="dialog"
      data-testid="menu-open"
      onPointerEnter={preload}
      onFocus={preload}
      onTouchStart={preload}
      onClick={() => setWanted(true)}
    >
      <Burger open={false} />
    </button>
  );
}
