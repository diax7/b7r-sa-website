import type { PayloadRequest } from 'payload';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

const {
  PATHS_FOR_PRODUCTS,
  pathsForProduct,
  revalidateGlobal,
  revalidateProducts,
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

beforeEach(() => revalidatePath.mockClear());
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
});
