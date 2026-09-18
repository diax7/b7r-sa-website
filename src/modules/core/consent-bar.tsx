'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Button } from '@/components/shared/button';
import { useConsentDock } from '@/components/shared/use-bottom-dock';
import type { SiteCopy } from '@/content/copy';
import { readConsent, writeConsent, type Consent } from '@/lib/consent';
import { type Locale, localePath } from '@/lib/i18n';
import { announceConsent } from '@/modules/core/analytics/analytics-bridge';

/**
 * Consent card (BRD 6.16): bottom-end, never blocks scrolling, appears only while no
 * decision cookie exists. On phones it is full-width and sits above the WhatsApp button
 * (88 px); at every width it lifts above a sticky dock, and it publishes its top edge so
 * the WhatsApp panel opens above it rather than over its buttons (`useConsentDock`).
 */
export function ConsentBar({ locale, copy }: { locale: Locale; copy: SiteCopy['consent'] }) {
  // Mounted after a delay by the layout, so the cookie is readable in the initialiser.
  const [visible, setVisible] = useState(() => readConsent() === null);
  const card = useRef<HTMLDivElement>(null);
  useConsentDock(card, visible);
  if (!visible) return null;

  const decide = (value: Consent) => {
    writeConsent(value);
    announceConsent(value);
    setVisible(false);
  };

  return (
    <div
      ref={card}
      role="region"
      aria-label={copy.link}
      data-testid="consent-bar"
      className="fixed inset-x-4 bottom-[calc(88px+var(--bottom-dock,0px))] z-40 flex flex-col gap-4 rounded-base border border-border bg-surface p-4 shadow-popover animate-rise-in motion-reduce:animate-none sm:inset-x-auto sm:end-6 sm:bottom-[calc(24px+var(--bottom-dock,0px))] sm:max-w-[420px]"
    >
      <p className="text-small text-text">{copy.text}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="md" onClick={() => decide('granted')} data-testid="consent-accept">
          {copy.accept}
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={() => decide('denied')}
          data-testid="consent-reject"
        >
          {copy.reject}
        </Button>
        <Link
          href={localePath(locale, '/privacy')}
          prefetch={false}
          className="ms-auto text-small font-medium text-primary hover:underline"
        >
          {copy.link}
        </Link>
      </div>
    </div>
  );
}
