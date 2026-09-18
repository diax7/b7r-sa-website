import Script from 'next/script';
import type { ReactNode } from 'react';
import { preload } from 'react-dom';
import { SAR_NAME_ID } from '@/components/shared/sar-symbol';
import { copyFor, shellCopy } from '@/content/copy';
import type { Navigation, SiteSettings } from '@/content/schema';
import { htmlDir, languageTag, type Locale } from '@/lib/i18n';
import { Footer, Header, newsletterCopy, SkipLink } from '@/modules/core';
import { PageExtras } from '@/modules/core/page-extras';
import { NewsletterForm } from '@/modules/forms';
import '@/styles/globals.css';

// Consent Mode v2 (BRD 6.16): every storage category is denied before any vendor script.
const CONSENT_DEFAULT =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});";

const FONT_WEIGHTS = ['Regular', 'Medium', 'Bold'] as const;

interface SiteDocumentProps {
  locale: Locale;
  /** The locales the site is in (`siteLocales()`); the header's switch needs the other one. */
  locales: readonly Locale[];
  /** Rendered above the header (the draft-mode bar, ADR-039). */
  banner?: ReactNode;
  site: SiteSettings;
  navigation: Navigation;
  children: ReactNode;
}

/**
 * The whole HTML document of a public page (BRD 6.1, ADR-043): `<html lang dir>` per locale,
 * font preloads, skip link, header, main, footer, then the WhatsApp widget, consent card and
 * analytics scripts. Shared by the two site root layouts and the global 404, which Next
 * renders outside any layout (ADR-024).
 */
export function SiteDocument({
  locale,
  locales,
  site,
  navigation,
  banner,
  children,
}: SiteDocumentProps) {
  const copy = copyFor(locale);
  const shell = shellCopy(locale);
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
    <html lang={languageTag(locale)} dir={htmlDir(locale)}>
      <head>
        <meta httpEquiv="content-language" content={languageTag(locale)} />
        {/* Marks JS as running so scroll-reveal may hide content; without it nothing hides. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        {site.analytics.gaId && (
          <script id="consent-default" dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT }} />
        )}
      </head>
      <body className="relative min-h-svh">
        <span id={SAR_NAME_ID} hidden>
          {copy.media.sarAria}
        </span>
        <SkipLink label={navigation.skipLinkLabel} />
        {banner}
        <Header
          navigation={navigation}
          site={site}
          locale={locale}
          locales={locales}
          copy={shell}
        />
        <main id="content" className="relative">
          {children}
        </main>
        <Footer
          newsletter={<NewsletterForm copy={newsletterCopy(locale)} />}
          navigation={navigation}
          site={site}
          locale={locale}
          copy={copy}
        />
        <PageExtras
          gaId={site.analytics.gaId}
          whatsapp={site.contact.whatsapp}
          locale={locale}
          copy={shell}
        />
        {site.analytics.umami && (
          <Script
            src={site.analytics.umami.src}
            data-website-id={site.analytics.umami.id}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
