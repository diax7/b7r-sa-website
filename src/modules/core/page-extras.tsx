'use client';

import dynamic from 'next/dynamic';
import type { ShellCopy } from '@/content/copy';
import type { Locale } from '@/lib/i18n';
import { AnalyticsBridge } from '@/modules/core/analytics/analytics-bridge';
import { LandingBeacon } from '@/modules/core/analytics/landing-beacon';
import { AfterDelay } from '@/modules/core/lazy-mount';

const WhatsAppWidget = dynamic(
  () => import('@/modules/core/whatsapp-widget').then((m) => m.WhatsAppWidget),
  {
    ssr: false,
  },
);
const ConsentBar = dynamic(() => import('@/modules/core/consent-bar').then((m) => m.ConsentBar), {
  ssr: false,
});

interface PageExtrasProps {
  gaId: string | undefined;
  /** WhatsApp number from site settings. */
  whatsapp: string;
  locale: Locale;
  copy: ShellCopy;
}

/**
 * Everything that must never compete with the first paint (BRD 6.15, 6.16): the analytics
 * bridge and the landing beacon (ADR-048) are tiny and immediate; the WhatsApp widget mounts
 * after 1.5 s and the consent card after 0.8 s (only when there is a GA id to consent to).
 * The 404 shell renders this too, so a dead inbound link is counted with its path.
 */
export function PageExtras({ gaId, whatsapp, locale, copy }: PageExtrasProps) {
  return (
    <>
      <AnalyticsBridge gaId={gaId} />
      <LandingBeacon />
      {gaId && (
        <AfterDelay ms={800}>
          <ConsentBar locale={locale} copy={copy.consent} />
        </AfterDelay>
      )}
      <AfterDelay ms={1500}>
        <WhatsAppWidget number={whatsapp} copy={copy.whatsappWidget} />
      </AfterDelay>
    </>
  );
}
