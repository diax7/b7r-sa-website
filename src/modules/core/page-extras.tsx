'use client';

import dynamic from 'next/dynamic';
import { AnalyticsBridge } from '@/modules/core/analytics/analytics-bridge';
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
}

/**
 * Everything that must never compete with the first paint (BRD 6.15, 6.16): the analytics
 * bridge is tiny and immediate; the WhatsApp widget mounts after 1.5 s and the consent card
 * after 0.8 s (only when there is a GA id to consent to).
 */
export function PageExtras({ gaId }: PageExtrasProps) {
  return (
    <>
      <AnalyticsBridge gaId={gaId} />
      {gaId && (
        <AfterDelay ms={800}>
          <ConsentBar />
        </AfterDelay>
      )}
      <AfterDelay ms={1500}>
        <WhatsAppWidget />
      </AfterDelay>
    </>
  );
}
