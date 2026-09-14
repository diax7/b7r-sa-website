'use client';

import Link from 'next/link';
import { ERROR_PAGE } from '@/content/copy/error-page';
import '@/styles/globals.css';

const ar = ERROR_PAGE.ar;
const en = ERROR_PAGE.en;

/** Root error boundary: must render its own <html>/<body>, in both languages (BRD 8.11). */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  console.error(error);
  return (
    <html lang="ar" dir="rtl">
      <body className="grid min-h-svh place-items-center bg-surface px-6 text-center text-text">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-h1">{ar.title}</h1>
          <p className="lead text-text-muted">{ar.text}</p>
          <Link
            href="/"
            className="mt-2 inline-flex h-13 items-center rounded-base bg-primary px-7 font-medium text-white"
          >
            {ar.button}
          </Link>
          <p lang="en" dir="ltr" className="mt-6 text-small text-text-muted">
            {en.title}. {en.text}{' '}
            <Link href="/en" hrefLang="en" className="font-medium text-primary">
              {en.button}
            </Link>
          </p>
        </div>
      </body>
    </html>
  );
}
