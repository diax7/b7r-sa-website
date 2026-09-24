import { describe, expect, it, vi } from 'vitest';
import EnglishLayout from '@/app/(en)/en/layout';

const localeEnabled = vi.fn<(locale: string) => Promise<boolean>>();
const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});

vi.mock('next/navigation', () => ({ notFound: () => notFound() }));
vi.mock('@/lib/cms/settings', () => ({ localeEnabled: (l: string) => localeEnabled(l) }));
vi.mock('@/lib/cms', () => ({
  getSiteSettings: async () => ({ brandName: 'B7R Print' }),
  getNavigation: async () => ({ ctaLabel: 'Start' }),
}));
vi.mock('@/app/site-document', () => ({
  SiteDocument: (props: { locale: string; locales: readonly string[] }) => props,
}));
vi.mock('@/modules/core/draft-bar', () => ({ DraftBar: () => null }));
vi.mock('@/modules/brand', () => ({ getAppearance: async () => ({}) }));
vi.mock('@/modules/core/seo/metadata', () => ({ rootMetadata: async () => ({}) }));

describe('the English root layout (ADR-043)', () => {
  it('answers 404 instead of failing the build while the site is not in English', async () => {
    localeEnabled.mockResolvedValueOnce(false);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(EnglishLayout({ children: null })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('not in English yet'));
    error.mockRestore();
  });

  it('renders the English document with both locales once the site is in English', async () => {
    localeEnabled.mockResolvedValueOnce(true);
    const element = (await EnglishLayout({ children: null })) as unknown as {
      props: { locale: string; locales: readonly string[] };
    };
    expect(element.props.locale).toBe('en');
    expect(element.props.locales).toEqual(['ar', 'en']);
  });
});
