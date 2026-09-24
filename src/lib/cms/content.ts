import 'server-only';
import { cache } from 'react';
import {
  FAQ_GROUPS,
  type FaqItem,
  type Home,
  type Integration,
  type Page,
  type Testimonial,
} from '@/content/schema';
import { toFaq, toHome, toIntegration, toPage, toTestimonial } from '@/lib/cms/mappers';
import { cms, inLocale, publicRead } from '@/lib/cms/payload';
import { readsDrafts, versionedRead } from '@/lib/cms/read-mode';
import type { Locale } from '@/lib/i18n';
import { getAppearance, surfaceKeys } from '@/modules/brand';

/**
 * The background sets a section may paint (spec 010, phase 2): a section naming a set that
 * was deleted keeps its own background. Read once per render, from the same read as the head.
 */
const backgrounds = cache(
  async (): Promise<ReadonlySet<string>> => new Set(surfaceKeys((await getAppearance()).surfaces)),
);

/**
 * Home-page content reads (BRD 9.6, ADR-030): the `home` global and the three small
 * collections it lists. One read per render (`React.cache`); pages revalidate on the timer
 * and on publish.
 */

/**
 * The `home` global as the `Home` contract; the strip order comes as slugs. Published, or the
 * latest draft when the request is a preview (ADR-039).
 */
export const getHome = cache(async (locale: Locale): Promise<Home> => {
  const payload = await cms();
  const draft = await readsDrafts();
  const doc = await payload.findGlobal({ slug: 'home', ...publicRead(locale), draft, depth: 1 });
  return toHome(doc, { draft, backgrounds: await backgrounds() });
});

const groupIndex = (group: FaqItem['group']) => FAQ_GROUPS.indexOf(group);

/** Every FAQ entry, in group order then the entry's own order (BRD Appendix D). */
export const getFaqs = cache(async (locale: Locale): Promise<FaqItem[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: 'faqs',
    ...publicRead(locale),
    where: inLocale('question'),
    depth: 0,
    limit: 200,
    pagination: false,
    sort: 'order',
  });
  return docs
    .map(toFaq)
    .toSorted((a, b) => groupIndex(a.group) - groupIndex(b.group) || a.order - b.order);
});

/** The entries flagged for the home accordion, in their home order (at most five). */
export async function getHomeFaqs(locale: Locale): Promise<FaqItem[]> {
  return (await getFaqs(locale))
    .filter((f) => f.showOnHome)
    .toSorted((a, b) => (a.homeOrder ?? 99) - (b.homeOrder ?? 99) || a.order - b.order);
}

/** Published testimonials in display order (ADR-013 decides whether the section shows). */
export const getTestimonials = cache(async (locale: Locale): Promise<Testimonial[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: 'testimonials',
    ...publicRead(locale),
    ...(await versionedRead('quote')),
    depth: 1,
    limit: 50,
    pagination: false,
    sort: 'order',
  });
  return docs.map(toTestimonial);
});

/** Integration tiles in display order. */
export const getIntegrations = cache(async (locale: Locale): Promise<Integration[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: 'integrations',
    ...publicRead(locale),
    where: inLocale('name'),
    depth: 0,
    limit: 20,
    pagination: false,
    sort: 'order',
  });
  return docs.map(toIntegration);
});

/**
 * Published pages, newest first; `depth: 1` populates the block media and the OG image. In a
 * preview request the drafts come back instead, unfiltered.
 */
export const getPages = cache(async (locale: Locale): Promise<Page[]> => {
  const payload = await cms();
  const read = await versionedRead('title');
  const { docs } = await payload.find({
    collection: 'pages',
    ...publicRead(locale),
    ...read,
    depth: 1,
    limit: 200,
    pagination: false,
    sort: '-updatedAt',
  });
  const known = await backgrounds();
  return docs.map((doc) => toPage(doc, { draft: read.draft, backgrounds: known }));
});

/** One published page by slug, or undefined. */
export async function getPage(locale: Locale, slug: string): Promise<Page | undefined> {
  return (await getPages(locale)).find((p) => p.slug === slug);
}
