'use client';

import { ERROR_PAGE } from '@/content/copy/error-page';
import '@/styles/globals.css';

const ar = ERROR_PAGE.ar;
const en = ERROR_PAGE.en;

/**
 * Root error boundary: must render its own <html>/<body>, in both languages (BRD 8.11). Plain
 * anchors, not `next/link`: the root has failed, so a full navigation is the way back, and the
 * boundary is its own bundle, where a `Link` costs every page a second copy of the router's
 * link runtime (3 KB gzip; site audit 2026-09-18, item 12).
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  console.error(error);
  return (
    <html lang="ar" dir="rtl">
      <body className="grid min-h-svh place-items-center bg-surface px-6 text-center text-text">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-h1">{ar.title}</h1>
          <p className="lead text-text-muted">{ar.text}</p>
          {/* oxlint-disable-next-line next/no-html-link-for-pages -- the root has failed: a full load is the way back */}
          <a
            href="/"
            className="mt-2 inline-flex h-13 items-center rounded-base bg-primary px-7 font-medium text-white"
          >
            {ar.button}
          </a>
          <p lang="en" dir="ltr" className="mt-6 text-small text-text-muted">
            {en.title}. {en.text}{' '}
            {/* oxlint-disable-next-line next/no-html-link-for-pages -- the root has failed: a full load is the way back */}
            <a href="/en" hrefLang="en" className="font-medium text-primary">
              {en.button}
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
