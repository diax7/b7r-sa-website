import type { Metadata } from 'next';
import { Button } from '@/components/shared/button';
import { Card } from '@/components/shared/card';
import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { copyFor } from '@/content/copy';
import type { BookingSettings } from '@/content/schema';
import { getSeo, getSiteSettings } from '@/lib/cms';
import { siteLocales } from '@/lib/cms/locales';
import { env, siteBase } from '@/lib/env';
import { type Locale, localePath } from '@/lib/i18n';
import { whatsappUrl } from '@/lib/utm';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
import { pageMetadata } from '@/modules/core/seo/metadata';
import { PickerFallback } from '@/modules/bookings/picker/picker-fallback';
import { BookingLoader, ManageLoader } from '@/modules/bookings/picker/picker-loader';
import { pickerCopy, pickerSettings } from '@/modules/bookings/picker/props';
import { getBooking } from '@/modules/bookings/read';

/**
 * The picker as the pages and the contact card mount it (ADR-062): the island near the
 * viewport over its stand-in, or, with the switch off, the sentence and the WhatsApp button.
 */
export async function BookingPicker({
  locale,
  settings,
  page,
}: {
  locale: Locale;
  settings: BookingSettings;
  page: string;
}) {
  const site = await getSiteSettings(locale);
  const copy = pickerCopy(locale);
  const whatsappHref = whatsappUrl(site.contact.whatsapp, copy.booking.whatsappMessage);
  if (!settings.enabled) {
    return (
      <div className="flex flex-col gap-4" data-booking-picker="off">
        <p className="text-body text-text">{copy.booking.disabled}</p>
        <Button asChild className="self-start" trailingArrow={false}>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener"
            data-track="whatsapp_click"
            data-location="contact"
          >
            {copy.whatsapp}
          </a>
        </Button>
      </div>
    );
  }
  const picker = pickerSettings(settings);
  return (
    <BookingLoader
      locale={locale}
      copy={copy}
      settings={picker}
      turnstileSiteKey={env.turnstileSiteKey}
      whatsappHref={whatsappHref}
      page={page}
      fallback={<PickerFallback copy={copy} settings={picker} />}
    />
  );
}

/**
 * The page's search row (BRD 4.16), or the bank's own title and lead on a database seeded
 * before the row existed (`pnpm content:migrate --force` appends it; until then the page
 * still answers, and stays out of the sitemap, which lists the rows).
 */
async function bookSeo(
  locale: Locale,
): Promise<{ title: string; description: string; ogImage?: string }> {
  try {
    const row = await getSeo(locale, '/book');
    return {
      title: row.title,
      description: row.description,
      ...(row.ogImage ? { ogImage: row.ogImage } : {}),
    };
  } catch {
    const { booking } = copyFor(locale);
    return { title: booking.title, description: booking.lead };
  }
}

/** `/book` (BRD 4.19): the H1 and the lead from the bank, the picker, the ribbon. */
export async function BookPage({ locale }: { locale: Locale }) {
  const [settings, seo] = await Promise.all([getBooking(locale), bookSeo(locale)]);
  const { booking, productsPage } = copyFor(locale);
  const base = siteBase();
  return (
    <>
      <JsonLd
        nodes={[
          jsonLd.webPage(base, locale, '/book', seo.title, seo.description),
          jsonLd.breadcrumbs(base, [
            { name: productsPage.breadcrumbHome, path: localePath(locale, '/') },
            { name: booking.title, path: localePath(locale, '/book') },
          ]),
        ]}
      />
      <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="book-title">
        <Container className="flex flex-col gap-10">
          <SectionHeader as="h1" id="book-title" title={booking.title} lead={booking.lead} />
          <Card className="p-6 md:p-8" radius="lg" data-book-card="">
            <div className="flex flex-col gap-6">
              <p className="text-h4 text-text">{settings.title}</p>
              <BookingPicker
                locale={locale}
                settings={settings}
                page={localePath(locale, '/book')}
              />
            </div>
          </Card>
        </Container>
      </Section>
      <CtaRibbon locale={locale} topTone="surface" page="book" />
    </>
  );
}

/** `/book/manage?token=`: the H1 and the island that reads the booking by its token. */
export async function ManagePage({ locale }: { locale: Locale }) {
  const [settings, site] = await Promise.all([getBooking(locale), getSiteSettings(locale)]);
  const copy = pickerCopy(locale);
  return (
    <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="manage-title">
      <Container className="flex flex-col gap-10">
        <SectionHeader
          as="h1"
          id="manage-title"
          title={copy.booking.manageTitle}
          lead={copy.booking.manageLead}
        />
        <Card className="p-6 md:p-8" radius="lg" data-manage-card="">
          <ManageLoader
            locale={locale}
            copy={copy}
            settings={pickerSettings(settings)}
            whatsappHref={whatsappUrl(site.contact.whatsapp, copy.booking.whatsappMessage)}
            fallback={<p className="text-body text-text-muted">{copy.loading}</p>}
          />
        </Card>
      </Container>
    </Section>
  );
}

/** `/book`: the search row of the fixed page; `noindex` while the switch is off. */
export async function bookMetadata(locale: Locale): Promise<Metadata> {
  const [seo, site, locales, settings] = await Promise.all([
    bookSeo(locale),
    getSiteSettings(locale),
    siteLocales(),
    getBooking(locale),
  ]);
  return pageMetadata({
    locale,
    route: '/book',
    locales,
    siteName: site.brandName,
    title: seo.title,
    description: seo.description,
    ...(seo.ogImage ? { ogImage: seo.ogImage } : {}),
    ...(settings.enabled ? {} : { noindex: true }),
  });
}

/** `/book/manage`: the merchant's own page, never indexed. */
export async function manageMetadata(locale: Locale): Promise<Metadata> {
  const [site, locales] = await Promise.all([getSiteSettings(locale), siteLocales()]);
  const { booking } = copyFor(locale);
  return {
    ...pageMetadata({
      locale,
      route: '/book/manage',
      locales,
      siteName: site.brandName,
      title: booking.manageTitle,
      description: booking.manageLead,
      noindex: true,
    }),
    robots: { index: false, follow: false },
  };
}
