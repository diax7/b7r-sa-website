import Script from 'next/script';
import type { ReactNode } from 'react';
import { preload } from 'react-dom';
import type { Navigation, SiteSettings } from '@/content/schema';
import { env } from '@/lib/env';
import { Footer, Header, newsletterCopy, SkipLink } from '@/modules/core';
import { PageExtras } from '@/modules/core/page-extras';
import { NewsletterForm } from '@/modules/forms';
import '@/styles/globals.css';

// Consent Mode v2 (BRD 6.16): every storage category is denied before any vendor script.
const CONSENT_DEFAULT =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});";

const FONT_WEIGHTS = ['Regular', 'Medium', 'Bold'] as const;

interface SiteDocumentProps {
  /** Rendered above the header (the draft-mode bar, ADR-039). */
  banner?: ReactNode;
  site: SiteSettings;
  navigation: Navigation;
  children: ReactNode;
}

/**
 * The whole HTML document of a public page (BRD 6.1): `<html lang="ar" dir="rtl">`, font
 * preloads, skip link, header, main, footer, then the WhatsApp widget, consent card and
 * analytics scripts. Shared by the site root layout and the global 404, which Next renders
 * outside any layout (ADR-024).
 */
export function SiteDocument({ site, navigation, banner, children }: SiteDocumentProps) {
  // Browsers fetch a weight as soon as any text in the document uses it, so the three weights
  // present on every page (body, nav/buttons, H2s) are preloaded together; the home page adds
  // Black for its H1 (ADR-010). `preload()` emits one deduplicated <link> per font, where a
  // literal <link rel="preload"> in a server component is emitted twice by React.
  for (const weight of FONT_WEIGHTS) {
    preload(`/fonts/ITFRayatRound-${weight}.woff2`, {
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    });
  }
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta httpEquiv="content-language" content="ar" />
        {/* Marks JS as running so scroll-reveal may hide content; without it nothing hides. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        {env.gaId && (
          <script id="consent-default" dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT }} />
        )}
      </head>
      <body className="relative min-h-svh">
        <SkipLink label={navigation.skipLinkLabel} />
        {banner}
        <Header navigation={navigation} site={site} />
        <main id="content" className="relative">
          {children}
        </main>
        <Footer
          newsletter={<NewsletterForm copy={newsletterCopy} />}
          navigation={navigation}
          site={site}
        />
        <PageExtras gaId={env.gaId} whatsapp={site.contact.whatsapp} />
        {env.umami && (
          <Script src={env.umami.src} data-website-id={env.umami.id} strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
