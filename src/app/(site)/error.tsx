'use client';

import { useEffect } from 'react';
import { ERROR_PAGE } from '@/content/copy/error-page';
// Error pages must render without the database: the seed is the static fallback (ADR-026).
import { navigation } from '@/content/seed/navigation';
import { site } from '@/content/seed/site';
import { StatusPage } from '@/modules/core';

const copy = ERROR_PAGE.ar;

/** Route error boundary (BRD 8.11). Same design as the 404 plus the WhatsApp line. */
export default function ErrorBoundary({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StatusPage
      title={copy.title}
      text={copy.text}
      button={copy.button}
      home="/"
      whatsapp={{ number: site.contact.whatsapp, label: navigation.menuWhatsappLine }}
    />
  );
}
