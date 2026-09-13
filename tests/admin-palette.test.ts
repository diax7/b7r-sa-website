import { describe, expect, it } from 'vitest';
import { initials } from '@/modules/cms/admin/account/account-menu';
import { searchTerm } from '@/modules/cms/admin/header/palette';
import { fold, MIN_QUERY, rank, score } from '@/modules/cms/admin/header/palette-rank';

const items = [
  { label: 'الصفحات', keywords: 'المحتوى pages' },
  { label: 'الصفحة الرئيسية', keywords: 'المحتوى home' },
  { label: 'الأسئلة الشائعة', keywords: 'المحتوى faqs' },
  { label: 'إعدادات الموقع', keywords: 'الإعدادات site-settings' },
  { label: 'إعدادات SEO', keywords: 'الإعدادات seo-defaults' },
  { label: 'المستخدمون', keywords: 'الإدارة users' },
];

describe('command palette ranking (ADR-039)', () => {
  it('folds diacritics, hamza forms and alef maqsura so common spellings match', () => {
    expect(fold('الأَسْئِلة')).toBe(fold('الاسئلة'));
    expect(fold('مصطفى')).toBe('مصطفي');
    expect(fold('  Site   Settings ')).toBe('site settings');
    expect(fold('مؤسّسة')).toBe('موسسة');
  });

  it('prefix beats word start beats substring beats keywords; order is stable', () => {
    expect(rank('الصف', items).map((i) => i.label)).toEqual(['الصفحات', 'الصفحة الرئيسية']);
    expect(rank('الرئيسية', items).map((i) => i.label)).toEqual(['الصفحة الرئيسية']);
    expect(rank('seo', items).map((i) => i.label)).toEqual(['إعدادات SEO']);
    // keyword-only hits come last
    expect(rank('الإعدادات', items).map((i) => i.label)).toEqual(['إعدادات الموقع', 'إعدادات SEO']);
    expect(rank('الاسئله', items)).toEqual([]);
    expect(rank('الاسئل', items).map((i) => i.label)).toEqual(['الأسئلة الشائعة']);
  });

  it('an empty or whitespace query scores nothing; the search threshold is two characters', () => {
    expect(score('  ', items[0]!)).toBe(0);
    expect(rank('', items)).toEqual([]);
    expect(MIN_QUERY).toBe(2);
  });

  it('the document search drops SQL wildcards and needs a letter or digit', () => {
    expect(searchTerm('%')).toBe('');
    expect(searchTerm('a_b%')).toBe('ab');
    expect(searchTerm('  ')).toBe('');
    expect(searchTerm(' هودي ')).toBe('هودي');
  });

  it('account initials take the first two words, or the e-mail, never an empty badge', () => {
    expect(initials('ضياء ناصر', 'd@b7r.sa')).toBe('ضن');
    expect(initials('Dhia', 'd@b7r.sa')).toBe('D');
    expect(initials('', 'editor@b7r.sa')).toBe('E');
    expect(initials('', '')).toBe('?');
  });
});
