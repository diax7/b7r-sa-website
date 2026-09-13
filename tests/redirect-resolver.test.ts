import { describe, expect, it } from 'vitest';
import { resolveSlug, type SiteRedirect } from '@/lib/resolve-slug';
import { redirectFields, redirectProblem, referenceId } from '@/modules/cms/collections/redirects';

const redirects: SiteRedirect[] = [
  { from: '/showcase', to: '/products', permanent: true },
  { from: '/promo', to: 'https://example.com/promo', permanent: false },
];
const pages = new Set(['creators', 'showcase']);

describe('resolveSlug (ADR-032): redirect, then page, then nothing', () => {
  it('a redirect wins over a page of the same slug', () => {
    expect(resolveSlug('showcase', redirects, pages)).toEqual({
      kind: 'redirect',
      to: '/products',
      permanent: true,
    });
    expect(resolveSlug('promo', redirects, pages)).toEqual({
      kind: 'redirect',
      to: 'https://example.com/promo',
      permanent: false,
    });
    expect(resolveSlug('creators', redirects, pages)).toEqual({ kind: 'page' });
    expect(resolveSlug('nope', redirects, pages)).toBeNull();
  });
});

const custom = (url: string) => ({ type: 'custom' as const, url });

describe('redirectProblem: the rules an admin row must pass', () => {
  it('accepts a single-segment source to a site path or an https URL', () => {
    expect(redirectProblem('/showcase', custom('/products'), [])).toBeNull();
    expect(redirectProblem('/promo', custom('https://example.com/x'), [])).toBeNull();
    expect(redirectProblem('/old', { type: 'reference' }, [])).toBeNull();
  });

  it('refuses nested, malformed or code-owned sources', () => {
    expect(redirectProblem('/a/b', custom('/x'), [])).toMatch(/مقطع واحد/);
    expect(redirectProblem('showcase', custom('/x'), [])).toMatch(/مقطع واحد/);
    expect(redirectProblem('/Show', custom('/x'), [])).toMatch(/مقطع واحد/);
    expect(redirectProblem('/about', custom('/x'), [])).toMatch(/قائمة في الموقع/);
    expect(redirectProblem('/products', custom('/x'), [])).toMatch(/قائمة في الموقع/);
    expect(redirectProblem('/en', custom('/'), [])).toMatch(/قائمة في الموقع/);
    expect(redirectProblem(undefined, custom('/x'), [])).not.toBeNull();
  });

  it('refuses http, javascript and protocol-relative targets, self and loops', () => {
    expect(redirectProblem('/old', custom('http://example.com'), [])).toMatch(/https/);
    expect(redirectProblem('/old', custom('javascript:alert(1)'), [])).toMatch(/https/);
    expect(redirectProblem('/old', custom('//evil.com'), [])).toMatch(/https/);
    expect(redirectProblem('/old', custom('/old'), [])).toMatch(/المصدر نفسه/);
    expect(redirectProblem('/old', custom('/old/x'), [])).toMatch(/المصدر نفسه/);
    expect(redirectProblem('/old', custom('/older'), ['/older'])).toMatch(/حلقات/);
    expect(redirectProblem('/old', custom('/older'), ['/other'])).toBeNull();
  });

  it('reads the page id out of a reference target so the same self/loop rules apply', () => {
    expect(referenceId({ type: 'reference', reference: { relationTo: 'pages', value: 7 } })).toBe(
      7,
    );
    expect(
      referenceId({ type: 'reference', reference: { relationTo: 'pages', value: { id: 7 } } }),
    ).toBe(7);
    expect(referenceId({ type: 'custom', url: '/x' })).toBeUndefined();
    // Resolved to its path, a reference loops like a custom URL would.
    expect(redirectProblem('/a', custom('/b'), ['/b'])).toMatch(/حلقات/);
    expect(redirectProblem('/x', custom('/x'), [])).toMatch(/المصدر نفسه/);
  });

  it('labels the plugin fields in Arabic without changing their names', () => {
    const fields = redirectFields([
      { name: 'from', type: 'text' },
      {
        name: 'to',
        type: 'group',
        fields: [
          { name: 'type', type: 'radio', options: [] },
          { name: 'reference', type: 'relationship', relationTo: 'pages' },
          { name: 'url', type: 'text' },
        ],
      },
      { name: 'type', type: 'select', options: [] },
    ]);
    const names = fields.map((f) => ('name' in f ? f.name : ''));
    expect(names).toEqual(['from', 'to', 'type']);
    const labels = fields.map((f) =>
      'label' in f && typeof f.label === 'object' ? f.label : null,
    );
    expect(labels.every((l) => l && 'ar' in l)).toBe(true);
  });
});
