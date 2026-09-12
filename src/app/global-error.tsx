'use client';

import Link from 'next/link';
import { errorPage } from '@/content/pages';
import '@/styles/globals.css';

/** Root error boundary: must render its own <html>/<body> (BRD 8.11). */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  console.error(error);
  return (
    <html lang="ar" dir="rtl">
      <body className="grid min-h-svh place-items-center bg-surface px-6 text-center text-text">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-h1">{errorPage.title}</h1>
          <p className="lead text-text-muted">{errorPage.text}</p>
          <Link
            href="/"
            className="mt-2 inline-flex h-13 items-center rounded-base bg-primary px-7 font-medium text-white"
          >
            {errorPage.button}
          </Link>
        </div>
      </body>
    </html>
  );
}
