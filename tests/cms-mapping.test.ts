import { describe, expect, it } from 'vitest';
import { navigation } from '@/content/seed/navigation';
import { products } from '@/content/seed/products';
import { seo } from '@/content/seed/seo';
import { site } from '@/content/seed/site';
import { mediaUrl, toNavigation, toProduct, toSeoRows, toSiteSettings } from '@/lib/cms/mappers';
import type { Media, Product as ProductDoc, SeoDefault, SiteSetting } from '@/payload-types';

const SERVER = 'http://localhost:3004';

function media(url: string, id = 1): Media {
  return { id, alt: 'صورة', url, updatedAt: '', createdAt: '' };
}

function seedProduct(slug: string) {
  const found = products.find((p) => p.slug === slug);
  if (!found) throw new Error(`seed ${slug} missing`);
  return found;
}
const hoodie = seedProduct('hoodie');

/** The seed hoodie as Payload would return it at depth 1 with local storage. */
function productDoc(overrides: Partial<ProductDoc> = {}): ProductDoc {
  return {
    id: 1,
    name: hoodie.name,
    slug: hoodie.slug,
    shortDescription: hoodie.shortDescription,
    description: hoodie.description,
    baseCost: hoodie.baseCost,
    suggestedPrice: hoodie.suggestedPrice,
    sortOrder: hoodie.sortOrder,
    colors: hoodie.colors.map((c, i) => ({
      slug: c.slug,
      name: c.name,
      hex: c.hex,
      front: media(`${SERVER}/api/payload/media/file/hoodie-${c.slug}-front.jpg`, i * 2 + 1),
      back: c.images.back
        ? media(`${SERVER}/api/payload/media/file/hoodie-${c.slug}-back.jpg`, i * 2 + 2)
        : null,
    })),
    sizes: hoodie.sizes.map((s) => ({
      label: s.label,
      length: s.measurements?.['length'] ?? null,
      chest: s.measurements?.['chest'] ?? null,
      sleeve: s.measurements?.['sleeve'] ?? null,
    })),
    sizesSummary: hoodie.sizesSummary,
    material: hoodie.material,
    weightGrams: hoodie.weightGrams,
    printArea: hoodie.printArea,
    printMethodLabel: hoodie.printMethodLabel,
    updatedAt: '2026-09-13T07:20:32.123Z',
    createdAt: '2026-09-13T07:20:32.123Z',
    _status: 'published',
    ...overrides,
  };
}

describe('mediaUrl (ADR-029)', () => {
  it('keeps same-host media relative so the optimizer accepts it without a remote pattern', () => {
    expect(mediaUrl(media(`${SERVER}/api/payload/media/file/a.jpg`), SERVER)).toBe(
      '/api/payload/media/file/a.jpg',
    );
    expect(mediaUrl(media(`${SERVER}/api/payload/media/file/a.jpg`), `${SERVER}/`)).toBe(
      '/api/payload/media/file/a.jpg',
    );
  });

  it('keeps S3 URLs absolute and ignores unpopulated relations', () => {
    const s3 = 'https://media.b7r.sa/media/a.jpg';
    expect(mediaUrl(media(s3), SERVER)).toBe(s3);
    expect(mediaUrl(3, SERVER)).toBeUndefined();
    expect(mediaUrl(null, SERVER)).toBeUndefined();
    expect(mediaUrl(media(`${SERVER}/x.jpg`), '')).toBe(`${SERVER}/x.jpg`);
  });
});

describe('toProduct', () => {
  it('maps a depth-1 document onto the content contract, dates to YYYY-MM-DD', () => {
    const product = toProduct(productDoc());
    expect(product.slug).toBe('hoodie');
    expect(product.updatedAt).toBe('2026-09-13');
    expect(product.colors[0]?.images.front).toMatch(/^https?:\/\/|^\//);
    expect(product.printArea).toEqual(hoodie.printArea);
    expect(product.sizes).toEqual(hoodie.sizes);
    expect(product.colors.map((c) => c.slug)).toEqual(hoodie.colors.map((c) => c.slug));
  });

  it('drops empty measurements and back photos instead of emitting nulls', () => {
    const doc = productDoc({
      sizes: [{ label: 'M', length: null, chest: null, sleeve: null }],
      colors: [{ slug: 'black', name: 'أسود', hex: '#000000', front: media('/f.jpg'), back: null }],
    });
    const product = toProduct(doc);
    expect(product.sizes).toEqual([{ label: 'M' }]);
    expect(product.colors[0]?.images).toEqual({ front: '/f.jpg' });
  });

  it('fails loudly when a colour has no populated front photo', () => {
    const doc = productDoc({
      colors: [{ slug: 'black', name: 'أسود', hex: '#000000', front: 9 }],
    });
    expect(() => toProduct(doc)).toThrow(/colour black has no front photo/);
  });

  it('rejects a document that breaks the contract (price below cost, bad slug)', () => {
    expect(() => toProduct(productDoc({ suggestedPrice: 1 }))).toThrow();
    expect(() => toProduct(productDoc({ slug: 'Hoodie X' }))).toThrow();
  });
});

/** The menus as the site settings store them (the `menu` group, ADR-046), from the seed. */
const menuDoc: SiteSetting['menu'] = {
  primary: navigation.primary.map((i) => ({ ...i, matchPrefix: i.matchPrefix ?? null })),
  policies: navigation.policies.map((i) => ({ ...i, matchPrefix: null })),
  ctaLabel: navigation.ctaLabel,
  ctaShiny: navigation.ctaShiny,
  skipLinkLabel: navigation.skipLinkLabel,
  menuOpenLabel: navigation.menuOpenLabel,
  menuCloseLabel: navigation.menuCloseLabel,
};

describe('globals', () => {
  it('site settings round-trip from the seed shape', () => {
    const doc: SiteSetting = {
      id: 1,
      menu: menuDoc,
      brandName: site.brandName,
      brandNameLatin: site.brandNameLatin,
      tagline: site.tagline,
      contact: site.contact,
      social: site.social,
      welcomeCredit: site.offer.welcomeCredit,
      deliveryMaxDays: site.delivery.maxDays,
      deliveryOrigin: site.delivery.origin,
      deliveryRegion: site.delivery.region,
      bookingUrl: null,
      legalEntity: site.legalEntity,
    };
    const { bookingUrl: _unused, ...expected } = site;
    expect(toSiteSettings(doc)).toEqual(expected);
    expect(toSiteSettings({ ...doc, bookingUrl: 'https://cal.com/b7r' }).bookingUrl).toBe(
      'https://cal.com/b7r',
    );
    expect(() => toSiteSettings({ ...doc, contact: { ...doc.contact, email: 'nope' } })).toThrow();
  });

  it('the menus keep the six primary and four policy links and drop empty matchPrefix', () => {
    const doc = {
      id: 1,
      brandName: site.brandName,
      brandNameLatin: site.brandNameLatin,
      tagline: site.tagline,
      contact: site.contact,
      social: site.social,
      welcomeCredit: site.offer.welcomeCredit,
      deliveryMaxDays: site.delivery.maxDays,
      deliveryOrigin: site.delivery.origin,
      deliveryRegion: site.delivery.region,
      legalEntity: site.legalEntity,
      menu: menuDoc,
    } satisfies SiteSetting;
    expect(toNavigation(doc, 'ar')).toEqual(navigation);
    expect(() =>
      toNavigation({ ...doc, menu: { ...menuDoc, primary: menuDoc.primary?.slice(1) } }, 'ar'),
    ).toThrow();
    // English: the same rows under the prefix (ADR-043).
    const english = toNavigation(doc, 'en');
    expect(english.primary.map((i) => i.href)).toEqual(
      navigation.primary.map((i) => (i.href === '/' ? '/en' : `/en${i.href}`)),
    );
  });

  it('SEO rows carry route, copy and the date of last change', () => {
    const doc: SeoDefault = {
      id: 1,
      titleTemplate: '%s | بحر برنت',
      routes: seo.map((r) => ({
        route: r.route,
        title: r.title,
        description: r.description,
        ogImage: r.ogImage ?? null,
        updatedAt: `${r.updatedAt}T00:00:00.000Z`,
      })),
    };
    expect(toSeoRows(doc)).toEqual(seo);
    const empty = { ...doc, routes: [{ ...doc.routes[0]!, title: '' }] };
    expect(() => toSeoRows(empty)).toThrow();
  });
});
