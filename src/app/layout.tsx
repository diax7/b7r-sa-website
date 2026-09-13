import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';
import { env } from '@/lib/env';
import { BRAND_PRIMARY_HEX } from '@/lib/tokens';
import { Footer, Header, newsletterCopy, SkipLink } from '@/modules/core';
import { NewsletterForm } from '@/modules/forms';
import { PageExtras } from '@/modules/core/page-extras';
import { rootMetadata } from '@/modules/core/seo/metadata';
import '@/styles/globals.css';

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: BRAND_PRIMARY_HEX,
};

// Consent Mode v2 (BRD 6.16): every storage category is denied before any vendor script.
const CONSENT_DEFAULT =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});";

/**
 * Global shell (BRD 6.1): `<html lang="ar" dir="rtl">`, font preloads, skip link, header,
 * main, footer, then the WhatsApp widget, consent card and analytics scripts.
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
        {/* Browsers fetch a weight as soon as any text in the document uses it, so the three
            weights present on every page (body, nav/buttons, H2s) are preloaded together;
            the home page adds Black for its H1 (ADR-010). */}
        <link
          rel="preload"
          href="/fonts/ITFRayatRound-Medium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/ITFRayatRound-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Marks JS as running so scroll-reveal may hide content; without it nothing hides. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        {env.gaId && (
          <script id="consent-default" dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT }} />
        )}
      </head>
      <body className="relative min-h-svh">
        <SkipLink />
        <Header />
        <main id="content" className="relative">
          {children}
        </main>
        <Footer newsletter={<NewsletterForm copy={newsletterCopy} />} />
        <PageExtras gaId={env.gaId} />
        {env.umami && (
          <Script src={env.umami.src} data-website-id={env.umami.id} strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
