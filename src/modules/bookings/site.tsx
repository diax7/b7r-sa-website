import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/shared/container';
import { Section } from '@/components/shared/section';
import { SectionHeader } from '@/components/shared/section-header';
import { copyFor } from '@/content/copy';
import type { BookingSettings } from '@/content/schema';
import { getSeo, getSiteSettings } from '@/lib/cms';
import { siteLocales } from '@/lib/cms/locales';
import { env, siteBase } from '@/lib/env';
import { type Locale, localePath } from '@/lib/i18n';
import { riyadh } from '@/lib/riyadh';
import { whatsappUrl } from '@/lib/utm';
import { JsonLd, jsonLd } from '@/modules/core';
import { CtaRibbon } from '@/modules/core/cta-ribbon';
import { pageMetadata } from '@/modules/core/seo/metadata';
import { BookingLoader, ManageLoader } from '@/modules/bookings/booker/loader';
import { bookerCopy, bookerSettings } from '@/modules/bookings/booker/props';
import { BookerStandIn } from '@/modules/bookings/booker/stand-in';
import { getBooking } from '@/modules/bookings/read';

/**
 * The booker as the page and the contact card mount it (ADR-063): the island over its
 * server-rendered stand-in, at once on `/book` (the card is the hero) and near the viewport
 * in the contact card (`inline`, with the card's own title as the header row's heading).
 * Only while the switch is on: the contact card shows its WhatsApp button otherwise, and
 * `/book` is a 404.
 */
export async function Booker({
  locale,
  settings,
  page,
  mode,
  heading,
}: {
  locale: Locale;
  settings: BookingSettings;
  page: string;
  mode: 'page' | 'inline';
  heading?: string;
}) {
  const site = await getSiteSettings(locale);
  const copy = bookerCopy(locale);
  const whatsappHref = whatsappUrl(site.contact.whatsapp, copy.booking.whatsappMessage);
  const booker = bookerSettings(settings);
  const now = riyadh(new Date());
  return (
    <BookingLoader
      locale={locale}
      copy={copy}
      settings={booker}
      mode={mode}
      {...(heading ? { heading } : {})}
      turnstileSiteKey={env.turnstileSiteKey}
      whatsappHref={whatsappHref}
      page={page}
      eager={mode === 'page'}
      fallback={
        <BookerStandIn
          mode={mode}
          copy={copy}
          settings={booker}
          {...(heading ? { heading } : {})}
          month={now.monthKey}
          today={now.dateKey}
        />
      }
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

/**
 * `/book` (BRD 4.19): the H1 and the lead from the bank, the booker as the hero, the
 * ribbon; a 404 while the switch is off (the page is out of the sitemap then, and the
 * contact card keeps the WhatsApp way). The manage page stays: a booking made before the
 * switch went off keeps its link.
 */
export async function BookPage({ locale }: { locale: Locale }) {
  const [settings, seo] = await Promise.all([getBooking(locale), bookSeo(locale)]);
  if (!settings.enabled) notFound();
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
          <div className="mx-auto w-full max-w-[1000px]" data-book-card="">
            <Booker
              locale={locale}
              settings={settings}
              page={localePath(locale, '/book')}
              mode="page"
            />
          </div>
        </Container>
      </Section>
      <CtaRibbon locale={locale} page="book" />
    </>
  );
}

/** `/book/manage?token=`: the H1 and the island that reads the booking by its token. */
export async function ManagePage({ locale }: { locale: Locale }) {
  const [settings, site] = await Promise.all([getBooking(locale), getSiteSettings(locale)]);
  const copy = bookerCopy(locale);
  const booker = bookerSettings(settings);
  const now = riyadh(new Date());
  return (
    <Section tone="surface" className="pt-10 md:pt-16" aria-labelledby="manage-title">
      <Container className="flex flex-col gap-10">
        <SectionHeader
          as="h1"
          id="manage-title"
          title={copy.booking.manageTitle}
          lead={copy.booking.manageLead}
        />
        <div className="mx-auto w-full max-w-[1000px]" data-manage-card="">
          <ManageLoader
            locale={locale}
            copy={copy}
            settings={booker}
            whatsappHref={whatsappUrl(site.contact.whatsapp, copy.booking.whatsappMessage)}
            fallback={
              <BookerStandIn
                mode="reschedule"
                copy={copy}
                settings={booker}
                month={now.monthKey}
                today={now.dateKey}
              />
            }
          />
        </div>
      </Container>
    </Section>
  );
}

/** `/book`: the search row of the fixed page; a 404 while the switch is off, like the page. */
export async function bookMetadata(locale: Locale): Promise<Metadata> {
  const [seo, site, locales, settings] = await Promise.all([
    bookSeo(locale),
    getSiteSettings(locale),
    siteLocales(),
    getBooking(locale),
  ]);
  if (!settings.enabled) notFound();
  return pageMetadata({
    locale,
    route: '/book',
    locales,
    siteName: site.brandName,
    title: seo.title,
    description: seo.description,
    ...(seo.ogImage ? { ogImage: seo.ogImage } : {}),
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
