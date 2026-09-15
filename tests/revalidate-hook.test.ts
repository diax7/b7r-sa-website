import type { PayloadRequest } from 'payload';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

const {
  isDraftSave,
  isVisibleChange,
  PATHS_FOR_FAQS,
  PATHS_FOR_PRODUCTS,
  pathsForProduct,
  resetRevalidateWarning,
  revalidateGlobal,
  revalidatePages,
  revalidateProducts,
  revalidateRoutes,
  safeRevalidatePath,
  shouldRevalidate,
  STATIC_ROUTES,
  withEnglish,
} = await import('@/modules/cms/hooks/revalidate');

type Hook = (args: unknown) => unknown;
type Doc = Record<string, unknown>;

/** The site is in English unless a test says otherwise (the hooks ask the globals). */
let english = true;
/** The English gate reads the site settings' brand name and the menu's CTA (ADR-046). */
const findGlobal = async ({ slug }: { slug: string }) =>
  slug === 'site-settings'
    ? { brandName: english ? 'B7R Print' : '', menu: { ctaLabel: english ? 'Start' : '' } }
    : {};

const req = (context: Record<string, unknown> = {}, locale?: string) =>
  ({ context, locale, payload: { findGlobal } }) as unknown as PayloadRequest;

const paths = () => revalidatePath.mock.calls.map((c) => c[0] as string).toSorted();

function changed(doc: Doc, previousDoc: Doc = doc, context: Record<string, unknown> = {}) {
  return (revalidateProducts as Hook)({
    doc,
    previousDoc,
    operation: 'update',
    req: req(context),
    collection: { slug: 'products' },
    context,
  });
}

function deleted(doc: Doc) {
  return (revalidateProducts as Hook)({
    doc,
    id: 1,
    req: req(),
    collection: { slug: 'products' },
    context: {},
  });
}

beforeEach(() => {
  english = true;
  revalidatePath.mockClear();
  revalidatePath.mockImplementation(() => undefined);
  resetRevalidateWarning();
});
afterEach(() => vi.unstubAllEnvs());

describe('publish hooks (BRD 9.6, ADR-030): the affected routes regenerate at once', () => {
  it('a published product change regenerates its page, the home, the listing and the sitemap', () => {
    changed({ slug: 'hoodie', _status: 'published' });
    expect(paths()).toEqual(pathsForProduct('hoodie').toSorted());
    expect(paths()).toContain('/products/hoodie');
    // Both documents regenerate (ADR-043); the sitemap serves both.
    expect(PATHS_FOR_PRODUCTS).toEqual([
      '/',
      '/en',
      '/products',
      '/en/products',
      '/llms.txt',
      '/en/llms.txt',
      '/sitemap.xml',
    ]);
    expect(paths()).toContain('/en/products/hoodie');
  });

  it('a draft autosave changes nothing on the site', () => {
    changed({ slug: 'hoodie', _status: 'draft' }, { slug: 'hoodie', _status: 'draft' });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('unpublishing removes the product, so it regenerates like a publish', () => {
    changed({ slug: 'hoodie', _status: 'draft' }, { slug: 'hoodie', _status: 'published' });
    expect(paths()).toContain('/products/hoodie');
    expect(paths()).toContain('/products');
  });

  it('a slug change clears the old URL as well as the new one', () => {
    changed({ slug: 'hoodie-2', _status: 'published' }, { slug: 'hoodie', _status: 'published' });
    expect(paths()).toContain('/products/hoodie');
    expect(paths()).toContain('/products/hoodie-2');
    expect(paths()).toContain('/en/products/hoodie-2');
    expect(revalidatePath).toHaveBeenCalledTimes(11);
  });

  it('a delete always regenerates, the page included so it turns 404', () => {
    deleted({ slug: 'hoodie', _status: 'published' });
    expect(paths()).toContain('/products/hoodie');
    expect(paths()).toContain('/sitemap.xml');
  });

  it('the seed script and the build phase are exempt', () => {
    changed({ slug: 'hoodie', _status: 'published' }, undefined, { disableRevalidate: true });
    expect(revalidatePath).not.toHaveBeenCalled();
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    expect(shouldRevalidate(req())).toBe(false);
    changed({ slug: 'hoodie', _status: 'published' });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('a global regenerates every static route, never a product page', () => {
    (revalidateGlobal as Hook)({ doc: {}, req: req(), global: {}, context: {} });
    expect(paths()).toEqual([...STATIC_ROUTES].toSorted());
    expect(paths()).toContain('/contact');
    expect(paths().some((p) => p.startsWith('/products/'))).toBe(false);
  });

  it('a draft autosave of a versioned global (home) changes nothing until it is published', () => {
    const run = (doc: Doc, previousDoc?: Doc) =>
      (revalidateGlobal as Hook)({ doc, previousDoc, req: req(), global: {}, context: {} });
    run({ _status: 'draft' }, { _status: 'draft' });
    expect(revalidatePath).not.toHaveBeenCalled();
    run({ _status: 'published' }, { _status: 'draft' });
    expect(paths()).toContain('/');
  });

  it('collections with fixed routes (faqs, testimonials, integrations) regenerate those', () => {
    const hook = revalidateRoutes(PATHS_FOR_FAQS) as Hook;
    hook({ doc: { question: 'q' }, req: req(), collection: { slug: 'faqs' }, context: {} });
    // The fixed routes regenerate in both languages (ADR-043).
    expect(paths()).toEqual(withEnglish(PATHS_FOR_FAQS).toSorted());
    revalidatePath.mockClear();
    // A versioned collection: a never-published draft is invisible, a delete of a published one is not.
    const versioned = revalidateRoutes(['/']) as Hook;
    versioned({
      doc: { _status: 'draft' },
      previousDoc: { _status: 'draft' },
      req: req(),
      context: {},
    });
    expect(revalidatePath).not.toHaveBeenCalled();
    versioned({ doc: { _status: 'published' }, id: 1, req: req(), context: {} });
    expect(paths()).toEqual(['/', '/en']);
  });

  it('isVisibleChange: unversioned always; versioned when published now or before', () => {
    expect(isVisibleChange({ doc: { title: 'x' } })).toBe(true);
    expect(isVisibleChange({ doc: { _status: 'draft' } })).toBe(false);
    expect(
      isVisibleChange({ doc: { _status: 'draft' }, previousDoc: { _status: 'published' } }),
    ).toBe(true);
    expect(
      isVisibleChange({ doc: { _status: 'published' }, previousDoc: { _status: 'draft' } }),
    ).toBe(true);
  });
});

/** What `revalidatePath` throws when no request store exists (a job, a scheduled publish). */
const storeMissing = () => {
  throw new Error('Invariant: static generation store missing in revalidatePath /');
};

/** A request carrying `?draft=true`, as Payload parses it. */
const draftReq = (context: Record<string, unknown> = {}) =>
  ({ context, payload: {}, query: { draft: true } }) as unknown as PayloadRequest;

describe('IndexNow gating (ADR-033): a publish pings, a draft save never does', () => {
  it('isDraftSave reads the parsed boolean or the raw string', () => {
    expect(isDraftSave(draftReq())).toBe(true);
    expect(isDraftSave({ query: { draft: 'true' } } as unknown as PayloadRequest)).toBe(true);
    expect(isDraftSave(req())).toBe(false);
  });

  it('an autosave on a published page regenerates but queues nothing; a publish queues once', async () => {
    vi.stubEnv('B7R_RUNTIME', 'production');
    vi.stubEnv('INDEXNOW_KEY', 'a1b2c3d4e5f6g7h8');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://b7r.sa');
    const queue = vi.fn(async () => ({}));
    const withQueue = (r: PayloadRequest) =>
      ({
        ...r,
        payload: { findGlobal, jobs: { queue }, logger: { warn: vi.fn() } },
      }) as unknown as PayloadRequest;
    const hook = revalidatePages as (args: unknown) => Promise<unknown>;
    const published = { slug: 'creators', _status: 'published' };
    await hook({
      doc: { ...published, _status: 'draft' },
      previousDoc: published,
      operation: 'update',
      req: withQueue(draftReq()),
      context: {},
    });
    expect(paths()).toContain('/creators');
    expect(queue).not.toHaveBeenCalled();
    revalidatePath.mockClear();
    await hook({
      doc: published,
      previousDoc: { ...published, _status: 'draft' },
      operation: 'update',
      req: withQueue(req()),
      context: {},
    });
    expect(queue).toHaveBeenCalledTimes(1);
    // Saved in Arabic: the Arabic page is what changed (ADR-043); the English twin is not pinged.
    expect(
      (queue.mock.calls[0] as unknown as [{ input: { urls: string[] } }])[0].input.urls,
    ).toEqual(['https://b7r.sa/creators']);
    // An unpublish (no draft flag) still tells the engines to recrawl.
    await hook({
      doc: { ...published, _status: 'draft' },
      previousDoc: published,
      operation: 'update',
      req: withQueue(req()),
      context: {},
    });
    expect(queue).toHaveBeenCalledTimes(2);
  });
});

const urls = (queue: ReturnType<typeof vi.fn>) =>
  (queue.mock.calls[0] as unknown as [{ input: { urls: string[] } }])[0].input.urls;

describe('what IndexNow hears about a publish (ADR-043)', () => {
  const pinging = (locale?: string) => {
    const queue = vi.fn(async () => ({}));
    const r = {
      ...req({}, locale),
      payload: { findGlobal, jobs: { queue }, logger: { warn: vi.fn() } },
    } as unknown as PayloadRequest;
    return { queue, req: r };
  };
  beforeEach(() => {
    vi.stubEnv('B7R_RUNTIME', 'production');
    vi.stubEnv('INDEXNOW_KEY', 'a1b2c3d4e5f6g7h8');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://b7r.sa');
  });

  it('an Arabic product publish pings its Arabic page and the listings of both languages', async () => {
    const { queue, req: r } = pinging();
    await (revalidateProducts as Hook)({
      doc: { slug: 'hoodie', _status: 'published' },
      previousDoc: { slug: 'hoodie', _status: 'draft' },
      operation: 'update',
      req: r,
      collection: { slug: 'products' },
      context: {},
    });
    expect(urls(queue).toSorted()).toEqual([
      'https://b7r.sa',
      'https://b7r.sa/en',
      'https://b7r.sa/en/products',
      'https://b7r.sa/products',
      'https://b7r.sa/products/hoodie',
    ]);
    // Both documents regenerate all the same.
    expect(paths()).toContain('/en/products/hoodie');
  });

  it('a save from the English tab pings the English page instead', async () => {
    const { queue, req: r } = pinging('en');
    await (revalidateProducts as Hook)({
      doc: { slug: 'hoodie', _status: 'published' },
      previousDoc: { slug: 'hoodie', _status: 'published' },
      operation: 'update',
      req: r,
      collection: { slug: 'products' },
      context: {},
    });
    expect(urls(queue)).toContain('https://b7r.sa/en/products/hoodie');
    expect(urls(queue)).not.toContain('https://b7r.sa/products/hoodie');
  });

  it('never pings an English URL while the site is not in English (a 404 submission)', async () => {
    english = false;
    const { queue, req: r } = pinging('en');
    await (revalidateProducts as Hook)({
      doc: { slug: 'hoodie', _status: 'published' },
      previousDoc: { slug: 'hoodie', _status: 'draft' },
      operation: 'update',
      req: r,
      collection: { slug: 'products' },
      context: {},
    });
    expect(urls(queue).some((u) => u.includes('/en'))).toBe(false);
    expect(urls(queue)).toContain('https://b7r.sa/products/hoodie');
    // Revalidation still covers the English routes: a regenerated 404 costs nothing.
    expect(paths()).toContain('/en/products/hoodie');
  });

  it('a global change pings every static route of both languages, never the sitemap', async () => {
    const { queue, req: r } = pinging();
    await (revalidateGlobal as Hook)({ doc: {}, req: r, global: {}, context: {} });
    expect(urls(queue)).toContain('https://b7r.sa/en/faq');
    expect(urls(queue)).toContain('https://b7r.sa/faq');
    expect(urls(queue).some((u) => u.includes('sitemap') || u.includes('manifest'))).toBe(false);
  });
});

describe('safeRevalidatePath (ADR-033): outside a request the timer covers it', () => {
  it('swallows the missing-store invariant, logs once, and keeps revalidating later paths', () => {
    revalidatePath.mockImplementation(storeMissing);
    const logger = { info: vi.fn() };
    safeRevalidatePath('/', logger);
    safeRevalidatePath('/faq', logger);
    expect(revalidatePath).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info.mock.calls[0]?.[0]).toMatch(/outside a request.*60 s timer/);
  });

  it('also swallows the "during render" refusal a cron inside a render context gets', () => {
    revalidatePath.mockImplementation(() => {
      throw new Error(
        'Route /admin/[[...segments]] used "revalidatePath /x" during render which is unsupported.',
      );
    });
    const logger = { info: vi.fn() };
    expect(() => safeRevalidatePath('/x', logger)).not.toThrow();
    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it('rethrows anything that is not the missing-store invariant', () => {
    revalidatePath.mockImplementation(() => {
      throw new Error('ENOSPC');
    });
    expect(() => safeRevalidatePath('/', { info: vi.fn() })).toThrow('ENOSPC');
  });

  it('a hook fired from a job (no request store) neither throws nor stops the other paths', () => {
    revalidatePath.mockImplementation(storeMissing);
    const logger = { info: vi.fn() };
    expect(() =>
      changed({ slug: 'hoodie', _status: 'published' }, { slug: 'hoodie', _status: 'draft' }),
    ).not.toThrow();
    expect(revalidatePath).toHaveBeenCalledTimes(pathsForProduct('hoodie').length);
    expect(logger.info).not.toHaveBeenCalled();
  });
});
