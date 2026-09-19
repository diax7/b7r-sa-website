import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusCell, statusTone } from '@/modules/cms/admin/fields/status-cell';
import { RUN_STATUS_LABELS, RUN_STATUSES } from '@/modules/ai-content/runs';
import { MESSAGE_STATUS_LABELS, MESSAGE_STATUSES } from '@/modules/inbox/messages';

const i18n = (language: 'ar' | 'en') =>
  ({ language, fallbackLanguage: 'en', t: (k: string) => k }) as never;
const statusField = { name: '_status', type: 'select', options: [] } as never;
const runField = {
  name: 'status',
  type: 'select',
  options: RUN_STATUSES.map((value) => ({ value, label: RUN_STATUS_LABELS[value] })),
} as never;
const messageField = {
  name: 'status',
  type: 'select',
  options: MESSAGE_STATUSES.map((value) => ({ value, label: MESSAGE_STATUS_LABELS[value] })),
} as never;

function cell(field: never, cellData: unknown, language: 'ar' | 'en' = 'en') {
  const props = { cellData, field, i18n: i18n(language) } as unknown as Parameters<
    typeof StatusCell
  >[0];
  const { container } = render(<StatusCell {...props} />);
  const pill = container.querySelector('span')!;
  return {
    text: pill.textContent,
    status: pill.getAttribute('data-admin-status'),
    cls: pill.className,
  };
}

/**
 * The status pill (ADR-060): a word in its colour, never a colour alone. Published is
 * green, a draft and a change waiting are amber, a failed run is red, every other state
 * is neutral; the document's words are the glossary's in both languages, a run's are its
 * option labels.
 */
describe('StatusCell', () => {
  it('colours: green live or handled, amber draft, changed or following, red failed, blue new, neutral otherwise', () => {
    expect(statusTone('published')).toBe('success');
    expect(statusTone('draft')).toBe('warning');
    expect(statusTone('changed')).toBe('warning');
    expect(statusTone('failed')).toBe('error');
    expect(statusTone('new')).toBe('accent');
    expect(statusTone('following')).toBe('warning');
    expect(statusTone('handled')).toBe('success');
    for (const other of ['running', 'done', 'skipped', 'anything']) {
      expect(statusTone(other), other).toBe('muted');
    }
  });

  it("a message's state by its option label (ADR-061): New blue, Following amber, Handled green, in both languages", () => {
    expect(cell(messageField, 'new')).toMatchObject({
      text: 'New',
      status: 'new',
      cls: expect.stringContaining('text-accent-on-tint'),
    });
    expect(cell(messageField, 'new').cls).not.toContain('text-primary');
    expect(cell(messageField, 'following')).toMatchObject({
      text: 'Following',
      cls: expect.stringContaining('text-warning'),
    });
    expect(cell(messageField, 'handled')).toMatchObject({
      text: 'Handled',
      cls: expect.stringContaining('text-success'),
    });
    expect(cell(messageField, 'new', 'ar').text).toBe('جديد');
    expect(cell(messageField, 'following', 'ar').text).toBe('قيد المتابعة');
    expect(cell(messageField, 'handled', 'ar').text).toBe('معالَج');
  });

  it("the document's status in both languages, the third word from Payload's _displayStatus", () => {
    expect(cell(statusField, 'published')).toMatchObject({
      text: 'Published',
      status: 'published',
      cls: expect.stringContaining('text-success'),
    });
    expect(cell(statusField, 'draft')).toMatchObject({
      text: 'Draft',
      cls: expect.stringContaining('text-warning'),
    });
    expect(cell(statusField, 'changed')).toMatchObject({
      text: 'Changed',
      cls: expect.stringContaining('text-warning'),
    });
    expect(cell(statusField, 'published', 'ar').text).toBe('منشور');
    expect(cell(statusField, 'draft', 'ar').text).toBe('مسودة');
    expect(cell(statusField, 'changed', 'ar').text).toBe('معدّل');
  });

  it("a run's outcome by its option label: Failed red, the rest neutral", () => {
    expect(cell(runField, 'failed')).toMatchObject({
      text: 'Failed',
      status: 'failed',
      cls: expect.stringContaining('text-error'),
    });
    expect(cell(runField, 'failed', 'ar').text).toBe('فشل');
    expect(cell(runField, 'done')).toMatchObject({
      text: 'Done',
      cls: expect.stringContaining('text-text-muted'),
    });
    expect(cell(runField, 'running', 'ar').text).toBe('يعمل');
  });

  it('an unset or unknown value reads neutral: "Not yet", or the raw value for a word it has none for', () => {
    expect(cell(statusField, undefined)).toMatchObject({
      text: 'Not yet',
      cls: expect.stringContaining('text-text-muted'),
    });
    expect(cell(statusField, null, 'ar').text).toBe('ليس بعد');
    expect(cell(runField, 'unknown')).toMatchObject({ text: 'unknown', status: 'unknown' });
  });
});
