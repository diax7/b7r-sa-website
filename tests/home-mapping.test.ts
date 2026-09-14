import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { faq } from '@/content/seed/faq';
import { home } from '@/content/seed/home';
import { integrations } from '@/content/seed/integrations';
import { testimonials } from '@/content/seed/testimonials';
import { toFaq, toHome, toIntegration, toTestimonial } from '@/lib/cms/mappers';
import { homeFlagProblem, HOME_FAQ_LIMIT } from '@/modules/cms/collections/faqs';
import { alternateTones } from '@/modules/home/tones';
import type {
  Faq as FaqDoc,
  Home as HomeDoc,
  Integration as IntegrationDoc,
  Media,
  Product as ProductDoc,
  Testimonial as TestimonialDoc,
} from '@/payload-types';

const SERVER = 'http://localhost:3004';
const ids = new Map<string, number>();

// Same-host media comes back as a site path (ADR-029): the mappers read the origin from the env.
beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', SERVER));
afterEach(() => vi.unstubAllEnvs());

/** A populated media doc whose URL is the seed path served by Payload. */
function media(publicPath: string, alt = 'صورة'): Media {
  const id = ids.get(publicPath) ?? ids.size + 1;
  ids.set(publicPath, id);
  return {
    id,
    alt,
    url: `${SERVER}/api/payload/media/file/${publicPath.slice(1)}`,
    updatedAt: '',
    createdAt: '',
  };
}

const product = (slug: string, id: number) => ({ id, slug }) as ProductDoc;

/** The seed `home` as Payload returns the published global at depth 1 with local storage. */
function homeDoc(overrides: Partial<HomeDoc> = {}): HomeDoc {
  return {
    id: 1,
    hero: {
      slides: home.hero.slides.map((s, i) => ({
        id: `row-${i}`,
        headline: s.headline,
        subline: s.subline,
        imageDesktop: media(s.imageDesktop, s.alt),
        imageMobile: media(s.imageMobile, s.alt),
      })),
      primaryCta: home.hero.primaryCta,
      secondaryCta: home.hero.secondaryCta,
      microcopy: home.hero.microcopy,
      chips: home.hero.chips.map((text) => ({ text })),
      overlay: home.hero.overlay,
    },
    productStrip: {
      eyebrow: home.productStrip.eyebrow,
      title: home.productStrip.title,
      lead: home.productStrip.lead,
      pricePrefix: home.productStrip.pricePrefix,
      button: home.productStrip.button,
      products: home.productStrip.order.map((slug, i) => product(slug, i + 1)),
    },
    designer: home.designer,
    steps: {
      eyebrow: home.steps.eyebrow,
      title: home.steps.title,
      link: home.steps.link,
      items: home.steps.items.map((s) => ({ title: s.title, text: s.text, icon: media(s.icon) })),
    },
    video: home.video,
    whyUs: home.whyUs,
    testimonials: home.testimonials,
    integrations: home.integrations,
    faq: home.faq,
    ribbon: home.ribbon,
    _status: 'published',
    ...overrides,
  };
}

describe('toHome', () => {
  it('round-trips the seed: media as same-host paths, the strip as slugs, alt from the photo', () => {
    const mapped = toHome(homeDoc());
    expect(mapped.productStrip.order).toEqual(home.productStrip.order);
    expect(mapped.hero.slides[0]?.imageDesktop).toBe(
      '/api/payload/media/file/images/hero/set-a-desktop.jpg',
    );
    expect(mapped.hero.slides[0]?.alt).toBe(home.hero.slides[0]?.alt);
    expect(mapped.hero.slides.map((s) => s.id)).toEqual(['row-0', 'row-1', 'row-2', 'row-3']);
    expect(mapped.steps.items.map((s) => s.order)).toEqual([1, 2, 3]);
    expect(mapped.steps.items[2]?.icon).toMatch(/printer-print\.jpg$/);
    expect(mapped.whyUs).toEqual(home.whyUs);
    expect(mapped.ribbon).toEqual(home.ribbon);
    expect(mapped.video.enabled).toBe(true);
  });

  it('renders zero to six chips and hides a row with no text in this language (ADR-044)', () => {
    const doc = homeDoc();
    expect(toHome({ ...doc, hero: { ...doc.hero, chips: [] } }).hero.chips).toEqual([]);
    expect(toHome({ ...doc, hero: { ...doc.hero, chips: null } }).hero.chips).toEqual([]);
    // The rows are shared by both languages; a row written on the Arabic tab has no English
    // text yet and must not throw for the English document.
    const chips = [
      { text: 'a' },
      { text: '' },
      { text: null },
      { text: 'b' },
    ] as unknown as NonNullable<HomeDoc['hero']['chips']>;
    expect(toHome({ ...doc, hero: { ...doc.hero, chips } }).hero.chips).toEqual(['a', 'b']);
    const seven = Array.from({ length: 7 }, (_, i) => ({ text: `c${i}` }));
    expect(() => toHome({ ...doc, hero: { ...doc.hero, chips: seven } })).toThrow();
  });

  it('reads the overlay with the defaults a row seeded before it carries (ADR-044)', () => {
    const doc = homeDoc();
    expect(toHome(doc).hero.overlay).toEqual({ enabled: true, color: '#ffffff' });
    // A row seeded before the field: the columns read back with their defaults, or absent
    // on a document a test hands in directly.
    const { overlay: _seeded, ...hero } = doc.hero;
    expect(toHome({ ...doc, hero: hero as HomeDoc['hero'] }).hero.overlay).toEqual({
      enabled: true,
      color: '#ffffff',
    });
    expect(
      toHome({ ...doc, hero: { ...doc.hero, overlay: { enabled: false, color: '#0A2F5E' } } }).hero
        .overlay,
    ).toEqual({ enabled: false, color: '#0A2F5E' });
    expect(() =>
      toHome({ ...doc, hero: { ...doc.hero, overlay: { enabled: true, color: 'white' } } }),
    ).toThrow();
  });

  it('treats a missing «enabled» as on (the checkbox default)', () => {
    const doc = homeDoc();
    const mapped = toHome({ ...doc, video: { title: 'a', lead: 'b' } });
    expect(mapped.video).toEqual({ enabled: true, title: 'a', lead: 'b' });
    expect(toHome({ ...doc, whyUs: { ...doc.whyUs, enabled: false } }).whyUs.enabled).toBe(false);
  });

  it('refuses a home that was never published', () => {
    expect(() => toHome(homeDoc({ _status: 'draft' }))).toThrow(/not published/);
  });

  it('fails loudly on a depth-0 read (ids instead of documents)', () => {
    const doc = homeDoc();
    expect(() =>
      toHome({ ...doc, productStrip: { ...doc.productStrip, products: [1, 2, 3, 4, 5] } }),
    ).toThrow(/products\[0\]: not populated/);
    const slides = doc.hero.slides.map((s, i) => (i === 1 ? { ...s, imageMobile: 7 } : s));
    expect(() => toHome({ ...doc, hero: { ...doc.hero, slides } })).toThrow(
      /slides\[1\]\.imageMobile: no media/,
    );
  });

  it('rejects a document that breaks the contract (three slides, an unknown icon)', () => {
    const doc = homeDoc();
    expect(() =>
      toHome({ ...doc, hero: { ...doc.hero, slides: doc.hero.slides.slice(0, 3) } }),
    ).toThrow();
    const items = doc.whyUs.items.map((i) => ({ ...i, icon: 'Star' as 'Zap' }));
    expect(() => toHome({ ...doc, whyUs: { ...doc.whyUs, items } })).toThrow();
  });
});

describe('faqs', () => {
  const first = faq[0]!;
  const faqDoc = (overrides: Partial<FaqDoc> = {}): FaqDoc => ({
    id: 1,
    question: first.question,
    answer: first.answer,
    group: first.group,
    order: first.order,
    showOnHome: first.showOnHome,
    homeOrder: first.homeOrder ?? null,
    updatedAt: '',
    createdAt: '',
    ...overrides,
  });

  it('maps an entry and drops the home order when the entry is off the home page', () => {
    expect(toFaq(faqDoc())).toEqual(first);
    expect(toFaq(faqDoc({ showOnHome: false, homeOrder: 3 }))).not.toHaveProperty('homeOrder');
    expect(toFaq(faqDoc({ showOnHome: null }))).toMatchObject({ showOnHome: false });
  });

  it(`refuses a ${HOME_FAQ_LIMIT + 1}th «show on home» and nothing else`, () => {
    expect(homeFlagProblem(true, HOME_FAQ_LIMIT)).toMatch(/at most/);
    expect(homeFlagProblem(true, HOME_FAQ_LIMIT - 1)).toBeNull();
    expect(homeFlagProblem(false, 99)).toBeNull();
  });
});

describe('testimonials and integrations', () => {
  it('maps a testimonial with or without an avatar', () => {
    const t = testimonials[0]!;
    const doc: TestimonialDoc = {
      id: 1,
      quote: t.quote,
      name: t.name,
      store: t.store,
      avatar: null,
      order: 1,
      placeholder: true,
      updatedAt: '',
      createdAt: '',
      _status: 'published',
    };
    expect(toTestimonial(doc)).toEqual(t);
    expect(toTestimonial({ ...doc, avatar: media('/media/sara.jpg'), placeholder: null })).toEqual({
      ...t,
      avatar: '/api/payload/media/file/media/sara.jpg',
      placeholder: false,
    });
  });

  it('derives the brand logo from the platform', () => {
    const salla = integrations[0]!;
    const doc: IntegrationDoc = {
      id: 1,
      platform: 'salla',
      order: 1,
      name: salla.name,
      nameLatin: salla.nameLatin,
      updatedAt: '',
      createdAt: '',
    };
    expect(toIntegration(doc)).toEqual(salla);
    expect(toIntegration({ ...doc, platform: 'zid' }).logo).toBe('/images/integrations/zid.svg');
  });
});

describe('alternateTones (BRD 3.4)', () => {
  it('alternates over the rendered sections only and skips the hidden ones', () => {
    expect(alternateTones({ a: true, b: true, c: true }, 'surface')).toEqual({
      a: 'ground',
      b: 'surface',
      c: 'ground',
    });
    expect(
      alternateTones({ video: false, whyUs: true, testimonials: false, faq: true }, 'surface'),
    ).toEqual({
      video: 'surface',
      whyUs: 'ground',
      testimonials: 'ground',
      faq: 'surface',
    });
  });
});
