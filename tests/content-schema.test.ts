import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { blogAuthor, blogHubs, blogPosts } from '@/content/seed/blog';
import { faq, homeFaq } from '@/content/seed/faq';
import { home } from '@/content/seed/home';
import { integrations } from '@/content/seed/integrations';
import { navigation } from '@/content/seed/navigation';
import { products } from '@/content/seed/products';
import {
  BlogHubSchema,
  BlogAuthorSchema,
  BlogPostSchema,
  FaqItemSchema,
  HomeSchema,
  IntegrationSchema,
  NavigationSchema,
  PageSchema,
  PageSeoSchema,
  ProductSchema,
  SiteSettingsSchema,
  TestimonialSchema,
} from '@/content/schema';
import { pages } from '@/content/seed/pages';
import { seo } from '@/content/seed/seo';
import { site } from '@/content/seed/site';
import { testimonials } from '@/content/seed/testimonials';

function expectValid(name: string, schema: z.ZodType, value: unknown) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const detail = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`content/${name} does not match its schema:\n${detail}`);
  }
}

describe('content contract (BRD 8.4)', () => {
  it('site.ts', () => expectValid('site.ts', SiteSettingsSchema, site));
  it('navigation.ts', () => expectValid('navigation.ts', NavigationSchema, navigation));
  it('home.ts', () => expectValid('home.ts', HomeSchema, home));
  it('products.ts', () => expectValid('products.ts', z.array(ProductSchema).length(5), products));
  it('faq.ts', () => {
    expectValid('faq.ts', z.array(FaqItemSchema).length(16), faq);
    expect(homeFaq).toHaveLength(5);
    expect(homeFaq.map((f) => f.homeOrder)).toEqual([1, 2, 3, 4, 5]);
    expect(faq.filter((f) => f.showOnHome)).toHaveLength(5);
    // Order restarts inside each group (Appendix D).
    expect(faq.filter((f) => f.group === 'البداية').map((f) => f.order)).toEqual([1, 2, 3]);
  });
  it('testimonials.ts are all placeholders until real ones exist', () => {
    expectValid('testimonials.ts', z.array(TestimonialSchema).length(3), testimonials);
    expect(testimonials.every((t) => t.placeholder)).toBe(true);
  });
  it('integrations.ts', () =>
    expectValid('integrations.ts', z.array(IntegrationSchema).length(3), integrations));
  it('seo.ts covers every Level 1 route', () => {
    expectValid('seo.ts', z.array(PageSeoSchema), seo);
    const routes = seo.map((s) => s.route);
    for (const r of [
      '/',
      '/products',
      '/how-it-works',
      '/about',
      '/contact',
      '/faq',
      '/blog',
      '/terms',
      '/shipping',
      '/privacy',
    ]) {
      expect(routes).toContain(r);
    }
  });
  it('seed/pages.ts: the seven designed pages, legal bodies from Appendix B, the comparison as a draft', () => {
    expectValid('pages.ts', z.array(PageSchema).length(8), pages);
    expect(pages.map((p) => p.slug)).toEqual([
      'how-it-works',
      'about',
      'contact',
      'faq',
      'terms',
      'shipping',
      'privacy',
      'compare-printful',
    ]);
    // The comparison (ADR-050): a draft, one compare block, eight rows, no URL anywhere.
    const compare = pages.find((p) => p.slug === 'compare-printful')!;
    expect(compare.draft).toBe(true);
    expect(pages.filter((p) => p.draft)).toHaveLength(1);
    const block = compare.blocks[0]!;
    if (block.blockType !== 'compare') throw new Error('a compare block');
    expect(block.rows).toHaveLength(8);
    expect(block.asOf).toBe('2026-09-16');
    expect(JSON.stringify(compare)).not.toMatch(/https?:\/\//);
    for (const slug of ['terms', 'shipping', 'privacy']) {
      const body = pages.find((p) => p.slug === slug)?.blocks[0];
      expect(body?.blockType).toBe('legalBody');
      expect(body && 'body' in body ? body.body.length : 0).toBeGreaterThan(500);
    }
  });
  it('seed/blog.ts', () => {
    expectValid('blog#hubs', z.array(BlogHubSchema).length(6), blogHubs);
    expectValid('blog#author', BlogAuthorSchema, blogAuthor);
    expectValid('blog#posts', z.array(BlogPostSchema).length(3), blogPosts);
    const hubSlugs = new Set(blogHubs.map((h) => h.slug));
    for (const p of blogPosts) expect(hubSlugs.has(p.hub)).toBe(true);
  });

  it('product strip order references the five real products', () => {
    const slugs = new Set(products.map((p) => p.slug));
    for (const s of home.productStrip.order) expect(slugs.has(s)).toBe(true);
    expect(new Set(home.productStrip.order).size).toBe(5);
  });

  it('prices match BRD 0.4.4 exactly', () => {
    const byslug = Object.fromEntries(
      products.map((p) => [p.slug, [p.baseCost, p.suggestedPrice]]),
    );
    expect(byslug).toEqual({
      'tee-essential': [45, 89],
      'tee-oversize': [55, 119],
      hoodie: [95, 189],
      'baby-onesie': [35, 69],
      'tote-bag': [30, 65],
    });
    expect(site.offer.welcomeCredit).toBe(30);
    expect(site.delivery.maxDays).toBe(5);
  });
});
