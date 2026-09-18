import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

// The widget reads the form's rows and the UI language through Payload's hooks, and the
// other language's rows through the shared read (ADR-057); the test hands it each directly.
let rows: Array<{ text: string }> = [];
let uiLanguage = 'en';
let otherLanguage: { other: { code: string } | null; stored: unknown } = {
  other: null,
  stored: { status: 'loading', doc: null },
};
vi.mock('@payloadcms/ui', () => ({
  useFormFields: (pick: (state: [Record<string, unknown>]) => unknown) => {
    const fields: Record<string, unknown> = {
      warnings: { rows: rows.map(() => ({})) },
    };
    rows.forEach((row, i) => {
      fields[`warnings.${i}.text`] = { value: row.text };
    });
    return pick([fields]);
  },
  useLocale: () => ({ code: 'ar' }),
  useTranslation: () => ({ i18n: { language: uiLanguage, t: (k: string) => k } }),
}));
vi.mock('@/modules/cms/admin/fields/bilingual/use-other-language', () => ({
  useOtherLanguage: () => otherLanguage,
}));

const { WarningsField } = await import('@/modules/cms/admin/fields/warnings-field');

const field = {
  name: 'warnings',
  type: 'array',
  localized: true,
  label: { ar: 'تنبيهات التحرير', en: 'Editorial warnings' },
  fields: [],
} as never;
const props = { field, path: 'warnings' } as unknown as ComponentProps<typeof WarningsField>;
const counts = (root: ParentNode) =>
  [...root.querySelectorAll('[data-admin-warnings]')].map((el) =>
    el.getAttribute('data-admin-warnings'),
  );

/**
 * The post's editorial warnings, a computed fact per language (the one list localized as
 * a whole): both languages show, the open one from the form, the other from the shared read.
 */
describe('WarningsField: both languages of the editorial warnings', () => {
  it('lists the Arabic warnings from the form and the English ones from the other read, each under its pill', () => {
    rows = [{ text: 'An em dash in the text' }, { text: 'A link to a competitor: x.com' }];
    otherLanguage = {
      other: { code: 'en' },
      stored: { status: 'ready', doc: { warnings: [{ id: 'a', text: 'Only 1 internal link' }] } },
    };
    const { container } = render(<WarningsField {...props} />);
    expect(
      [...container.querySelectorAll('[data-admin-locale-tag]')].map((el) => el.textContent),
    ).toEqual(['AR', 'EN']);
    expect(counts(container)).toEqual(['2', '1']);
    const other = container.querySelector('[data-admin-other="warnings"]');
    expect(other?.textContent).toContain('Only 1 internal link');
    expect(other?.textContent).not.toContain('em dash');
  });

  it('says "nothing to flag" per language, and the loading or failed line for the other', () => {
    rows = [];
    otherLanguage = { other: { code: 'en' }, stored: { status: 'ready', doc: { warnings: [] } } };
    const clean = render(<WarningsField {...props} />);
    expect(counts(clean.container)).toEqual(['0', '0']);
    expect(clean.container.textContent).toContain('Nothing to flag.');
    otherLanguage = { other: { code: 'en' }, stored: { status: 'loading', doc: null } };
    const loading = render(<WarningsField {...props} />);
    expect(counts(loading.container)).toEqual(['0']);
    expect(loading.container.querySelector('[data-admin-other="warnings"]')?.textContent).toBe(
      'ENLoading English…',
    );
    otherLanguage = { other: { code: 'en' }, stored: { status: 'error', doc: null } };
    const failed = render(<WarningsField {...props} />);
    expect(failed.container.querySelector('[data-admin-other="warnings"]')?.textContent).toBe(
      'ENThe English value could not be loaded. Reload the page.',
    );
  });

  it('reads in Arabic when the panel does', () => {
    rows = [];
    uiLanguage = 'ar';
    otherLanguage = { other: { code: 'en' }, stored: { status: 'error', doc: null } };
    const { container } = render(<WarningsField {...props} />);
    expect(container.textContent).toContain('لا ملاحظات.');
    expect(container.querySelector('[data-admin-other="warnings"]')?.textContent).toBe(
      'ENتعذّر تحميل قيمة اللغة الإنجليزية. أعد تحميل الصفحة.',
    );
  });

  it('with one locale there is nothing to pair: the list alone, no pill', () => {
    rows = [{ text: 'x' }];
    uiLanguage = 'en';
    otherLanguage = { other: null, stored: { status: 'ready', doc: {} } };
    const { container } = render(<WarningsField {...props} />);
    expect(counts(container)).toEqual(['1']);
    expect(container.querySelector('[data-admin-locale-tag]')).toBeNull();
  });
});
