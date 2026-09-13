'use client';

import { useEffect } from 'react';
import { errorPage } from '@/content/pages';
// Error pages must render without the database: the seed is the static fallback (ADR-026).
import { navigation } from '@/content/seed/navigation';
import { site } from '@/content/seed/site';
import { StatusPage } from '@/modules/core';

/** Route error boundary (BRD 8.11). Same design as the 404 plus the WhatsApp line. */
export default function ErrorBoundary({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StatusPage
      title={errorPage.title}
      text={errorPage.text}
      button={errorPage.button}
      whatsapp={{ number: site.contact.whatsapp, label: navigation.menuWhatsappLine }}
    />
  );
}
