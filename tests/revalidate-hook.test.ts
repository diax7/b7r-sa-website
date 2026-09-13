import type { PayloadRequest } from 'payload';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

const {
  PATHS_FOR_GLOBAL,
  PATHS_FOR_PRODUCTS,
  revalidateGlobal,
  revalidateProducts,
  shouldRevalidate,
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

describe('publish hooks (BRD 9.6, ADR-030): static routes regenerate at once, never a rebuild', () => {
  it('a published product change regenerates the home, the listing and the sitemap', () => {
    changed({ slug: 'hoodie', _status: 'published' });
    expect(paths()).toEqual([...PATHS_FOR_PRODUCTS].toSorted());
  });

  it('never revalidates a product detail page: dynamicParams=false routes 404 afterwards', () => {
    changed({ slug: 'hoodie', _status: 'published' });
    deleted({ slug: 'hoodie', _status: 'published' });
    expect(paths().some((p) => p.startsWith('/products/'))).toBe(false);
    expect(PATHS_FOR_PRODUCTS).not.toContain(expect.stringMatching(/^\/products\/./));
  });

  it('a draft autosave changes nothing on the site', () => {
    changed({ slug: 'hoodie', _status: 'draft' }, { slug: 'hoodie', _status: 'draft' });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('unpublishing removes the product, so it regenerates like a publish', () => {
    changed({ slug: 'hoodie', _status: 'draft' }, { slug: 'hoodie', _status: 'published' });
    expect(paths()).toEqual([...PATHS_FOR_PRODUCTS].toSorted());
  });

  it('a delete always regenerates', () => {
    deleted({ slug: 'hoodie', _status: 'published' });
    expect(paths()).toContain('/products');
  });

  it('the seed script and the build phase are exempt', () => {
    changed({ slug: 'hoodie', _status: 'published' }, undefined, { disableRevalidate: true });
    expect(revalidatePath).not.toHaveBeenCalled();
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    expect(shouldRevalidate(req())).toBe(false);
    changed({ slug: 'hoodie', _status: 'published' });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('a global regenerates every static route that renders it', () => {
    (revalidateGlobal('site-settings') as Hook)({ doc: {}, req: req(), global: {}, context: {} });
    expect(paths()).toEqual([...(PATHS_FOR_GLOBAL['site-settings'] ?? [])].toSorted());
    expect(paths()).toContain('/contact');
    revalidatePath.mockClear();
    (revalidateGlobal('something-new') as Hook)({ doc: {}, req: req(), global: {}, context: {} });
    expect(paths()).toEqual(['/']);
  });
});
