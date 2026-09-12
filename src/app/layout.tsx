import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Footer, Header, SkipLink } from '@/modules/core';
import { rootMetadata } from '@/modules/core/seo/metadata';
import { BRAND_PRIMARY_HEX } from '@/lib/tokens';
import '@/styles/globals.css';

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: BRAND_PRIMARY_HEX,
};

/**
 * Global shell (BRD 6.1): `<html lang="ar" dir="rtl">`, font preloads, skip link, header,
 * main, footer. The CTA ribbon is rendered by each page just before the footer.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta httpEquiv="content-language" content="ar" />
        <link
          rel="preload"
          href="/fonts/ITFRayatRound-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Medium sets the nav, buttons and labels on every page. Bold (H2s) is below the fold on
            the home page and loads on demand; pages whose H1 is Bold preload it themselves. */}
        <link
          rel="preload"
          href="/fonts/ITFRayatRound-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Marks JS as running so scroll-reveal may hide content; without it nothing hides. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
      </head>
      <body className="relative min-h-svh">
        <SkipLink />
        <Header />
        <main id="content" className="relative">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
