import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// The widget reads the form and the UI language through Payload's hooks; the test hands it
// a value and a language directly.
let formValue: unknown;
let uiLanguage = 'en';
vi.mock('@payloadcms/ui', () => ({
  useField: () => ({ value: formValue }),
  useTranslation: () => ({ i18n: { language: uiLanguage, t: (k: string) => k } }),
}));

const { ReadOnlyLine, readOnlyText } = await import('@/modules/cms/admin/fields/read-only-line');

const en = (label: Record<string, string> | string) =>
  typeof label === 'string' ? label : (label['en'] ?? '');
const ar = (label: Record<string, string> | string) =>
  typeof label === 'string' ? label : (label['ar'] ?? '');
const field = (type: string, extra: Record<string, unknown> = {}) =>
  ({ name: 'x', type, label: { ar: 'س', en: 'X' }, ...extra }) as never;

/** A read-only field's value as words in the UI language (admin audit 2026-09-18, 2.11, 2.12; ADR-056). */
describe('readOnlyText: a value as an editor reads it', () => {
  it('numbers in Western digits in both languages, up to four decimals', () => {
    expect(readOnlyText(field('number'), 0.9439, 'en', en)).toBe('0.9439');
    expect(readOnlyText(field('number'), 0.9439, 'ar', ar)).toBe('0.9439');
    expect(readOnlyText(field('number'), 12345.6789012, 'en', en)).toBe('12,345.6789');
    expect(readOnlyText(field('number'), 1234, 'ar', ar)).toBe('1,234');
    expect(readOnlyText(field('number'), 0, 'en', en)).toBe('0');
  });

  it('dates as dd/MM/yyyy in Riyadh, with the time unless the picker was day-only', () => {
    const at = '2026-09-16T11:02:00Z';
    expect(readOnlyText(field('date'), at, 'en', en)).toBe('16/09/2026 14:02');
    expect(readOnlyText(field('date'), at, 'ar', ar)).toBe('16/09/2026 14:02');
    expect(
      readOnlyText(
        field('date', { admin: { date: { pickerAppearance: 'dayOnly' } } }),
        at,
        'en',
        en,
      ),
    ).toBe('16/09/2026');
    expect(readOnlyText(field('date'), 'not a date', 'en', en)).toBeNull();
  });

  it('a checkbox as Yes / No, or On / Off for an enabled switch, in the UI language', () => {
    expect(readOnlyText(field('checkbox'), true, 'en', en)).toBe('Yes');
    expect(readOnlyText(field('checkbox'), false, 'en', en)).toBe('No');
    expect(readOnlyText(field('checkbox', { name: 'enabled' }), true, 'en', en)).toBe('On');
    expect(readOnlyText(field('checkbox', { name: 'enabled' }), false, 'en', en)).toBe('Off');
    expect(readOnlyText(field('checkbox'), true, 'ar', ar)).toBe('نعم');
    expect(readOnlyText(field('checkbox', { name: 'enabled' }), false, 'ar', ar)).toBe('متوقف');
  });

  it("a select as its option's label, or the value when no option matches", () => {
    const select = field('select', {
      options: [{ value: 'done', label: { ar: 'انتهى', en: 'Done' } }, 'raw'],
    });
    expect(readOnlyText(select, 'done', 'en', en)).toBe('Done');
    expect(readOnlyText(select, 'done', 'ar', ar)).toBe('انتهى');
    expect(readOnlyText(select, 'raw', 'en', en)).toBe('raw');
    expect(readOnlyText(select, 'other', 'en', en)).toBe('other');
  });

  it('text as it is, and nothing for an empty text or number', () => {
    expect(readOnlyText(field('text'), 'gpt-4.1-mini', 'en', en)).toBe('gpt-4.1-mini');
    expect(readOnlyText(field('text'), '', 'en', en)).toBeNull();
    expect(readOnlyText(field('number'), null, 'en', en)).toBeNull();
  });

  it('an empty date reads "Not yet", or the sentence the field carries for it', () => {
    expect(readOnlyText(field('date'), undefined, 'en', en)).toBe('Not yet');
    expect(readOnlyText(field('date'), null, 'ar', ar)).toBe('ليس بعد');
    const lastTest = field('date', {
      admin: { custom: { emptyText: { ar: 'لا اختبار بعد', en: 'No test yet' } } },
    });
    expect(readOnlyText(lastTest, null, 'en', en)).toBe('No test yet');
    expect(readOnlyText(lastTest, null, 'ar', ar)).toBe('لا اختبار بعد');
  });
});

describe('ReadOnlyLine: the label, the description and the value as a line', () => {
  it('renders the value as text, never as an input', () => {
    formValue = 2;
    uiLanguage = 'en';
    const { container } = render(
      <ReadOnlyLine
        field={field('number', {
          admin: { description: { ar: 'عدد التشغيلات', en: 'How many runs this month' } },
        })}
        path="x"
      />,
    );
    expect(container.querySelector('input')).toBeNull();
    expect(container.textContent).toContain('X');
    expect(container.textContent).toContain('How many runs this month');
    expect(container.querySelector('[data-admin-read-only="x"]')?.textContent).toBe('2');
  });

  it('shows the label alone for an empty text', () => {
    formValue = null;
    uiLanguage = 'en';
    const { container } = render(<ReadOnlyLine field={field('text')} path="x" />);
    expect(container.textContent).toContain('X');
    expect(container.querySelector('[data-admin-read-only]')).toBeNull();
  });

  it('reads in Arabic when the panel does', () => {
    formValue = true;
    uiLanguage = 'ar';
    const { container } = render(<ReadOnlyLine field={field('checkbox')} path="x" />);
    expect(container.querySelector('[data-admin-read-only="x"]')?.textContent).toBe('نعم');
  });
});
