import { describe, expect, it, vi } from 'vitest';
import { inLocale, publicRead } from '@/lib/cms/read';
import {
  fallbackPath,
  htmlDir,
  isLocale,
  languageTag,
  localePath,
  LOCALES,
  ogLocale,
  otherLocale,
  requestLocale,
  stripLocale,
} from '@/lib/i18n';
import { defaultOgImage, pageMetadata } from '@/modules/core/seo/metadata';

// `pageMetadata` is pure; the module's other exports read the CMS, which stays out of here.
vi.mock('@/lib/cms', () => ({}));
vi.mock('@/lib/cms/locales', () => ({}));

describe('locales (ADR-043)', () => {
  it('prefixes English paths only, and strips the prefix back', () => {
    expect(LOCALES).toEqual(['ar', 'en']);
    expect(localePath('ar', '/')).toBe('/');
    expect(localePath('ar', '/products/hoodie')).toBe('/products/hoodie');
    expect(localePath('en', '/')).toBe('/en');
    expect(localePath('en', '/products/hoodie')).toBe('/en/products/hoodie');
    expect(stripLocale('/en')).toEqual({ locale: 'en', path: '/' });
    expect(stripLocale('/en/faq')).toEqual({ locale: 'en', path: '/faq' });
    expect(stripLocale('/english')).toEqual({ locale: 'ar', path: '/english' });
    expect(stripLocale('/')).toEqual({ locale: 'ar', path: '/' });
  });

  it('sends a page without a twin to its section in the other language (ADR-044)', () => {
    expect(fallbackPath('en', '/blog/arabic-only-post')).toBe('/en/blog');
    expect(fallbackPath('ar', '/blog/english-only-post')).toBe('/blog');
    expect(fallbackPath('en', '/blog/category/pricing-profit/page/2')).toBe('/en/blog');
    expect(fallbackPath('en', '/author/dhia')).toBe('/en/blog');
    expect(fallbackPath('en', '/products/arabic-only')).toBe('/en/products');
    expect(fallbackPath('en', '/some-page')).toBe('/en');
    expect(fallbackPath('ar', '/')).toBe('/');
  });

  it('knows the other locale, the direction and the language tags', () => {
    expect(otherLocale('ar')).toBe('en');
    expect(otherLocale('en')).toBe('ar');
    expect(htmlDir('ar')).toBe('rtl');
    expect(htmlDir('en')).toBe('ltr');
    expect(ogLocale('ar')).toBe('ar_SA');
    expect(ogLocale('en')).toBe('en_US');
    expect(languageTag('ar')).toBe('ar');
    expect(languageTag('en')).toBe('en');
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(requestLocale('en')).toBe('en');
    expect(requestLocale(['ar', 'en'])).toBe('ar');
    expect(requestLocale(undefined)).toBe('ar');
  });
});

describe('public reads (BRD 9.6, ADR-043)', () => {
  it('never fall back to the other language and read published documents only', () => {
    expect(publicRead('en')).toEqual({
      locale: 'en',
      fallbackLocale: false,
      draft: false,
      overrideAccess: true,
    });
    expect(publicRead('ar').locale).toBe('ar');
  });

  it('gate a document on a non-empty title-like value in the request locale', () => {
    expect(inLocale('title')).toEqual({
      and: [{ title: { exists: true } }, { title: { not_equals: '' } }],
    });
  });
});

const ogImages = (m: ReturnType<typeof pageMetadata>) =>
  (m.openGraph as { images: Array<{ url: string; width: number; height: number }> }).images;
const ogImage = (m: ReturnType<typeof pageMetadata>) => ogImages(m)[0]?.url;

describe('page metadata (BRD 7.3, ADR-043)', () => {
  const base = {
    route: '/products/hoodie',
    siteName: 'B7R Print',
    title: 'Hoodie',
    description: 'A warm hoodie.',
  };

  it('pairs the languages with x-default on the Arabic when both twins exist', () => {
    const en = pageMetadata({ ...base, locale: 'en', locales: ['ar', 'en'] });
    expect(en.alternates?.canonical).toBe('/en/products/hoodie');
    expect(en.alternates?.languages).toEqual({
      ar: '/products/hoodie',
      en: '/en/products/hoodie',
      'x-default': '/products/hoodie',
    });
    const og = en.openGraph as { locale: string; alternateLocale: string[]; url: string };
    expect(og.locale).toBe('en_US');
    expect(og.alternateLocale).toEqual(['ar_SA']);
    expect(og.url).toBe('/en/products/hoodie');
    const ar = pageMetadata({ ...base, locale: 'ar', locales: ['ar', 'en'] });
    expect(ar.alternates?.canonical).toBe('/products/hoodie');
    expect(ar.alternates?.languages).toEqual(en.alternates?.languages);
    expect((ar.openGraph as { locale: string }).locale).toBe('ar_SA');
  });

  it('emits no pair for a document that exists in one language only', () => {
    const single = pageMetadata({ ...base, locale: 'ar', locales: ['ar'] });
    expect(single.alternates?.canonical).toBe('/products/hoodie');
    expect(single.alternates?.languages).toBeUndefined();
    expect((single.openGraph as { alternateLocale?: unknown }).alternateLocale).toBeUndefined();
    // The language's feed is announced from every page.
    expect(single.alternates?.types).toEqual({ 'application/rss+xml': '/feed.xml' });
    const english = pageMetadata({ ...base, locale: 'en', locales: ['ar', 'en'] });
    expect(english.alternates?.types).toEqual({ 'application/rss+xml': '/en/feed.xml' });
  });

  it('keeps the article dates and the author link under the page locale', () => {
    const post = pageMetadata({
      ...base,
      locale: 'en',
      locales: ['ar', 'en'],
      route: '/blog/first-post',
      ogType: 'article',
      publishedTime: '2026-09-01',
      modifiedTime: '2026-09-10',
    });
    const og = post.openGraph as {
      type: string;
      publishedTime: string;
      modifiedTime: string;
      authors: string[];
    };
    expect(og.type).toBe('article');
    expect(og.publishedTime).toBe('2026-09-01');
    expect(og.modifiedTime).toBe('2026-09-10');
    expect(og.authors[0]).toMatch(/\/en\/about$/);
  });

  it('takes the default Open Graph image of the language (ADR-043)', () => {
    expect(ogImage(pageMetadata({ ...base, locale: 'ar', locales: ['ar'] }))).toBe(
      '/og/default.png',
    );
    expect(ogImage(pageMetadata({ ...base, locale: 'en', locales: ['ar', 'en'] }))).toBe(
      '/og/en/default.png',
    );
    expect(defaultOgImage('en')).toBe('/og/en/default.png');
  });

  it('declares the real size of a CMS image and 1200×630 for a render (site audit 2026-09-18)', () => {
    expect(
      ogImages(
        pageMetadata({
          ...base,
          locale: 'ar',
          locales: ['ar'],
          ogImage: { url: '/media/cover.jpg', width: 1600, height: 900 },
        }),
      ),
    ).toEqual([{ url: '/media/cover.jpg', width: 1600, height: 900 }]);
    expect(
      ogImages(
        pageMetadata({
          ...base,
          locale: 'ar',
          locales: ['ar'],
          ogImage: '/og/products/hoodie.png',
        }),
      ),
    ).toEqual([{ url: '/og/products/hoodie.png', width: 1200, height: 630 }]);
    // A CMS image without a recorded size keeps the default's dimensions rather than none.
    expect(
      ogImages(
        pageMetadata({ ...base, locale: 'ar', locales: ['ar'], ogImage: { url: '/media/x.jpg' } }),
      ),
    ).toEqual([{ url: '/media/x.jpg', width: 1200, height: 630 }]);
  });
});
