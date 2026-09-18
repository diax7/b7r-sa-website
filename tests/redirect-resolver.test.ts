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
/** The English side of a refusal, or null: the rules are the same in both languages. */
const problem = (...args: Parameters<typeof redirectProblem>) =>
  redirectProblem(...args)?.en ?? null;

describe('redirectProblem: the rules an admin row must pass', () => {
  it('accepts a single-segment source to a site path or an https URL', () => {
    expect(problem('/showcase', custom('/products'), [])).toBeNull();
    expect(problem('/promo', custom('https://example.com/x'), [])).toBeNull();
    expect(problem('/old', { type: 'reference' }, [])).toBeNull();
  });

  it('refuses nested, malformed or code-owned sources', () => {
    expect(problem('/a/b', custom('/x'), [])).toMatch(/one-segment/);
    expect(problem('showcase', custom('/x'), [])).toMatch(/one-segment/);
    expect(problem('/Show', custom('/x'), [])).toMatch(/one-segment/);
    expect(problem('/about', custom('/x'), [])).toMatch(/live page/);
    expect(problem('/products', custom('/x'), [])).toMatch(/live page/);
    expect(problem('/en', custom('/'), [])).toMatch(/live page/);
    expect(problem(undefined, custom('/x'), [])).not.toBeNull();
  });

  it('refuses http, javascript and protocol-relative targets, self and loops', () => {
    expect(problem('/old', custom('http://example.com'), [])).toMatch(/https/);
    expect(problem('/old', custom('javascript:alert(1)'), [])).toMatch(/https/);
    expect(problem('/old', custom('//evil.com'), [])).toMatch(/https/);
    expect(problem('/old', custom('/old'), [])).toMatch(/same as From/);
    expect(problem('/old', custom('/old/x'), [])).toMatch(/same as From/);
    expect(problem('/old', custom('/older'), ['/older'])).toMatch(/no chains/);
    expect(problem('/old', custom('/older'), ['/other'])).toBeNull();
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
    expect(problem('/a', custom('/b'), ['/b'])).toMatch(/no chains/);
    expect(problem('/x', custom('/x'), [])).toMatch(/same as From/);
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
      {
        name: 'type',
        type: 'select',
        options: ['301', { label: '302 - Temporary', value: '302' }],
      },
    ]);
    const names = fields.map((f) => ('name' in f ? f.name : ''));
    expect(names).toEqual(['from', 'to', 'type']);
    const labels = fields.map((f) =>
      'label' in f && typeof f.label === 'object' ? f.label : null,
    );
    expect(labels.every((l) => l && 'ar' in l)).toBe(true);
    const type = fields.find((f) => 'name' in f && f.name === 'type');
    expect(type && 'defaultValue' in type ? type.defaultValue : null).toBe('301');
    // The plugin's "301 - Permanent" reads as a word in both languages (audit 2026-09-18, 2.2).
    expect(type && 'options' in type ? type.options : null).toEqual([
      { value: '301', label: { ar: 'دائم (301)', en: 'Permanent (301)' } },
      { value: '302', label: { ar: 'مؤقت (302)', en: 'Temporary (302)' } },
    ]);
  });
});
