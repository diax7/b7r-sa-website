import type { Metadata } from 'next';
import { copyFor } from '@/content/copy';
import { StatusPage } from '@/modules/core';

const copy = copyFor('ar');

export const metadata: Metadata = {
  title: copy.notFoundPage.title,
  robots: { index: false, follow: false },
};

/**
 * BRD 4.15 / 6.13: `notFound()` from a page (an unknown product slug). Next answers HTTP 404
 * from a bare document and the client then renders this inside the site layout (ADR-024);
 * unmatched URLs never reach here, they render `global-not-found`. No ribbon.
 */
export default function NotFound() {
  return (
    <StatusPage
      title={copy.notFoundPage.title}
      text={copy.notFoundPage.text}
      button={copy.notFoundPage.button}
      home="/"
    />
  );
}
