import 'server-only';
import { cache } from 'react';
import {
  FAQ_GROUPS,
  type FaqItem,
  type Home,
  type Integration,
  type Testimonial,
} from '@/content/schema';
import { toFaq, toHome, toIntegration, toTestimonial } from '@/lib/cms/mappers';
import { cms, PUBLIC_READ, PUBLISHED } from '@/lib/cms/payload';

/**
 * Home-page content reads (BRD 9.6, ADR-030): the `home` global and the three small
 * collections it lists. One read per render (`React.cache`); pages revalidate on the timer
 * and on publish.
 */

/** The published `home` global as the `Home` contract; the strip order comes as slugs. */
export const getHome = cache(async (): Promise<Home> => {
  const payload = await cms();
  return toHome(await payload.findGlobal({ slug: 'home', ...PUBLIC_READ, depth: 1 }));
});

const groupIndex = (group: FaqItem['group']) => FAQ_GROUPS.indexOf(group);

/** Every FAQ entry, in group order then the entry's own order (BRD Appendix D). */
export const getFaqs = cache(async (): Promise<FaqItem[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: 'faqs',
    ...PUBLIC_READ,
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
export async function getHomeFaqs(): Promise<FaqItem[]> {
  return (await getFaqs())
    .filter((f) => f.showOnHome)
    .toSorted((a, b) => (a.homeOrder ?? 99) - (b.homeOrder ?? 99) || a.order - b.order);
}

/** Published testimonials in display order (ADR-013 decides whether the section shows). */
export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: 'testimonials',
    ...PUBLIC_READ,
    where: PUBLISHED,
    depth: 1,
    limit: 50,
    pagination: false,
    sort: 'order',
  });
  return docs.map(toTestimonial);
});

/** Integration tiles in display order. */
export const getIntegrations = cache(async (): Promise<Integration[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: 'integrations',
    ...PUBLIC_READ,
    depth: 0,
    limit: 20,
    pagination: false,
    sort: 'order',
  });
  return docs.map(toIntegration);
});
