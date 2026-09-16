import type { Payload, TypedUser } from 'payload';
import { type LexicalNode, walk } from '@/lib/lexical';
import { env } from '@/lib/env';
import { indexNowKey } from '@/lib/indexnow';
import { PUBLISHED } from '@/lib/cms/read';
import { localeEnabledWith } from '@/lib/cms/locale-enabled';
import { riyadh } from '@/lib/riyadh';
import { citationRows, citedRateOf, lastLedgerRunAt } from '@/modules/visibility/ledger/reading';
import { latestMetrics } from '@/modules/visibility/metrics';
import { CHECKLIST_ITEMS } from '@/modules/visibility/rules/rest';
import type { PageSpeedSnapshot } from '@/modules/visibility/services/pagespeed';
import type { SearchConsoleSnapshot } from '@/modules/visibility/services/search-console';
import type {
  Loc,
  Snapshot,
  SnapshotAuthor,
  SnapshotDoc,
  SnapshotMedia,
  SnapshotPost,
  SnapshotProduct,
} from '@/modules/visibility/types';

type Row = Record<string, unknown>;

/** A localized field as `locale: 'all'` returns it: an object per language, or a plain string. */
function locOf(value: unknown): Loc {
  if (typeof value === 'string') return { ar: value };
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return {
      ar: typeof v['ar'] === 'string' ? v['ar'] : null,
      en: typeof v['en'] === 'string' ? v['en'] : null,
    };
  }
  return {};
}

function idOf(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && typeof (value as Row)['id'] === 'number') {
    return (value as Row)['id'] as number;
  }
  return null;
}

function group(value: unknown): Row {
  return value && typeof value === 'object' ? (value as Row) : {};
}

/**
 * Everything the rules read, in one pass (ADR-049): every published document in both
 * languages (`locale: 'all'`), the media rows they use, the settings, the checklist, the
 * connections without their keys, the counters. With a `user` the reads run under that
 * user's access (the page); without one as the server (the nightly snapshot).
 */
export async function buildSnapshot(
  payload: Payload,
  options: { user?: TypedUser | null; now?: Date } = {},
): Promise<Snapshot> {
  const now = options.now ?? new Date();
  const access = options.user
    ? { user: options.user, overrideAccess: false as const }
    : { overrideAccess: true as const };
  const read = <T = Row>(collection: string, where?: Record<string, unknown>) =>
    payload
      .find({
        collection: collection as never,
        locale: 'all',
        depth: 0,
        pagination: false,
        ...(where ? { where: where as never } : {}),
        ...access,
      })
      .then((r) => r.docs as unknown as T[]);
  const global = (slug: string, all = true) =>
    payload
      .findGlobal({
        slug: slug as never,
        ...(all ? { locale: 'all' as const } : {}),
        depth: 0,
        ...access,
      })
      .then((doc) => doc as unknown as Row);
  const [site, seo, home, checklist, pages, products, posts, hubs, authors, faqs, connections] =
    await Promise.all([
      global('site-settings'),
      global('seo-defaults'),
      global('home'),
      global('visibility-checklist', false),
      read('pages', PUBLISHED),
      read('products', PUBLISHED),
      read('posts', PUBLISHED),
      read('categories'),
      read('authors'),
      read('faqs'),
      read('connections'),
    ]);
  const englishOn = await localeEnabledWith(payload, 'en');
  const used = new Map<number, string[]>();
  const use = (id: unknown, by: string) => {
    const n = idOf(id);
    if (n === null) return;
    used.set(n, [...(used.get(n) ?? []), by]);
  };
  const productRows: SnapshotProduct[] = products.map((p) => {
    const name = locOf(p['name']);
    for (const colour of (p['colors'] as Row[] | undefined) ?? []) {
      use(colour['front'], name.ar ?? String(p['slug']));
      use(colour['back'], name.ar ?? String(p['slug']));
    }
    return {
      id: p['id'] as number,
      slug: String(p['slug']),
      title: name,
      shortDescription: locOf(p['shortDescription']),
      baseCost: Number(p['baseCost'] ?? 0),
      sortOrder: Number(p['sortOrder'] ?? 0),
    };
  });
  const postRows: SnapshotPost[] = posts.map((p) => {
    const title = locOf(p['title']);
    use(p['cover'], title.ar ?? String(p['slug']));
    const seoGroup = p['seo'];
    const body = p['body'] as { ar?: unknown; en?: unknown } | undefined;
    // Photos inline in the body (upload nodes) are photos in use too.
    for (const state of [body?.ar, body?.en]) {
      const root = (state as { root?: LexicalNode } | null | undefined)?.root;
      if (!root) continue;
      for (const node of walk(root)) {
        if (node.type === 'upload') use(node['value'], title.ar ?? String(p['slug']));
      }
    }
    return {
      id: p['id'] as number,
      slug: String(p['slug']),
      title,
      excerpt: locOf(p['excerpt']),
      seo: {
        title: locOf(group(seoGroup)['title']),
        description: locOf(group(seoGroup)['description']),
      },
      body: {
        ar: (body?.ar as SnapshotPost['body']['ar']) ?? null,
        en: (body?.en as SnapshotPost['body']['en']) ?? null,
      },
      author: idOf(p['author']),
    };
  });
  const pageRows: Snapshot['pages'] = pages.map((p) => {
    const title = locOf(p['title']);
    // The blocks' photos: the story's, the cards' art, the steps' icons, the media banner's.
    for (const block of (p['blocks'] as Row[] | undefined) ?? []) {
      for (const key of ['photo', 'media']) use(block[key], title.ar ?? String(p['slug']));
      for (const item of (block['items'] as Row[] | undefined) ?? []) {
        for (const key of ['art', 'icon']) use(item[key], title.ar ?? String(p['slug']));
      }
    }
    return {
      id: p['id'] as number,
      slug: String(p['slug']),
      title,
      blocks: ((p['blocks'] as Row[] | undefined) ?? []).map((block) => ({
        type: String(block['blockType'] ?? ''),
        asOf: typeof block['asOf'] === 'string' ? block['asOf'] : null,
      })),
      seo: {
        title: locOf(group(p['seo'])['title']),
        description: locOf(group(p['seo'])['description']),
      },
      lead: locOf(p['lead']),
    };
  });
  const hubRows: SnapshotDoc[] = hubs.map((h) => {
    const name = locOf(h['name']);
    use(h['defaultCover'], name.ar ?? String(h['slug']));
    return {
      id: h['id'] as number,
      slug: String(h['slug']),
      title: name,
      lead: locOf(h['description']),
    };
  });
  const authorRows: SnapshotAuthor[] = authors.map((a) => {
    const name = locOf(a['name']);
    use(a['photo'], name.ar ?? `author ${String(a['id'])}`);
    return {
      id: a['id'] as number,
      name,
      bio: locOf(a['bio']),
      photo: idOf(a['photo']),
      sameAs: ((a['sameAs'] as unknown[] | undefined) ?? []).length,
    };
  });
  for (const slide of (group(home['hero'])['slides'] as Row[] | undefined) ?? []) {
    use(slide['imageDesktop'], 'home hero');
    use(slide['imageMobile'], 'home hero');
  }
  const mediaRows: SnapshotMedia[] = used.size
    ? (await read('media', { id: { in: [...used.keys()] } })).map((m) => ({
        id: m['id'] as number,
        filename: String(m['filename'] ?? m['id']),
        alt: locOf(m['alt']),
        usedBy: [...new Set(used.get(m['id'] as number) ?? [])],
      }))
    : [];
  const [pagespeed, searchConsole, prompts, citations, ledgerRunAt] = await Promise.all([
    latestMetrics<PageSpeedSnapshot>(payload, 'pagespeed', 3),
    latestMetrics<SearchConsoleSnapshot>(payload, 'search-console', 1),
    read('prompts'),
    citationRows(payload, access, now),
    lastLedgerRunAt(payload, access),
  ]);
  const landings = await payload.count({
    collection: 'traffic',
    where: {
      and: [
        { kind: { equals: 'landing' } },
        { date: { greater_than_equal: riyadh(new Date(now.getTime() - 29 * 86_400_000)).dateKey } },
      ],
    },
    ...access,
  });
  return {
    at: now.toISOString(),
    adminRoute: payload.config.routes.admin,
    isProductionSite: env.isProductionSite,
    englishOn,
    indexNow: Boolean(indexNowKey()),
    gaConfigured: Boolean(env.gaId),
    site: {
      tagline: locOf(site['tagline']),
      social: {
        x: String(group(site['social'])['x'] ?? ''),
        instagram: String(group(site['social'])['instagram'] ?? ''),
        tiktok: String(group(site['social'])['tiktok'] ?? ''),
      },
    },
    titleTemplate: locOf(seo['titleTemplate']),
    routes: ((seo['routes'] as Row[] | undefined) ?? []).map((r) => ({
      route: String(r['route']),
      title: locOf(r['title']),
      description: locOf(r['description']),
    })),
    pages: pageRows,
    products: productRows,
    posts: postRows,
    hubs: hubRows,
    authors: authorRows,
    faqs: faqs.map((f) => ({ id: f['id'] as number, question: locOf(f['question']) })),
    media: mediaRows,
    checklist: Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i.key, checklist[i.key] === true])),
    connections: connections.map((c) => ({
      id: c['id'] as number,
      kind: String(c['kind']),
      enabled: c['enabled'] !== false,
      lastTestOk: typeof c['lastTestOk'] === 'boolean' ? c['lastTestOk'] : null,
    })),
    landings30d: landings.totalDocs,
    prompts: prompts.map((p) => ({
      language: p['language'] === 'en' ? 'en' : 'ar',
      enabled: p['enabled'] !== false,
      namesBrand: p['namesBrand'] === true,
    })),
    lastLedgerRunAt: ledgerRunAt,
    citedRate: citedRateOf(citations),
    pagespeed: pagespeed
      .map((row) => ({
        date: row.date,
        mobilePerformance: Object.fromEntries(
          row.data.audits
            .filter((a) => a.strategy === 'mobile' && a.scores.performance !== null)
            .map((a) => [a.url, a.scores.performance!]),
        ),
      }))
      .toReversed(),
    searchConsole: searchConsole[0]
      ? {
          impressions: searchConsole[0].data.totals.impressions,
          topQueries: searchConsole[0].data.queries.map((q) => q.key),
        }
      : null,
  };
}
