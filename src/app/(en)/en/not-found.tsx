import type { Metadata } from 'next';
import { copyFor } from '@/content/copy';
import { StatusPage } from '@/modules/core';

const copy = copyFor('en');

export const metadata: Metadata = {
  title: copy.notFoundPage.title,
  robots: { index: false, follow: false },
};

/** `notFound()` from an English page (an unknown product slug): the same status page, in English. */
export default function NotFound() {
  return (
    <StatusPage
      title={copy.notFoundPage.title}
      text={copy.notFoundPage.text}
      button={copy.notFoundPage.button}
      home="/en"
    />
  );
}
