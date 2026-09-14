import { describe, expect, it } from 'vitest';
import type { LexicalNode, LexicalState } from '@/lib/lexical';
import {
  bodyReadingMinutes,
  editorialWarnings,
  publishProblems,
} from '@/modules/cms/fields/editorial';

const text = (t: string): LexicalNode => ({ type: 'text', text: t });
const p = (...children: LexicalNode[]): LexicalNode => ({ type: 'paragraph', children });
const a = (url: string, t: string): LexicalNode => ({
  type: 'link',
  fields: { linkType: 'custom', url },
  children: [text(t)],
});
const body = (...children: LexicalNode[]): LexicalState => ({
  root: { type: 'root', children },
});

const good = {
  title: 'كيف تبدأ؟',
  excerpt: 'مقتطف.',
  takeaways: [{ text: 'أ' }, { text: 'ب' }, { text: 'ج' }],
  cover: 12,
  body: body(p(a('/how-it-works', 'كيف تعمل')), p(a('/products', 'المنتجات'))),
};

describe('editorial rules (BRD 10.1): what refuses a publish', () => {
  it('passes a complete post', () => {
    expect(publishProblems(good)).toEqual([]);
  });

  it('names every missing piece, in the order to fix them', () => {
    expect(publishProblems({ body: body(p(text('x'))) })).toEqual([
      'Title: required',
      'Excerpt: required',
      'Key takeaways: exactly 3',
      'Cover: required',
      'Body: at least 2 links to pages of this site',
    ]);
  });

  it('caps the title and the excerpt', () => {
    expect(publishProblems({ ...good, title: 'x'.repeat(71) })).toEqual([
      'Title: at most 70 characters',
    ]);
    expect(publishProblems({ ...good, excerpt: 'x'.repeat(161) })).toEqual([
      'Excerpt: at most 160 characters',
    ]);
  });

  it('counts only internal links and non-empty takeaways', () => {
    const external = body(p(a('https://x.com/a', 'x')), p(a('/faq', 'faq')));
    expect(publishProblems({ ...good, body: external })).toEqual([
      'Body: at least 2 links to pages of this site',
    ]);
    expect(
      publishProblems({ ...good, takeaways: [{ text: 'أ' }, { text: '' }, { text: 'ج' }] }),
    ).toEqual(['Key takeaways: exactly 3']);
  });
});

describe('editorial warnings: what an editor should look at', () => {
  it('is empty for a clean post', () => {
    expect(editorialWarnings(good)).toEqual([]);
  });

  it('flags competitor links, Latin paragraphs and an em dash', () => {
    const dash = String.fromCharCode(0x2014);
    const post = {
      ...good,
      title: `عنوان ${dash} بشرطة`,
      body: body(
        p(a('https://www.printful.com/pricing', 'Printful')),
        p(a('https://gelato.com', 'x')),
        p(text('This paragraph is entirely in English prose.')),
        p(a('/faq', 'الأسئلة')),
      ),
    };
    expect(editorialWarnings(post)).toEqual([
      'A link to a competitor: printful.com',
      'A link to a competitor: gelato.com',
      '1 paragraph in Latin script',
      'An em dash in the text (use a colon or a comma)',
    ]);
  });

  it('mirrors the script rule for an English body: Arabic prose is the warning there (ADR-043)', () => {
    const english = {
      ...good,
      body: body(
        p(text('An English paragraph with a link to '), a('/en/faq', 'the FAQ'), text('.')),
        p(text('هذه فقرة كاملة مكتوبة بالعربية داخل مقال إنجليزي.')),
        p(a('/en/products', 'Products')),
      ),
    };
    expect(editorialWarnings(english, 'en')).toEqual(['1 paragraph in Arabic script']);
    // The same body judged as Arabic flags the English paragraph instead.
    expect(editorialWarnings(english, 'ar')).toEqual(['1 paragraph in Latin script']);
  });

  it("reads the body for the meta line at each language's pace", () => {
    expect(bodyReadingMinutes(good.body)).toBe(1);
    expect(bodyReadingMinutes(undefined)).toBe(1);
    const long = body(p(text(Array.from({ length: 400 }, () => 'كلمة').join(' '))));
    expect(bodyReadingMinutes(long)).toBe(3);
    const english = body(p(text(Array.from({ length: 400 }, () => 'word').join(' '))));
    expect(bodyReadingMinutes(english, 'en')).toBe(2);
    expect(bodyReadingMinutes(english, 'ar')).toBe(3);
  });
});
