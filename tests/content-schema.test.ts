import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { blogHubs, blogPosts } from '@/content/blog';
import { faq, homeFaq } from '@/content/faq';
import { home } from '@/content/home';
import { integrations } from '@/content/integrations';
import { getLegalPages } from '@/content/legal';
import { navigation } from '@/content/navigation';
import { products } from '@/content/products';
import {
  BlogHubSchema,
  BlogPostSchema,
  FaqItemSchema,
  HomeSchema,
  IntegrationSchema,
  LegalPageSchema,
  NavigationSchema,
  PageSeoSchema,
  ProductSchema,
  SiteSettingsSchema,
  StepSchema,
  TestimonialSchema,
  WhyUsItemSchema,
} from '@/content/schema';
import { seo } from '@/content/seo';
import { site } from '@/content/site';
import { homeSteps, howItWorksSteps } from '@/content/steps';
import { testimonials } from '@/content/testimonials';
import { whyUs } from '@/content/why-us';

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
  it('steps.ts', () => {
    expectValid('steps.ts#home', z.array(StepSchema).length(3), homeSteps);
    expectValid('steps.ts#how-it-works', z.array(StepSchema).length(5), howItWorksSteps);
  });
  it('why-us.ts', () => expectValid('why-us.ts', z.array(WhyUsItemSchema).length(3), whyUs));
  it('faq.ts', () => {
    expectValid('faq.ts', z.array(FaqItemSchema).length(16), faq);
    expect(homeFaq).toHaveLength(5);
    expect(faq.filter((f) => f.showOnHome)).toHaveLength(5);
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
  it('legal/*.md', () => expectValid('legal', z.array(LegalPageSchema).length(3), getLegalPages()));
  it('blog/index.ts', () => {
    expectValid('blog#hubs', z.array(BlogHubSchema).length(6), blogHubs);
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
