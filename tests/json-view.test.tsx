import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// The widget reads the form through Payload's hooks; the test hands it a value directly.
let formValue: unknown;
vi.mock('@payloadcms/ui', () => ({
  useField: () => ({ value: formValue }),
  useTranslation: () => ({ i18n: { language: 'en', t: (k: string) => k } }),
}));

const { jsonPreview, JsonView, JsonViewCell, prettyJson } =
  await import('@/modules/cms/admin/fields/json-view');

const field = {
  name: 'steps',
  type: 'json',
  label: { ar: 'الخطوات', en: 'Steps' },
  admin: { description: { ar: 'خطوات الجولة بترتيبها', en: 'The steps of the run, in order' } },
} as never;

/** The read-only JSON block and cell (admin audit 2026-09-18, 2.1): what an editor reads. */
describe('JsonView: pretty-printed, one line in a list, nothing for an empty value', () => {
  it('pretty-prints an object, a JSON string and leaves a plain string as it is', () => {
    expect(prettyJson({ a: 1, b: [1, 2] })).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
    expect(prettyJson('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(prettyJson('not json')).toBe('not json');
    expect(prettyJson(0)).toBe('0');
    expect(prettyJson(false)).toBe('false');
  });

  it('reads an empty value as nothing, never as "null" or "undefined"', () => {
    expect(prettyJson(null)).toBeNull();
    expect(prettyJson(undefined)).toBeNull();
    expect(prettyJson('')).toBeNull();
    expect(jsonPreview(null)).toBeNull();
  });

  it('cuts the list preview to one line at the limit', () => {
    expect(jsonPreview({ a: 1, b: 'x' })).toBe('{ "a": 1, "b": "x" }');
    const long = jsonPreview({ text: 'y'.repeat(200) }, 40);
    expect(long).toHaveLength(40);
    expect(long?.endsWith('…')).toBe(true);
    expect(long).not.toContain('\n');
  });

  it('the field renders the label, the description and the value as a left-to-right block', () => {
    formValue = { outline: ['intro', 'body'] };
    const { container } = render(<JsonView field={field} path="steps" />);
    expect(container.textContent).toContain('Steps');
    expect(container.textContent).toContain('The steps of the run, in order');
    const pre = container.querySelector('pre[data-admin-json-view="steps"]');
    expect(pre?.getAttribute('dir')).toBe('ltr');
    expect(pre?.textContent).toBe('{\n  "outline": [\n    "intro",\n    "body"\n  ]\n}');
  });

  it('the field shows the label alone when the value is empty', () => {
    formValue = null;
    const { container } = render(<JsonView field={field} path="steps" />);
    expect(container.textContent).toContain('Steps');
    expect(container.querySelector('pre')).toBeNull();
  });

  it('the cell renders the line left-to-right, or nothing', () => {
    const cell = render(
      <JsonViewCell
        cellData={{ urls: ['https://b7r.sa'] }}
        collectionSlug="citations"
        field={field}
        rowData={{}}
      />,
    );
    const code = cell.container.querySelector('code');
    expect(code?.getAttribute('dir')).toBe('ltr');
    expect(code?.textContent).toBe('{ "urls": [ "https://b7r.sa" ] }');
    const empty = render(
      <JsonViewCell cellData={null} collectionSlug="citations" field={field} rowData={{}} />,
    );
    expect(empty.container.innerHTML).toBe('');
  });
});
