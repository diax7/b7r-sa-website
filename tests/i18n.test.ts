import { describe, expect, it, vi } from 'vitest';
import { inLocale, publicRead } from '@/lib/cms/read';
import {
  htmlDir,
  isLocale,
  languageTag,
  localePath,
  LOCALES,
  ogLocale,
  otherLocale,
  stripLocale,
} from '@/lib/i18n';
import { pageMetadata } from '@/modules/core/seo/metadata';

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
    // The feed is still announced from every page.
    expect(single.alternates?.types).toEqual({ 'application/rss+xml': '/feed.xml' });
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
});
