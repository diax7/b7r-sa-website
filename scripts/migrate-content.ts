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
import { basename, dirname, join } from 'node:path';
import nextEnv from '@next/env';
import { getPayload, type Payload } from 'payload';
import { navigation } from '../src/content/seed/navigation';
import { products } from '../src/content/seed/products';
import { seo } from '../src/content/seed/seo';
import { site } from '../src/content/seed/site';
import { SEO_TITLE_TEMPLATE } from '../src/content/seo-copy';
import type { Product } from '../src/content/schema';

// Same env files Next loads (.env.local first), so the script sees DATABASE_URL and the secret.
nextEnv.loadEnvConfig(process.cwd());

const force = process.argv.includes('--force');
const CONTEXT = { disableRevalidate: true };
const summary = { created: [] as string[], skipped: [] as string[] };

/**
 * Media docs are matched by filename so re-runs never duplicate a photo; the product slug is
 * prefixed because every product folder uses the same file names (white-front.jpg …).
 */
async function ensureMedia(payload: Payload, publicPath: string, alt: string): Promise<number> {
  const filename = `${basename(dirname(publicPath))}-${basename(publicPath)}`;
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  });
  const found = existing.docs[0];
  if (found) {
    summary.skipped.push(`media ${filename}`);
    return found.id;
  }
  const file = readFileSync(join(process.cwd(), 'public', publicPath));
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    file: { data: file, name: filename, mimetype: 'image/jpeg', size: file.byteLength },
    context: CONTEXT,
  });
  summary.created.push(`media ${filename}`);
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
      `${product.name} — ${color.name}، الواجهة الأمامية`,
    );
    const back = color.images.back
      ? await ensureMedia(
          payload,
          color.images.back,
          `${product.name} — ${color.name}، الواجهة الخلفية`,
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

async function globalIsFilled(
  payload: Payload,
  slug: 'site-settings' | 'navigation' | 'seo-defaults',
) {
  const doc = await payload.findGlobal({ slug, depth: 0 });
  if (slug === 'site-settings') return Boolean((doc as { brandName?: string }).brandName);
  if (slug === 'navigation') return ((doc as { primary?: unknown[] }).primary?.length ?? 0) > 0;
  return ((doc as { routes?: unknown[] }).routes?.length ?? 0) > 0;
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
        routes: seo.map((row) => ({
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

async function main(): Promise<number> {
  // Imported after the env files are loaded: the config reads DATABASE_URL and the secret at import.
  const { default: config } = await import('../src/payload.config');
  const payload = await getPayload({ config });
  const existingProducts = await payload.count({ collection: 'products' });
  const filled = await Promise.all(
    (['site-settings', 'navigation', 'seo-defaults'] as const).map((s) =>
      globalIsFilled(payload, s),
    ),
  );
  if ((existingProducts.totalDocs > 0 || filled.some(Boolean)) && !force) {
    console.error(
      `content:migrate: the database already holds content (${existingProducts.totalDocs} products, globals filled: ${filled.filter(Boolean).length}/3). ` +
        'Nothing changed. Re-run with --force to add only what is missing; existing documents are never overwritten.',
    );
    return 2;
  }
  for (const product of products.toSorted((a, b) => a.sortOrder - b.sortOrder)) {
    await ensureProduct(payload, product);
  }
  await ensureGlobals(payload);
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
