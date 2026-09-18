import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  otherLocaleUrl,
  useOtherLocale,
  type OtherLocaleSource,
} from '@/modules/cms/admin/fields/bilingual/other-locale';

/**
 * The other locale's read behind every bilingual field (ADR-057): one request per document
 * view however many fields share it, read again after a save, the earlier read standing in
 * until the fresh one lands, and a failure that stays a failure rather than a retry storm.
 */
const source = (over: Partial<OtherLocaleSource> = {}): OtherLocaleSource => ({
  apiRoute: '/api/payload',
  collection: 'pages',
  id: 7,
  locale: 'en',
  lastUpdateTime: 1000,
  ...over,
});

const ok = (doc: Record<string, unknown>) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(doc) } as Response);

afterEach(() => vi.unstubAllGlobals());

describe('otherLocaleUrl', () => {
  it('reads the document in the other locale, without the fallback, with drafts, flat', () => {
    expect(otherLocaleUrl(source())).toBe(
      '/api/payload/pages/7?locale=en&fallback-locale=none&draft=true&depth=0',
    );
    expect(otherLocaleUrl(source({ collection: undefined, global: 'site-settings' }))).toBe(
      '/api/payload/globals/site-settings?locale=en&fallback-locale=none&draft=true&depth=0',
    );
  });

  it('a document not created yet has nothing to read', () => {
    expect(otherLocaleUrl(source({ id: undefined }))).toBeNull();
    expect(otherLocaleUrl(source({ id: '' }))).toBeNull();
  });
});

describe('useOtherLocale', () => {
  it('two fields of one document share one read; a save reads again and the old doc stands in', async () => {
    const fetch = vi.fn().mockImplementationOnce(() => ok({ title: 'Old' }));
    vi.stubGlobal('fetch', fetch);
    const a = renderHook((s: OtherLocaleSource) => useOtherLocale(s), { initialProps: source() });
    const b = renderHook((s: OtherLocaleSource) => useOtherLocale(s), { initialProps: source() });
    expect(a.result.current.status).toBe('loading');
    await waitFor(() => expect(a.result.current.status).toBe('ready'));
    expect(b.result.current).toEqual({ status: 'ready', doc: { title: 'Old' } });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      '/api/payload/pages/7?locale=en&fallback-locale=none&draft=true&depth=0',
      { credentials: 'include' },
    );
    // After a save: a new lastUpdateTime, one more read, the earlier doc shown meanwhile.
    const gate = Promise.withResolvers<Response>();
    fetch.mockImplementationOnce(() => gate.promise);
    act(() => {
      a.rerender(source({ lastUpdateTime: 2000 }));
      b.rerender(source({ lastUpdateTime: 2000 }));
    });
    expect(a.result.current).toEqual({ status: 'ready', doc: { title: 'Old' }, stale: true });
    expect(fetch).toHaveBeenCalledTimes(2);
    await act(async () => {
      gate.resolve(await ok({ title: 'New' }));
    });
    await waitFor(() => expect(a.result.current.doc).toEqual({ title: 'New' }));
    expect(b.result.current).toEqual({ status: 'ready', doc: { title: 'New' } });
  });

  it('a failed read is an error state, read once', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: false } as Response);
    vi.stubGlobal('fetch', fetch);
    const { result } = renderHook(() => useOtherLocale(source({ id: 8 })));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('a document not created yet is ready and empty, with no request', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { result } = renderHook(() => useOtherLocale(source({ id: undefined })));
    expect(result.current).toEqual({ status: 'ready', doc: {} });
    expect(fetch).not.toHaveBeenCalled();
  });
});
