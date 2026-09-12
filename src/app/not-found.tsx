import type { Metadata } from 'next';
import { notFoundPage } from '@/content/pages';
import { StatusPage } from '@/modules/core';

export const metadata: Metadata = {
  title: notFoundPage.title,
  robots: { index: false, follow: false },
};

/** BRD 4.15 / 6.13. Next returns HTTP 404 for this route; no ribbon. */
export default function NotFound() {
  return (
    <StatusPage title={notFoundPage.title} text={notFoundPage.text} button={notFoundPage.button} />
  );
}
