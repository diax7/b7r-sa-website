import type { Access, Field, PayloadRequest } from 'payload';
import { deepMergeWithSourceArrays } from 'payload/shared';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SOURCES } from '@/modules/brand/defaults';
import { Appearance } from '@/modules/brand/global';
import { adminStrings, adminStringsAr } from '@/modules/cms/admin/strings';

type Actor = 'anonymous' | 'editor' | 'admin';
type Validate = (value: unknown, options: Record<string, unknown>) => true | string;

const actor = (who: Actor) =>
  ({ user: who === 'anonymous' ? null : { id: 7, role: who } }) as unknown as PayloadRequest;
const panel = (language: 'ar' | 'en') => ({ i18n: { language } }) as unknown as PayloadRequest;

/** A named field of the config by its data path, through tabs, rows and groups. */
function field(fields: Field[], path: string, prefix = ''): Field | undefined {
  for (const f of fields) {
    if (f.type === 'tabs') {
      for (const tab of f.tabs) {
        const found = field(tab.fields, path, prefix);
        if (found) return found;
      }
      continue;
    }
    const name = 'name' in f && f.name ? `${prefix}${f.name}` : null;
    if (name === path) return f;
    if ('fields' in f && Array.isArray(f.fields)) {
      const found = field(f.fields, path, name && f.type === 'group' ? `${name}.` : prefix);
      if (found) return found;
    }
  }
  return undefined;
}

const validate = (path: string) => {
  const found = field(Appearance.fields, path) as { validate?: Validate } | undefined;
  if (!found?.validate) throw new Error(`no validator on ${path}`);
  return found.validate;
};

const doc = (sources: Record<string, string> = {}, pins: unknown = []) => ({
  sources: { ...DEFAULT_SOURCES, ...sources },
  pins,
});

describe('the Appearance global: the outsider gets nothing (spec 010, the standing rule)', () => {
  const access = Appearance.access as Record<string, Access>;

  it('refuses the public credential and an editor both a read and a write', () => {
    for (const who of ['anonymous', 'editor'] as const) {
      expect(access['read']!({ req: actor(who) } as never)).toBe(false);
      expect(access['update']!({ req: actor(who) } as never)).toBe(false);
    }
  });

  it('lets an admin read and change it', () => {
    expect(access['read']!({ req: actor('admin') } as never)).toBe(true);
    expect(access['update']!({ req: actor('admin') } as never)).toBe(true);
  });

  it('hides it from an editor in the panel', () => {
    const hidden = Appearance.admin?.hidden as (args: { user: unknown }) => boolean;
    expect(hidden({ user: { role: 'editor' } })).toBe(true);
    expect(hidden({ user: { role: 'admin' } })).toBe(false);
  });
});

describe('a brand colour is refused in the editor’s language, naming the pair and the fix', () => {
  it('accepts the shipped colours', () => {
    expect(
      validate('sources.primary')(DEFAULT_SOURCES.primary, { req: panel('en'), data: doc() }),
    ).toBe(true);
  });

  it('refuses a pale primary in English: the pair, both ratios, and which way to move', () => {
    const data = doc({ primary: '#7fb2ff' });
    const refusal = validate('sources.primary')('#7fb2ff', { req: panel('en'), data });
    expect(refusal).toMatch(
      /^White text on the primary \(the buttons, the bottom banner\) reads 2\.\d+:1 and needs 4\.5:1\. Choose a darker primary\./,
    );
    // More than one pair falls short, so the sentence points at the contrast check.
    expect(refusal).toContain(adminStrings.appearance.more);
  });

  it('refuses the same in Arabic, with Western digits', () => {
    const data = doc({ primary: '#7fb2ff' });
    const refusal = validate('sources.primary')('#7fb2ff', { req: panel('ar'), data });
    expect(refusal).toContain(adminStringsAr.appearance.pairs.buttonPrimary);
    expect(refusal).toContain('غيّر اللون الأساسي إلى لون أغمق');
    expect(refusal).toMatch(/التباين 2\.\d+:1 والمطلوب 4\.5:1/);
  });

  it('refuses a value that is not a colour, saying how to write one', () => {
    expect(validate('sources.ink')('#123', { req: panel('en'), data: doc() })).toBe(
      adminStrings.appearance.notAColour,
    );
    expect(validate('sources.ink')(null, { req: panel('ar'), data: doc() })).toBe(
      adminStringsAr.appearance.notAColour,
    );
  });

  it('puts a failure on the colour that causes it, not on every picker', () => {
    const data = doc({ ink: '#9aa3ad' });
    expect(validate('sources.ink')('#9aa3ad', { req: panel('en'), data })).not.toBe(true);
    expect(validate('sources.primary')(DEFAULT_SOURCES.primary, { req: panel('en'), data })).toBe(
      true,
    );
  });
});

describe('a derived colour set by hand is refused when it breaks a pair', () => {
  it('names the pair and offers computing it instead', () => {
    const pins = [{ token: 'textMuted', value: '#c0c4ca' }];
    const refusal = validate('pins')(pins, { req: panel('en'), data: doc({}, pins) });
    expect(refusal).toMatch(
      /^Secondary text on the page reads 1\.\d+:1 and needs 4\.5:1\. Choose a darker secondary text, or reset it\./,
    );
  });

  it('accepts a readable value set by hand, and every designed value', () => {
    const pins = [{ token: 'textMuted', value: '#4a5260' }];
    expect(validate('pins')(pins, { req: panel('en'), data: doc({}, pins) })).toBe(true);
    expect(validate('pins')([], { req: panel('en'), data: doc() })).toBe(true);
  });

  it('refuses a list it cannot read, never dropping it quietly', () => {
    const pins = [{ token: 'textMuted', value: 'grey' }];
    expect(validate('pins')(pins, { req: panel('en'), data: doc({}, pins) })).toBe(
      adminStrings.appearance.notAColour,
    );
  });
});

describe('the validators read what the save writes, not the stored document merged under it', () => {
  // Payload hands a field's validator `deepMergeWithSourceArrays(originalDoc, data)`
  // (payload/dist/fields/hooks/beforeChange/promise.js); the list of colours set by hand is
  // replaced by the save's, so a colour reset in this save is not judged.
  const stored = doc({}, [{ token: 'textMuted', value: '#c0c4ca' }]);

  it('passes a save that resets the failing colour set by hand', () => {
    const data = deepMergeWithSourceArrays(stored, { pins: [] });
    expect(validate('pins')([], { req: panel('en'), data })).toBe(true);
    expect(validate('sources.ink')(DEFAULT_SOURCES.ink, { req: panel('en'), data })).toBe(true);
  });

  it('still refuses when the save keeps it', () => {
    const data = deepMergeWithSourceArrays(stored, { sources: { ...DEFAULT_SOURCES } });
    expect(validate('pins')((data as { pins: unknown }).pins, { req: panel('en'), data })).not.toBe(
      true,
    );
  });
});

describe('the brand colours are stored as the site reads them', () => {
  it('lowercases and trims a colour on save', () => {
    const found = field(Appearance.fields, 'sources.primary') as {
      hooks?: { beforeChange?: Array<(args: { value: unknown }) => unknown> };
    };
    const [normalise] = found.hooks!.beforeChange!;
    expect(normalise!({ value: ' #1A5CAF ' })).toBe('#1a5caf');
    expect(normalise!({ value: 'grey' })).toBe('grey');
  });
});
