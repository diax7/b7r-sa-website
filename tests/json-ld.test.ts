import { describe, expect, it } from 'vitest';
import { products } from '@/content/seed/products';
import { site } from '@/content/seed/site';
import {
  blogPosting,
  collectionPage,
  profilePage,
  breadcrumbs,
  graph,
  itemList,
  person,
  onlineStore,
  product,
  serialize,
  webPage,
  webSite,
} from '@/modules/core/seo/json-ld';

const BASE = 'https://b7r.sa';

/** Required fields per type (BRD 7.4 table + schema.org minimums Google reads). */
const REQUIRED: Record<string, string[]> = {
  OnlineStore: [
    'name',
    'alternateName',
    'url',
    'logo',
    'sameAs',
    'address',
    'contactPoint',
    'hasMerchantReturnPolicy',
    'shippingDetails',
  ],
  WebSite: ['name', 'alternateName', 'url'],
  BreadcrumbList: ['itemListElement'],
  ItemList: ['itemListElement'],
  Product: ['name', 'description', 'image', 'brand', 'material', 'offers'],
  WebPage: ['url', 'name', 'description', 'inLanguage'],
  BlogPosting: [
    'headline',
    'description',
    'image',
    'datePublished',
    'dateModified',
    'inLanguage',
    'author',
    'publisher',
  ],
};

function expectRequired(node: Record<string, unknown>) {
  const type = node['@type'] as string;
  for (const field of REQUIRED[type] ?? []) {
    expect(node[field], `${type}.${field}`).toBeDefined();
    expect(node[field], `${type}.${field}`).not.toBe('');
  }
}

describe('JSON-LD builders (BRD 7.4)', () => {
  it('home: OnlineStore with the BRD 1.1 facts and WebSite', () => {
    const store = onlineStore(BASE, site);
    expectRequired(store);
    expect(store['address']).toMatchObject({ addressLocality: 'جدة', addressCountry: 'SA' });
    expect(store['contactPoint']).toMatchObject({ telephone: '+966501699572' });
    expect(store['sameAs']).toEqual([site.social.x, site.social.instagram, site.social.tiktok]);
    expect(store['hasMerchantReturnPolicy']).toMatchObject({ merchantReturnDays: 10 });
    expect(JSON.stringify(store)).toContain('"maxValue":5');
    expectRequired(webSite(BASE, site));
  });

  it('products: ItemList of the five URLs, Product + Offer per product', () => {
    const list = itemList(
      BASE,
      products.map((p) => `/products/${p.slug}`),
    );
    expectRequired(list);
    expect((list['itemListElement'] as unknown[]).length).toBe(5);
    for (const p of products) {
      const node = product(BASE, 'ar', p, site);
      expectRequired(node);
      expect(node['offers']).toMatchObject({
        '@type': 'Offer',
        price: p.baseCost,
        priceCurrency: 'SAR',
        availability: 'https://schema.org/InStock',
        url: `${BASE}/products/${p.slug}`,
      });
      expect(JSON.stringify(node)).toContain('تكلفة للتاجر');
    }
  });

  it('product images: site paths get the origin, CMS media on S3 stays absolute (ADR-029)', () => {
    const local = products[0]!;
    expect(product(BASE, 'ar', local, site)['image']).toEqual(
      local.colors.map((c) => `${BASE}${c.images.front}`),
    );
    const s3 = 'https://media.b7r.sa/media/hoodie-black-front.jpg';
    const onS3 = {
      ...local,
      colors: [{ ...local.colors[0]!, images: { front: s3 } }],
    };
    expect(product(BASE, 'ar', onS3, site)['image']).toEqual([s3]);
  });

  it('breadcrumbs: positions start at 1 and the home item is the bare origin', () => {
    const node = breadcrumbs(BASE, [
      { name: 'الرئيسية', path: '/' },
      { name: 'المنتجات', path: '/products' },
    ]);
    expectRequired(node);
    expect(node['itemListElement']).toEqual([
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'المنتجات', item: `${BASE}/products` },
    ]);
  });

  it('pages and posts', () => {
    const page = webPage(BASE, 'ar', '/faq', 'الأسئلة الشائعة', 'وصف', '2026-09-12');
    expectRequired(page);
    expect(page['dateModified']).toBe('2026-09-12');
    const author = {
      slug: 'dhia',
      name: 'ضياء',
      role: 'مؤسس بحر برنت',
      sameAs: ['https://x.com/b7rprint'],
    };
    const post = {
      slug: 'how-to-price-printed-tshirt-saudi',
      title: 'كيف تسعّر تيشيرت مطبوع في السعودية؟',
      excerpt: 'ابدأ من التكلفة الأساسية.',
      cover: { src: '/media/cover-pricing.jpg' },
      publishedAt: '2026-09-13T09:00:00.000Z',
      contentUpdatedAt: '2026-10-01T09:00:00.000Z',
      author,
    };
    const node = blogPosting(BASE, 'ar', post, site);
    expectRequired(node);
    expect(node['author']).toMatchObject({
      '@type': 'Person',
      name: 'ضياء',
      url: `${BASE}/author/dhia`,
      sameAs: ['https://x.com/b7rprint'],
    });
    expect(node['image']).toEqual([`${BASE}/media/cover-pricing.jpg`]);
    expect(node['dateModified']).toBe('2026-10-01T09:00:00.000Z');
    expect(blogPosting(BASE, 'ar', { ...post, contentUpdatedAt: null }, site)['dateModified']).toBe(
      post.publishedAt,
    );
    const profile = profilePage(BASE, 'ar', author);
    expect(profile['@type']).toBe('ProfilePage');
    expect(profile['mainEntity']).toMatchObject({ '@type': 'Person', name: 'ضياء' });
    const hub = collectionPage(
      BASE,
      'ar',
      { slug: 'pricing-profit', name: 'التسعير والربح', description: 'وصف' },
      [post],
    );
    expect(hub['@type']).toBe('CollectionPage');
    expect(hub['hasPart']).toEqual([{ '@id': `${BASE}/blog/${post.slug}#article` }]);
  });

  it('English nodes carry the /en URLs and inLanguage en; the Person id is shared (ADR-043)', () => {
    const p = products[0]!;
    const node = product(BASE, 'en', p, site);
    expect(node['url']).toBe(`${BASE}/en/products/${p.slug}`);
    expect(JSON.stringify(node)).toContain('Merchant cost');
    const page = webPage(BASE, 'en', '/faq', 'FAQ', 'desc');
    expect(page['url']).toBe(`${BASE}/en/faq`);
    expect(page['inLanguage']).toBe('en');
    const author = { slug: 'dhia', name: 'Dhia', role: 'Founder' };
    const who = person(BASE, 'en', author);
    expect(who['@id']).toBe(`${BASE}/author/dhia#person`);
    expect(who['url']).toBe(`${BASE}/en/author/dhia`);
    expect(webSite(BASE, site)['inLanguage']).toEqual(['ar', 'en']);
  });

  it('serialises one graph per page and escapes < so content cannot close the script', () => {
    const json = serialize(
      graph([webSite(BASE, site), webPage(BASE, 'ar', '/x', '<b>', 'a</script>')]),
    );
    expect(json).not.toContain('</script>');
    expect(json).not.toContain('<');
    const parsed = JSON.parse(json) as { '@context': string; '@graph': unknown[] };
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@graph']).toHaveLength(2);
  });
});
