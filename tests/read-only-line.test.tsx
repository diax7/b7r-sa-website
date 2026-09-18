import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// The widget reads the form through Payload's hooks; the test hands it a value directly.
let formValue: unknown;
vi.mock('@payloadcms/ui', () => ({
  useField: () => ({ value: formValue }),
  useTranslation: () => ({ i18n: { language: 'en', t: (k: string) => k } }),
}));

const { ReadOnlyLine, readOnlyText } = await import('@/modules/cms/admin/fields/read-only-line');

const translate = (label: Record<string, string> | string) =>
  typeof label === 'string' ? label : (label['en'] ?? '');
const field = (type: string, extra: Record<string, unknown> = {}) =>
  ({ name: 'x', type, label: { ar: 'س', en: 'X' }, ...extra }) as never;

/** A read-only field's value as words (admin audit 2026-09-18, 2.11, 2.12). */
describe('readOnlyText: a value as an editor reads it', () => {
  it('numbers in Western digits, up to four decimals', () => {
    expect(readOnlyText(field('number'), 0.9439, translate)).toBe('0.9439');
    expect(readOnlyText(field('number'), 12345.6789012, translate)).toBe('12,345.6789');
    expect(readOnlyText(field('number'), 0, translate)).toBe('0');
  });

  it('dates as dd/MM/yyyy, with the time unless the picker was day-only', () => {
    const at = new Date(2026, 8, 16, 14, 2).toISOString();
    expect(readOnlyText(field('date'), at, translate)).toBe('16/09/2026 14:02');
    expect(
      readOnlyText(
        field('date', { admin: { date: { pickerAppearance: 'dayOnly' } } }),
        at,
        translate,
      ),
    ).toBe('16/09/2026');
    expect(readOnlyText(field('date'), 'not a date', translate)).toBeNull();
  });

  it('a checkbox as Yes / No, or On / Off for an enabled switch', () => {
    expect(readOnlyText(field('checkbox'), true, translate)).toBe('Yes');
    expect(readOnlyText(field('checkbox'), false, translate)).toBe('No');
    expect(readOnlyText(field('checkbox', { name: 'enabled' }), true, translate)).toBe('On');
    expect(readOnlyText(field('checkbox', { name: 'enabled' }), false, translate)).toBe('Off');
  });

  it("a select as its option's label, or the value when no option matches", () => {
    const select = field('select', {
      options: [{ value: 'done', label: { ar: 'انتهى', en: 'Done' } }, 'raw'],
    });
    expect(readOnlyText(select, 'done', translate)).toBe('Done');
    expect(readOnlyText(select, 'raw', translate)).toBe('raw');
    expect(readOnlyText(select, 'other', translate)).toBe('other');
  });

  it('text as it is, and nothing for an empty value', () => {
    expect(readOnlyText(field('text'), 'gpt-4.1-mini', translate)).toBe('gpt-4.1-mini');
    expect(readOnlyText(field('text'), '', translate)).toBeNull();
    expect(readOnlyText(field('number'), null, translate)).toBeNull();
    expect(readOnlyText(field('date'), undefined, translate)).toBeNull();
  });
});

describe('ReadOnlyLine: the label, the description and the value as a line', () => {
  it('renders the value as text, never as an input', () => {
    formValue = 2;
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

  it('shows the label alone for an empty value', () => {
    formValue = null;
    const { container } = render(<ReadOnlyLine field={field('text')} path="x" />);
    expect(container.textContent).toContain('X');
    expect(container.querySelector('[data-admin-read-only]')).toBeNull();
  });
});
