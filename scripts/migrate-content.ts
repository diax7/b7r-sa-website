/**
 * Seeds the CMS from the Level 1 content (BRD 9.7, ADR-026). Create-only: it never overwrites
 * a document the CMS already holds, and it refuses to run against a database that already
 * has products or filled globals unless `--force` is passed.
 *
 *   pnpm content:migrate            # empty database (CI, first deploy)
 *   pnpm content:migrate --force    # add whatever is missing to a database that has content
 *
 * Exit codes: 0 done, 1 failure, 2 refused (content exists, no --force).
 */
import { readFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import nextEnv from '@next/env';
import { getPayload, type Payload } from 'payload';
import { faq } from '../src/content/seed/faq';
import { home } from '../src/content/seed/home';
import { integrations } from '../src/content/seed/integrations';
import { navigation } from '../src/content/seed/navigation';
import { pages } from '../src/content/seed/pages';
import { products } from '../src/content/seed/products';
import { seo } from '../src/content/seed/seo';
import { site } from '../src/content/seed/site';
import { testimonials } from '../src/content/seed/testimonials';
import { SEO_TITLE_TEMPLATE } from '../src/content/seo-copy';
import {
  RESERVED_PAGE_SLUGS,
  type Block,
  type FaqItem,
  type Integration,
  type Page,
  type Product,
  type Testimonial,
} from '../src/content/schema';

// Same env files Next loads (.env.local first), so the script sees DATABASE_URL and the secret.
nextEnv.loadEnvConfig(process.cwd());

const force = process.argv.includes('--force');
const CONTEXT = { disableRevalidate: true };
const summary = { created: [] as string[], skipped: [] as string[] };

/**
 * Media docs are matched by filename so re-runs never duplicate a photo; the folder name is
 * prefixed because every product folder uses the same file names (white-front.jpg …).
 */
const mediaIds = new Map<string, number>();

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

function mimeType(publicPath: string): string {
  const type = MIME[extname(publicPath).toLowerCase()];
  if (!type) throw new Error(`content:migrate: no media type for ${publicPath}`);
  return type;
}

async function ensureMedia(payload: Payload, publicPath: string, alt: string): Promise<number> {
  const filename = `${basename(dirname(publicPath))}-${basename(publicPath)}`;
  // The same photo can serve two places (hero set A on slides 1 and 3): one document.
  const known = mediaIds.get(filename);
  if (known) return known;
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  });
  const found = existing.docs[0];
  if (found) {
    summary.skipped.push(`media ${filename}`);
    mediaIds.set(filename, found.id);
    return found.id;
  }
  const file = readFileSync(join(process.cwd(), 'public', publicPath));
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    file: { data: file, name: filename, mimetype: mimeType(publicPath), size: file.byteLength },
    context: CONTEXT,
  });
  summary.created.push(`media ${filename}`);
  mediaIds.set(filename, doc.id);
  return doc.id;
}

async function ensureProduct(payload: Payload, product: Product): Promise<void> {
  const existing = await payload.find({
    collection: 'products',
    where: { slug: { equals: product.slug } },
    limit: 1,
    depth: 0,
    draft: true,
  });
  if (existing.docs[0]) {
    summary.skipped.push(`product ${product.slug}`);
    return;
  }
  const colors = [];
  for (const color of product.colors) {
    const front = await ensureMedia(
      payload,
      color.images.front,
      `${product.name}, ${color.name}، الواجهة الأمامية`,
    );
    const back = color.images.back
      ? await ensureMedia(
          payload,
          color.images.back,
          `${product.name}, ${color.name}، الواجهة الخلفية`,
        )
      : undefined;
    colors.push({
      slug: color.slug,
      name: color.name,
      hex: color.hex,
      front,
      ...(back ? { back } : {}),
    });
  }
  await payload.create({
    collection: 'products',
    data: {
      slug: product.slug,
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      baseCost: product.baseCost,
      suggestedPrice: product.suggestedPrice,
      sortOrder: product.sortOrder,
      colors,
      sizes: product.sizes.map((s) => ({
        label: s.label,
        ...(s.measurements?.['length'] !== undefined ? { length: s.measurements['length'] } : {}),
        ...(s.measurements?.['chest'] !== undefined ? { chest: s.measurements['chest'] } : {}),
        ...(s.measurements?.['sleeve'] !== undefined ? { sleeve: s.measurements['sleeve'] } : {}),
      })),
      sizesSummary: product.sizesSummary,
      material: product.material,
      weightGrams: product.weightGrams,
      printArea: {
        label: product.printArea.label,
        widthCm: product.printArea.widthCm,
        heightCm: product.printArea.heightCm,
        canvas: product.printArea.canvas,
      },
      printMethodLabel: product.printMethodLabel,
      _status: 'published',
    },
    context: CONTEXT,
  });
  summary.created.push(`product ${product.slug}`);
}

const GLOBALS = ['home', 'site-settings', 'navigation', 'seo-defaults'] as const;

async function globalIsFilled(payload: Payload, slug: (typeof GLOBALS)[number]) {
  const doc = await payload.findGlobal({ slug, depth: 0, draft: true });
  if (slug === 'home') {
    return ((doc as { hero?: { slides?: unknown[] } }).hero?.slides?.length ?? 0) > 0;
  }
  if (slug === 'site-settings') return Boolean((doc as { brandName?: string }).brandName);
  if (slug === 'navigation') return ((doc as { primary?: unknown[] }).primary?.length ?? 0) > 0;
  return ((doc as { routes?: unknown[] }).routes?.length ?? 0) > 0;
}

/** Published product ids by slug, for the strip relationship. */
async function productIdsBySlug(payload: Payload): Promise<Map<string, number>> {
  const { docs } = await payload.find({
    collection: 'products',
    limit: 100,
    depth: 0,
    draft: true,
  });
  return new Map(docs.map((d) => [d.slug, d.id]));
}

/** The `home` global (BRD 4.4): hero photos and step icons become media, the strip links products. */
async function ensureHome(payload: Payload): Promise<void> {
  if (await globalIsFilled(payload, 'home')) {
    summary.skipped.push('global home');
    return;
  }
  const ids = await productIdsBySlug(payload);
  const strip = home.productStrip.order.map((slug) => {
    const id = ids.get(slug);
    if (!id) throw new Error(`home.productStrip: product ${slug} is not in the CMS`);
    return id;
  });
  const slides = [];
  for (const slide of home.hero.slides) {
    slides.push({
      headline: slide.headline,
      subline: slide.subline,
      imageDesktop: await ensureMedia(payload, slide.imageDesktop, slide.alt),
      imageMobile: await ensureMedia(payload, slide.imageMobile, slide.alt),
    });
  }
  const steps = [];
  for (const step of home.steps.items) {
    steps.push({
      title: step.title,
      text: step.text,
      // TODO(copy): admin-only alt (the page renders the icon decorative); Appendix G row 17.
      icon: await ensureMedia(payload, step.icon, `أيقونة مجسّمة: ${step.title}`),
    });
  }
  await payload.updateGlobal({
    slug: 'home',
    data: {
      hero: {
        slides,
        primaryCta: home.hero.primaryCta,
        secondaryCta: home.hero.secondaryCta,
        microcopy: home.hero.microcopy,
        chips: home.hero.chips.map((text) => ({ text })),
      },
      productStrip: {
        eyebrow: home.productStrip.eyebrow,
        title: home.productStrip.title,
        lead: home.productStrip.lead,
        pricePrefix: home.productStrip.pricePrefix,
        button: home.productStrip.button,
        products: strip,
      },
      designer: home.designer,
      steps: { ...home.steps, items: steps },
      video: home.video,
      whyUs: { ...home.whyUs, items: home.whyUs.items.map((i) => ({ ...i })) },
      testimonials: home.testimonials,
      integrations: home.integrations,
      faq: home.faq,
      ribbon: home.ribbon,
      _status: 'published',
    },
    context: CONTEXT,
  });
  summary.created.push('global home');
}

async function ensureFaq(payload: Payload, item: FaqItem): Promise<void> {
  const existing = await payload.find({
    collection: 'faqs',
    where: { question: { equals: item.question } },
    limit: 1,
    depth: 0,
  });
  if (existing.docs[0]) {
    summary.skipped.push(`faq ${item.question}`);
    return;
  }
  await payload.create({
    collection: 'faqs',
    data: {
      question: item.question,
      answer: item.answer,
      group: item.group,
      order: item.order,
      showOnHome: item.showOnHome,
      ...(item.homeOrder ? { homeOrder: item.homeOrder } : {}),
    },
    context: CONTEXT,
  });
  summary.created.push(`faq ${item.question}`);
}

async function ensureTestimonial(payload: Payload, item: Testimonial, order: number) {
  const existing = await payload.find({
    collection: 'testimonials',
    where: { and: [{ name: { equals: item.name } }, { store: { equals: item.store } }] },
    limit: 1,
    depth: 0,
    draft: true,
  });
  if (existing.docs[0]) {
    summary.skipped.push(`testimonial ${item.name}`);
    return;
  }
  await payload.create({
    collection: 'testimonials',
    data: {
      quote: item.quote,
      name: item.name,
      store: item.store,
      placeholder: item.placeholder,
      order,
      _status: 'published',
    },
    context: CONTEXT,
  });
  summary.created.push(`testimonial ${item.name}`);
}

async function ensureIntegration(payload: Payload, item: Integration, order: number) {
  const existing = await payload.find({
    collection: 'integrations',
    where: { platform: { equals: item.slug } },
    limit: 1,
    depth: 0,
  });
  if (existing.docs[0]) {
    summary.skipped.push(`integration ${item.slug}`);
    return;
  }
  await payload.create({
    collection: 'integrations',
    data: { platform: item.slug, name: item.name, nameLatin: item.nameLatin, order },
    context: CONTEXT,
  });
  summary.created.push(`integration ${item.slug}`);
}

async function ensureGlobals(payload: Payload): Promise<void> {
  if (await globalIsFilled(payload, 'site-settings')) summary.skipped.push('global site-settings');
  else {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        brandName: site.brandName,
        brandNameLatin: site.brandNameLatin,
        tagline: site.tagline,
        contact: site.contact,
        social: site.social,
        welcomeCredit: site.offer.welcomeCredit,
        deliveryMaxDays: site.delivery.maxDays,
        deliveryOrigin: site.delivery.origin,
        deliveryRegion: site.delivery.region,
        ...(site.bookingUrl ? { bookingUrl: site.bookingUrl } : {}),
        appUrls: site.appUrls,
        legalEntity: site.legalEntity,
      },
      context: CONTEXT,
    });
    summary.created.push('global site-settings');
  }
  if (await globalIsFilled(payload, 'navigation')) summary.skipped.push('global navigation');
  else {
    await payload.updateGlobal({
      slug: 'navigation',
      data: {
        primary: navigation.primary.map((i) => ({
          label: i.label,
          href: i.href,
          ...(i.matchPrefix ? { matchPrefix: i.matchPrefix } : {}),
        })),
        policies: navigation.policies.map((i) => ({
          label: i.label,
          href: i.href,
          ...(i.matchPrefix ? { matchPrefix: i.matchPrefix } : {}),
        })),
        ctaLabel: navigation.ctaLabel,
        loginLabel: navigation.loginLabel,
        skipLinkLabel: navigation.skipLinkLabel,
        menuOpenLabel: navigation.menuOpenLabel,
        menuCloseLabel: navigation.menuCloseLabel,
        menuWhatsappLine: navigation.menuWhatsappLine,
      },
      context: CONTEXT,
    });
    summary.created.push('global navigation');
  }
  if (await globalIsFilled(payload, 'seo-defaults')) summary.skipped.push('global seo-defaults');
  else {
    await payload.updateGlobal({
      slug: 'seo-defaults',
      data: {
        titleTemplate: SEO_TITLE_TEMPLATE,
        defaultOgImage: '/og/default.png',
        routes: seo
          .filter((row) => CODE_ROUTES.has(row.route))
          .map((row) => ({
            route: row.route,
            title: row.title,
            description: row.description,
            ...(row.ogImage ? { ogImage: row.ogImage } : {}),
            updatedAt: `${row.updatedAt}T00:00:00.000Z`,
          })),
      },
      context: CONTEXT,
    });
    summary.created.push('global seo-defaults');
  }
}

/** Routes the code owns; every other BRD 4.16 row lives in the page's own `seo` group (ADR-031). */
const CODE_ROUTES = new Set(['/', '/products', '/blog']);

/**
 * The one exception to "never overwrites" (ADR-026 amendment): a database seeded before 2b
 * holds the seven pages' SEO rows in `seo-defaults`; once the pages exist those rows would
 * be a second source, so they are removed here with a log line.
 */
async function pruneSeoRows(payload: Payload): Promise<void> {
  const doc = await payload.findGlobal({ slug: 'seo-defaults', depth: 0 });
  const rows = doc.routes ?? [];
  const moved = rows.filter((r) => !CODE_ROUTES.has(r.route));
  if (moved.length === 0) return;
  await payload.updateGlobal({
    slug: 'seo-defaults',
    data: { routes: rows.filter((r) => CODE_ROUTES.has(r.route)) },
    context: CONTEXT,
  });
  console.warn(
    `content:migrate: removed ${moved.map((r) => r.route).join(', ')} from seo-defaults, their title and description now live in the page's SEO group (ADR-026 exception).`,
  );
}

/** Block seeds → Payload block data: media paths become uploads, ids are dropped (Payload assigns rows). */
async function blockData(payload: Payload, block: Block): Promise<Record<string, unknown>> {
  const { id: _id, ...rest } = block;
  switch (block.blockType) {
    case 'story':
      return {
        ...rest,
        photo: await ensureMedia(payload, block.photo.src, 'تيشيرت أسود معلّق مطبوع عليه تصميم جدة'),
      };
    case 'cards': {
      const items = [];
      for (const item of block.items) {
        const { art, ...fields } = item;
        // TODO(copy): admin-only alt (the page renders the art decorative); Appendix G row 17.
        items.push({
          ...fields,
          ...(art ? { art: await ensureMedia(payload, art, `أيقونة مجسّمة: ${item.title}`) } : {}),
        });
      }
      return { ...rest, items };
    }
    case 'steps': {
      const items = [];
      for (const item of block.items) {
        const { order: _order, icon, ...fields } = item;
        // TODO(copy): admin-only alt (the page renders the icon decorative); Appendix G row 17.
        items.push({
          ...fields,
          icon: await ensureMedia(payload, icon, `أيقونة مجسّمة: ${item.title}`),
        });
      }
      return { ...rest, items };
    }
    case 'faqList': {
      const { link, ...fields } = block;
      return { ...fields, ...(link ? { linkLabel: link.label, linkHref: link.href } : {}) };
    }
    case 'mediaBanner':
      return { ...rest, media: await ensureMedia(payload, block.media.src, block.media.alt) };
    case 'legalBody':
      return { ...rest, updatedAt: `${block.updatedAt}T00:00:00.000Z` };
    default:
      return rest;
  }
}

async function ensurePage(payload: Payload, page: Page): Promise<void> {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: page.slug } },
    limit: 1,
    depth: 0,
    draft: true,
  });
  if (existing.docs[0]) {
    summary.skipped.push(`page ${page.slug}`);
    return;
  }
  const blocks = [];
  for (const block of page.blocks) blocks.push(await blockData(payload, block));
  const ogImage = page.seo.ogImage
    ? await ensureMedia(payload, page.seo.ogImage, `صورة مشاركة: ${page.title}`)
    : undefined;
  await payload.create({
    collection: 'pages',
    data: {
      slug: page.slug,
      title: page.title,
      ...(page.lead ? { lead: page.lead } : {}),
      blocks: blocks as never,
      seo: {
        title: page.seo.title,
        description: page.seo.description,
        ...(ogImage ? { ogImage } : {}),
      },
      _status: 'published',
    },
    context: CONTEXT,
  });
  summary.created.push(`page ${page.slug}`);
}

async function main(): Promise<number> {
  // Imported after the env files are loaded: the config reads DATABASE_URL and the secret at import.
  const { default: config } = await import('../src/payload.config');
  const payload = await getPayload({ config });
  const counts = await Promise.all(
    (['products', 'pages', 'faqs', 'testimonials', 'integrations'] as const).map((c) =>
      payload.count({ collection: c }).then((r) => r.totalDocs),
    ),
  );
  const existingDocs = counts.reduce((a, b) => a + b, 0);
  const filled = await Promise.all(GLOBALS.map((s) => globalIsFilled(payload, s)));
  if ((existingDocs > 0 || filled.some(Boolean)) && !force) {
    console.error(
      `content:migrate: the database already holds content (${existingDocs} documents, globals filled: ${filled.filter(Boolean).length}/${GLOBALS.length}). ` +
        'Nothing changed. Re-run with --force to add only what is missing; existing documents are never overwritten.',
    );
    return 2;
  }
  for (const product of products.toSorted((a, b) => a.sortOrder - b.sortOrder)) {
    await ensureProduct(payload, product);
  }
  await ensureGlobals(payload);
  await ensureHome(payload);
  for (const page of pages) {
    if (!(RESERVED_PAGE_SLUGS as readonly string[]).includes(page.slug)) {
      throw new Error(`seed pages: ${page.slug} is not one of the seven designed pages`);
    }
    await ensurePage(payload, page);
  }
  await pruneSeoRows(payload);
  for (const item of faq) await ensureFaq(payload, item);
  for (const [i, item] of testimonials.entries()) await ensureTestimonial(payload, item, i + 1);
  for (const [i, item] of integrations.entries()) await ensureIntegration(payload, item, i + 1);
  console.warn(
    `content:migrate: created ${summary.created.length}, skipped ${summary.skipped.length}.` +
      (summary.created.length ? `\n  created: ${summary.created.join(', ')}` : '') +
      (summary.skipped.length ? `\n  skipped: ${summary.skipped.join(', ')}` : ''),
  );
  return 0;
}

try {
  process.exit(await main());
} catch (error) {
  console.error('content:migrate failed:', error);
  process.exit(1);
}
