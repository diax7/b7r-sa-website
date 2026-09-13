import type { PayloadRequest } from 'payload';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

const {
  isVisibleChange,
  PATHS_FOR_FAQS,
  PATHS_FOR_PRODUCTS,
  pathsForProduct,
  resetRevalidateWarning,
  revalidateGlobal,
  revalidateProducts,
  revalidateRoutes,
  safeRevalidatePath,
  shouldRevalidate,
  STATIC_ROUTES,
} = await import('@/modules/cms/hooks/revalidate');

type Hook = (args: unknown) => unknown;
type Doc = Record<string, unknown>;

const req = (context: Record<string, unknown> = {}) =>
  ({ context, payload: {} }) as unknown as PayloadRequest;

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
    expect(PATHS_FOR_PRODUCTS).toEqual(['/', '/products', '/sitemap.xml']);
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
    expect(revalidatePath).toHaveBeenCalledTimes(5);
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
    expect(paths()).toEqual([...PATHS_FOR_FAQS].toSorted());
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
    expect(paths()).toEqual(['/']);
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
