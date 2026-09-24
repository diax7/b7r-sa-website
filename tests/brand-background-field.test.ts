import { describe, expect, it, vi } from 'vitest';
import { backgroundField, refuseRekey, validateBackground } from '@/modules/brand/background-field';

interface Stored {
  appearance?: unknown;
}

/** A request whose Payload answers from `stored`, in `language`. */
function request(stored: Stored = {}, language = 'en') {
  const findGlobal = vi.fn(async () => stored.appearance ?? null);
  const req = { context: {}, i18n: { language }, payload: { findGlobal } };
  return { req: req as never, findGlobal };
}

describe('a section background (spec 010, phase 2)', () => {
  it('is a text field drawn by the picker, not localized', () => {
    const field = backgroundField();
    expect(field).toMatchObject({ name: 'background', type: 'text' });
    expect(field.localized).toBeUndefined();
    expect(field.admin?.components?.Field).toBe(
      '@/modules/brand/admin/background-picker#BackgroundPicker',
    );
  });

  it('accepts the section’s own, the three built from the brand and the library’s sets', async () => {
    const { req } = request();
    for (const value of [null, undefined, '', 'surface', 'ground', 'deep-sea', 'sea-mist']) {
      expect(await validateBackground(value, { req }), String(value)).toBe(true);
    }
  });

  it('refuses a key no set has, in the editor’s language, and reads the library once', async () => {
    const { req, findGlobal } = request();
    expect(await validateBackground('dune', { req })).toBe(
      "No background has the key “dune”; choose one from the list, or the section's own.",
    );
    expect(await validateBackground('fog', { req })).toContain('“fog”');
    expect(findGlobal).toHaveBeenCalledOnce();
    const ar = request({}, 'ar');
    expect(await validateBackground('dune', { req: ar.req })).toBe(
      'لا توجد خلفية بالمفتاح «dune»؛ اختر واحدة من القائمة، أو خلفية القسم الأصلية.',
    );
  });

  it('lets a stored key whose set was deleted through, so the document still publishes', async () => {
    const { req, findGlobal } = request();
    expect(await validateBackground('dune', { req, previousValue: 'dune' })).toBe(true);
    expect(findGlobal).not.toHaveBeenCalled();
    // A changed value is judged again: a stale set chosen anew is refused.
    expect(await validateBackground('dune', { req, previousValue: 'sea-mist' })).toContain(
      '“dune”',
    );
  });

  it('accepts a set the editor added to the library', async () => {
    const { req } = request({ appearance: { surfaces: [dune] } });
    expect(await validateBackground('dune', { req })).toBe(true);
  });
});

const seaMist = {
  id: 'a',
  key: 'sea-mist',
  label: 'Sea mist',
  kind: 'gradient',
  background: '#bbd0d9',
  text: '#14181f',
  textMuted: '#1f2833',
  link: '#0a2a50',
  button: 'primary',
};
const dune = {
  id: 'b',
  key: 'dune',
  label: 'Dune',
  kind: 'solid',
  background: '#f3ead8',
  text: '#14181f',
  textMuted: '#4b4f55',
  link: '#0058b0',
  button: 'primary',
};

describe('a saved set’s key', () => {
  it('is fixed: a saved row whose key changed is refused, in the editor’s language', () => {
    const { req } = request();
    const renamed = [seaMist, { ...dune, key: 'sand' }];
    expect(refuseRekey(renamed, { req, previousValue: [seaMist, dune] })).toBe(
      'A saved background keeps its key: the sections that use it name it. Change its name, or add a new background.',
    );
    const ar = request({}, 'ar');
    expect(refuseRekey(renamed, { req: ar.req, previousValue: [seaMist, dune] })).toContain(
      'مفتاح الخلفية ثابت',
    );
  });

  it('allows a new name, a new row, a reorder and a deletion', () => {
    const { req } = request();
    const before = [seaMist, dune];
    for (const after of [
      [seaMist, { ...dune, label: 'Sand' }],
      [dune, seaMist],
      [seaMist, dune, { id: 'c', key: 'fog', label: 'Fog' }],
      [seaMist],
      [],
    ]) {
      expect(refuseRekey(after, { req, previousValue: before })).toBe(true);
    }
    expect(refuseRekey([seaMist], { req, previousValue: undefined })).toBe(true);
  });
});
