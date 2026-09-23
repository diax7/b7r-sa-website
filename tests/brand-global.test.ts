import type { Access, Field, GlobalBeforeValidateHook, PayloadRequest } from 'payload';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PINS } from '@/modules/brand/appearance';
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

const doc = (sources: Record<string, string> = {}, pins: unknown = DEFAULT_PINS) => ({
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
    const pins = { ...DEFAULT_PINS, textMuted: { value: '#c0c4ca', origin: 'editor' } };
    const refusal = validate('pins')(pins, { req: panel('en'), data: doc({}, pins) });
    expect(refusal).toMatch(
      /^Secondary text on the page reads 1\.\d+:1 and needs 4\.5:1\. Choose a darker secondary text, or compute it\./,
    );
  });

  it('accepts a readable value set by hand, and every designed value', () => {
    const pins = { ...DEFAULT_PINS, textMuted: { value: '#4a5260', origin: 'editor' } };
    expect(validate('pins')(pins, { req: panel('en'), data: doc({}, pins) })).toBe(true);
    expect(validate('pins')(DEFAULT_PINS, { req: panel('en'), data: doc() })).toBe(true);
  });

  it('refuses pins it cannot read', () => {
    const pins = { textMuted: { value: 'grey', origin: 'editor' } };
    expect(validate('pins')(pins, { req: panel('en'), data: doc({}, pins) })).toBe(
      adminStrings.appearance.notAColour,
    );
  });
});

describe('the save releases a designed value when its own brand colour moved', () => {
  const [release] = Appearance.hooks!.beforeValidate! as GlobalBeforeValidateHook[];
  const run = (data: Record<string, unknown>, originalDoc: unknown) =>
    release!({ data, originalDoc, req: panel('en') } as never) as Record<string, unknown>;

  it('releases nothing on the first save of a never-saved global with the shipped colours', () => {
    const out = run(doc(), { sources: null, pins: null });
    expect(out['pins']).toEqual(DEFAULT_PINS);
  });

  it('releases the secondary text when ink changes, and nothing else', () => {
    const out = run(doc({ ink: '#1b1f27' }), doc());
    expect(Object.keys(out['pins'] as object)).toEqual(['border', 'accentOnTint']);
  });

  it('releases from the stored pins when the write carries none (an API write)', () => {
    const out = run({ sources: { navy: '#102a4f' } }, doc());
    expect(Object.keys(out['pins'] as object)).toEqual(['textMuted', 'accentOnTint']);
  });

  it('keeps an editor’s pin whatever moves', () => {
    const pins = { textMuted: { value: '#4a5260', origin: 'editor' } };
    const out = run(doc({ ink: '#000000' }, pins), doc({}, pins));
    expect(out['pins']).toEqual(pins);
  });
});
