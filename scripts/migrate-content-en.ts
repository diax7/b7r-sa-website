/**
 * The English pass of `content:migrate` (Level 5, ADR-043): writes the `en` values of every
 * localised field from `src/content/seed/en/*` once the Arabic document exists. A document
 * whose English title (or name) is already set is left alone; with `--force` the pass runs
 * on existing documents whose English is still empty (the one case the seed updates a
 * document, recorded in ADR-043). Array rows and blocks are matched by position and keep
 * their ids and non-localised fields.
 */
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';
import { basename, dirname, extname } from 'node:path';
import type { Payload } from 'payload';
import { blogAuthorEn, blogHubsEn, blogPostBodyEn, blogPostsEn } from '../src/content/seed/en/blog';
import { faqEn } from '../src/content/seed/en/faq';
import { homeEn } from '../src/content/seed/en/home';
import { postBodyField } from '../src/lib/cms/post-body';
import { integrationsEn } from '../src/content/seed/en/integrations';
import { mediaAltEn } from '../src/content/seed/en/media';
import { navigationEn } from '../src/content/seed/en/navigation';
import { pagesEn } from '../src/content/seed/en/pages';
import {
  COLOR_NAMES_EN,
  PRINT_AREA_LABEL_EN,
  PRINT_METHOD_EN,
  productsEn,
} from '../src/content/seed/en/products';
import { seoEn } from '../src/content/seed/en/seo';
import { siteEn } from '../src/content/seed/en/site';
import { testimonialsEn } from '../src/content/seed/en/testimonials';

const EN = { locale: 'en', fallbackLocale: false, depth: 0, overrideAccess: true } as const;
const AR = { locale: 'ar', depth: 0, overrideAccess: true } as const;
const CONTEXT = { disableRevalidate: true };

type Row = Record<string, unknown> & { id?: string | null };

/**
 * Original rows with the English values laid over them, by position; ids kept. A patch longer
 * than the original adds nothing: a row exists in a language only when the Arabic has it.
 */
export function merged<T extends Row>(
  rows: T[] | null | undefined,
  english: Array<Record<string, unknown>>,
): T[] {
  return (rows ?? []).map((row, i) => ({ ...row, ...english[i] }));
}

export interface EnglishSummary {
  written: string[];
  skipped: string[];
}

/**
 * The media document the Arabic seed uploaded for a `public/` path (`<folder>-<file>`).
 * Payload numbers a filename that already exists in the media store (`name-1.jpg`), so the
 * numbered form counts too (the alt pass, `mediaAltEn`, reads it the same way).
 */
async function mediaIdByPath(payload: Payload, publicPath: string): Promise<number> {
  const filename = `${basename(dirname(publicPath))}-${basename(publicPath)}`;
  const ext = extname(filename);
  const stem = filename.slice(0, -ext.length);
  const stored = (name: string) =>
    name === filename ||
    (name.startsWith(`${stem}-`) &&
      /^\d+$/.test(name.slice(stem.length + 1, -ext.length)) &&
      name.endsWith(ext));
  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { like: stem } },
    sort: 'id',
    limit: 20,
    depth: 0,
  });
  const doc = docs.find((d) => d.filename && stored(d.filename));
  if (!doc) throw new Error(`seed en: media ${filename} is not in the CMS (run the Arabic seed)`);
  return doc.id;
}

export async function ensureEnglish(payload: Payload): Promise<EnglishSummary> {
  const out: EnglishSummary = { written: [], skipped: [] };
  const done = (name: string) => out.written.push(name);
  const skip = (name: string) => out.skipped.push(name);

  // site-settings, with the menus (the site settings' `menu` group since ADR-046): the
  // English labels merged onto the Arabic rows by position.
  {
    const en = await payload.findGlobal({ slug: 'site-settings', ...EN });
    const menuEn = async () => {
      const ar = await payload.findGlobal({ slug: 'site-settings', ...AR });
      const label = (map: Record<string, string>) => (row: Row) => ({
        label: map[String(row['href'])] ?? String(row['label']),
      });
      return {
        primary: merged(ar.menu.primary, (ar.menu.primary ?? []).map(label(navigationEn.primary))),
        policies: merged(
          ar.menu.policies,
          (ar.menu.policies ?? []).map(label(navigationEn.policies)),
        ),
        ctaLabel: navigationEn.ctaLabel,
        skipLinkLabel: navigationEn.skipLinkLabel,
        menuOpenLabel: navigationEn.menuOpenLabel,
        menuCloseLabel: navigationEn.menuCloseLabel,
      };
    };
    if (en.brandName && en.menu?.ctaLabel) skip('en site-settings');
    else if (en.brandName) {
      await payload.updateGlobal({
        slug: 'site-settings',
        locale: 'en',
        data: { menu: await menuEn() },
        context: CONTEXT,
      });
      done('en site-settings: menu');
    } else {
      await payload.updateGlobal({
        slug: 'site-settings',
        locale: 'en',
        data: { ...siteEn, menu: await menuEn() },
        context: CONTEXT,
      });
      done('en site-settings');
    }
  }

  // seo-defaults
  {
    const en = await payload.findGlobal({ slug: 'seo-defaults', ...EN });
    if (en.titleTemplate) skip('en seo-defaults');
    else {
      const ar = await payload.findGlobal({ slug: 'seo-defaults', ...AR });
      const rows = (ar.routes ?? []).map((row) => {
        const english = seoEn.routes[row.route];
        if (!english) throw new Error(`seed en: no English SEO row for ${row.route}`);
        return english;
      });
      await payload.updateGlobal({
        slug: 'seo-defaults',
        locale: 'en',
        data: { titleTemplate: seoEn.titleTemplate, routes: merged(ar.routes, rows) },
        context: CONTEXT,
      });
      done('en seo-defaults');
    }
  }

  // home: the copy, and the English hero photos (ADR-044; uploaded by the Arabic seed).
  {
    const en = await payload.findGlobal({ slug: 'home', ...EN, draft: false });
    if (en.hero?.primaryCta) skip('en home');
    else {
      const ar = await payload.findGlobal({ slug: 'home', ...AR, draft: false });
      const slides = [];
      for (const s of homeEn.hero.slides) {
        slides.push({
          headline: s.headline,
          subline: s.subline,
          imageDesktop: await mediaIdByPath(payload, s.imageDesktop),
          imageMobile: await mediaIdByPath(payload, s.imageMobile),
        });
      }
      await payload.updateGlobal({
        slug: 'home',
        locale: 'en',
        data: {
          hero: {
            ...ar.hero,
            slides: merged(ar.hero?.slides, slides),
            primaryCta: homeEn.hero.primaryCta,
            secondaryCta: homeEn.hero.secondaryCta,
            microcopy: homeEn.hero.microcopy,
            chips: merged(
              ar.hero?.chips,
              homeEn.hero.chips.map((text) => ({ text })),
            ),
          },
          productStrip: { ...ar.productStrip, ...homeEn.productStrip },
          designer: { ...ar.designer, ...homeEn.designer },
          steps: {
            ...ar.steps,
            eyebrow: homeEn.steps.eyebrow,
            title: homeEn.steps.title,
            link: homeEn.steps.link,
            items: merged(ar.steps?.items, homeEn.steps.items),
          },
          video: { ...ar.video, ...homeEn.video },
          whyUs: {
            ...ar.whyUs,
            eyebrow: homeEn.whyUs.eyebrow,
            title: homeEn.whyUs.title,
            items: merged(ar.whyUs?.items, homeEn.whyUs.items),
          },
          testimonials: { ...ar.testimonials, ...homeEn.testimonials },
          integrations: { ...ar.integrations, ...homeEn.integrations },
          faq: { ...ar.faq, ...homeEn.faq },
          ribbon: { ...ar.ribbon, ...homeEn.ribbon },
          _status: 'published',
        },
        context: CONTEXT,
      });
      done('en home');
    }
  }

  // products
  {
    const { docs } = await payload.find({ collection: 'products', ...AR, limit: 50, draft: true });
    for (const ar of docs) {
      const english = productsEn[ar.slug];
      if (!english) {
        skip(`en product ${ar.slug} (no English seed)`);
        continue;
      }
      const en = await payload.findByID({ collection: 'products', id: ar.id, ...EN, draft: true });
      if (en.name) {
        skip(`en product ${ar.slug}`);
        continue;
      }
      await payload.update({
        collection: 'products',
        id: ar.id,
        locale: 'en',
        data: {
          name: english.name,
          shortDescription: english.shortDescription,
          description: english.description,
          material: english.material,
          sizesSummary: english.sizesSummary,
          colors: merged(
            ar.colors,
            (ar.colors ?? []).map((c) => ({ name: COLOR_NAMES_EN[c.slug] ?? c.name })),
          ),
          sizes: merged(
            ar.sizes,
            (ar.sizes ?? []).map((s) => ({ label: english.sizeLabels?.[s.label] ?? s.label })),
          ),
          printArea: { ...ar.printArea, label: PRINT_AREA_LABEL_EN },
          printMethodLabel: PRINT_METHOD_EN,
        },
        context: CONTEXT,
      });
      done(`en product ${ar.slug}`);
    }
  }

  // faqs
  {
    const { docs } = await payload.find({ collection: 'faqs', ...AR, limit: 200 });
    for (const ar of docs) {
      const english = faqEn[ar.question];
      if (!english) {
        skip(`en faq ${ar.question.slice(0, 20)} (no English seed)`);
        continue;
      }
      const en = await payload.findByID({ collection: 'faqs', id: ar.id, ...EN });
      if (en.question) {
        skip(`en faq ${ar.question.slice(0, 20)}`);
        continue;
      }
      await payload.update({
        collection: 'faqs',
        id: ar.id,
        locale: 'en',
        data: english,
        context: CONTEXT,
      });
      done(`en faq ${ar.question.slice(0, 20)}`);
    }
  }

  // integrations
  {
    const { docs } = await payload.find({ collection: 'integrations', ...AR, limit: 20 });
    for (const ar of docs) {
      const english = integrationsEn[ar.platform];
      if (!english) {
        skip(`en integration ${ar.platform} (no English seed)`);
        continue;
      }
      const en = await payload.findByID({ collection: 'integrations', id: ar.id, ...EN });
      if (en.name) {
        skip(`en integration ${ar.platform}`);
        continue;
      }
      await payload.update({
        collection: 'integrations',
        id: ar.id,
        locale: 'en',
        data: english,
        context: CONTEXT,
      });
      done(`en integration ${ar.platform}`);
    }
  }

  // testimonials
  {
    const { docs } = await payload.find({
      collection: 'testimonials',
      ...AR,
      limit: 50,
      draft: true,
    });
    for (const ar of docs) {
      const english = testimonialsEn[ar.name];
      if (!english) {
        skip(`en testimonial ${ar.name} (no English seed)`);
        continue;
      }
      const en = await payload.findByID({
        collection: 'testimonials',
        id: ar.id,
        ...EN,
        draft: true,
      });
      if (en.quote) {
        skip(`en testimonial ${ar.name}`);
        continue;
      }
      await payload.update({
        collection: 'testimonials',
        id: ar.id,
        locale: 'en',
        data: english,
        context: CONTEXT,
      });
      done(`en testimonial ${ar.name}`);
    }
  }

  // media: the English alt of every file the seed ships (a file it does not know is skipped).
  {
    const { docs } = await payload.find({ collection: 'media', ...AR, limit: 500 });
    for (const ar of docs) {
      const alt = ar.filename ? mediaAltEn(ar.filename) : null;
      if (!alt) {
        skip(`en media ${ar.filename ?? ar.id} (no English alt)`);
        continue;
      }
      const en = await payload.findByID({ collection: 'media', id: ar.id, ...EN });
      if (en.alt) {
        skip(`en media ${ar.filename}`);
        continue;
      }
      await payload.update({
        collection: 'media',
        id: ar.id,
        locale: 'en',
        data: { alt },
        context: CONTEXT,
      });
      done(`en media ${ar.filename}`);
    }
  }

  // pages
  {
    const { docs } = await payload.find({ collection: 'pages', ...AR, limit: 50, draft: true });
    for (const ar of docs) {
      const english = pagesEn[ar.slug];
      if (!english) {
        skip(`en page ${ar.slug} (no English seed)`);
        continue;
      }
      const en = await payload.findByID({ collection: 'pages', id: ar.id, ...EN, draft: true });
      if (en.title) {
        skip(`en page ${ar.slug}`);
        continue;
      }
      const blocks = (ar.blocks ?? []).map((block, i) => {
        const patch = (english.blocks[i] ?? {}) as Record<string, unknown>;
        const original = block as unknown as Row;
        // An array of rows (items, rows, bestFor, notBestFor) is merged by position so the
        // rows keep their ids across locales; a group (booking) is merged by key.
        const row: Row = { ...original };
        for (const [key, value] of Object.entries(patch)) {
          if (Array.isArray(value)) {
            row[key] = merged(original[key] as Row[] | undefined, value as Row[]);
          } else if (value && typeof value === 'object') {
            row[key] = { ...(original[key] as Row | undefined), ...(value as Row) };
          } else {
            row[key] = value;
          }
        }
        return row;
      });
      await payload.update({
        collection: 'pages',
        id: ar.id,
        locale: 'en',
        // A page seeded as a draft stays one: an update without `draft` publishes it.
        draft: ar._status === 'draft',
        data: {
          title: english.title,
          ...(english.lead ? { lead: english.lead } : {}),
          blocks: blocks as never,
          seo: { ...ar.seo, title: english.seo.title, description: english.seo.description },
        },
        context: CONTEXT,
      });
      done(`en page ${ar.slug}`);
    }
  }

  // The blog (5b): hubs, the author, the three Level 1 posts.
  {
    const { docs } = await payload.find({ collection: 'categories', ...AR, limit: 50 });
    for (const ar of docs) {
      const english = blogHubsEn[ar.slug];
      if (!english) throw new Error(`seed en: no English hub for ${ar.slug}`);
      const en = await payload.findByID({ collection: 'categories', id: ar.id, ...EN });
      if (en.name) {
        skip(`en hub ${ar.slug}`);
        continue;
      }
      await payload.update({
        collection: 'categories',
        id: ar.id,
        locale: 'en',
        data: english,
        context: CONTEXT,
      });
      done(`en hub ${ar.slug}`);
    }
  }
  {
    const { docs } = await payload.find({ collection: 'authors', ...AR, limit: 50 });
    for (const ar of docs) {
      const en = await payload.findByID({ collection: 'authors', id: ar.id, ...EN });
      if (en.name) {
        skip(`en author ${ar.slug}`);
        continue;
      }
      await payload.update({
        collection: 'authors',
        id: ar.id,
        locale: 'en',
        data: blogAuthorEn,
        context: CONTEXT,
      });
      done(`en author ${ar.slug}`);
    }
  }
  {
    const { docs } = await payload.find({ collection: 'posts', ...AR, limit: 100, draft: true });
    const editorConfig = editorConfigFactory.fromField({ field: postBodyField(payload) });
    for (const ar of docs) {
      const english = blogPostsEn[ar.slug];
      // Engine posts and an editor's own posts have no English seed; they stay Arabic-only.
      if (!english) continue;
      const en = await payload.findByID({ collection: 'posts', id: ar.id, ...EN, draft: true });
      if (en.title) {
        skip(`en post ${ar.slug}`);
        continue;
      }
      const body = convertMarkdownToLexical({ editorConfig, markdown: blogPostBodyEn(ar.slug) });
      await payload.update({
        collection: 'posts',
        id: ar.id,
        locale: 'en',
        data: {
          title: english.title,
          excerpt: english.excerpt,
          // The rows are shared and the text per language (ADR-057, PR A): the English
          // text rides on the Arabic row of the same position, by its id.
          takeaways: english.takeaways.map((text, i) => {
            const id = ar.takeaways?.[i]?.id;
            return id ? { id, text } : { text };
          }),
          body: body as never,
          ...(english.seoTitle ? { seo: { ...ar.seo, title: english.seoTitle } } : {}),
        },
        context: CONTEXT,
      });
      done(`en post ${ar.slug}`);
    }
  }

  return out;
}
