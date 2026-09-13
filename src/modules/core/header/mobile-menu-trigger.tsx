'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { Navigation, SiteSettings } from '@/content/schema';
import messages from '@/messages/ar.json';
import { Burger, burgerButtonClass } from '@/modules/core/header/burger';

const MobileMenu = dynamic(
  () => import('@/modules/core/header/mobile-menu').then((m) => m.MobileMenu),
  {
    ssr: false,
    // Keeps the control in place (and the X state visible) while the sheet chunk downloads.
    loading: () => (
      <button
        type="button"
        className={burgerButtonClass}
        aria-label={messages.a11y.loading}
        disabled
      >
        <Burger open />
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
}: {
  pathname: string;
  navigation: Navigation;
  site: SiteSettings;
}) {
  const [wanted, setWanted] = useState(false);

  if (wanted)
    return <MobileMenu pathname={pathname} navigation={navigation} site={site} autoOpen />;

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
