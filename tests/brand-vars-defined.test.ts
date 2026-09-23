/**
 * Gate 2 of phase 1a (spec 010): every custom property the stylesheets read is defined by
 * something.
 *
 * This is the test that would have caught the mistake revision 1 of the plan nearly shipped.
 * It proposed moving the colour tokens to `@theme inline`, which inlines a token into its
 * utilities and emits no `--color-*` property at all (`src/app/(payload)/admin.css:63-65`).
 * Forty-three hand-written rules read those properties directly, including
 * `body { background: var(--color-surface) }` and both the site's and the panel's typeface.
 * Nothing in the suite would have noticed until the page rendered without a background.
 *
 * The allowlist is designed, not appended to: every entry carries the reason it is legitimate
 * and anything unlisted fails. A list that grows each time the test goes red is wallpaper,
 * which is the failure mode this project already learned about the hard way.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brandCss, DEFAULT_BRAND } from '@/modules/brand/css';

const FILES = [
  join('src', 'styles', 'globals.css'),
  join('src', 'styles', 'tokens.css'),
  join('src', 'app', '(payload)', 'admin.css'),
];

/** Provided at runtime by something other than our stylesheets, or by the rule itself. */
const PROVIDED_ELSEWHERE: Record<string, string> = {
  // Payload's own admin theme sets these on its shell at runtime; admin.css reads them to
  // sit inside that shell rather than restating its values (ADR-039).
  '--theme-elevation-0': "Payload's theme",
  '--theme-elevation-50': "Payload's theme",
  '--theme-elevation-100': "Payload's theme",
  '--theme-elevation-150': "Payload's theme",
  '--theme-elevation-600': "Payload's theme",
  '--theme-elevation-800': "Payload's theme",
  '--theme-elevation-1000': "Payload's theme",
  '--theme-bg': "Payload's theme",
  '--nav-trans-time': "Payload's nav timing",
  '--gutter-h': "Payload's Gutter width",
  '--app-header-height': "Payload's header height",
  // Radix sets this on the element it animates.
  '--radix-accordion-content-height': 'Radix, on the element',
  // Set inline by the component that owns the value, per instance.
  '--hero-overlay': 'the hero, per slide',
  '--hero-blur-mobile': 'the media library blur-up (ADR-029)',
  '--hero-blur-desktop': 'the media library blur-up (ADR-029)',
};

/** Comments are not code: `globals.css:22` explains the token rule using `var(--token)`. */
const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, ' ');

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8');

/**
 * Every `--name` a `var()` reads, excluding the ones that carry their own fallback. Comments
 * are stripped first: `globals.css:22` explains the token rule using the words `var(--token)`,
 * and a prose example is not a reference.
 */
function referenced(css: string): Set<string> {
  const names = new Set<string>();
  for (const match of withoutComments(css).matchAll(/var\(\s*(--[a-zA-Z0-9-]+)\s*(,)?/g)) {
    if (!match[2] && match[1]) names.add(match[1]);
  }
  return names;
}

/** Every `--name` a stylesheet declares, wherever it declares it. */
function declared(css: string): Set<string> {
  return new Set([...css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]!));
}

describe('every custom property the stylesheets read is defined', () => {
  it('leaves nothing dangling across the site and the panel', () => {
    const all = FILES.map(read).join('\n');
    const emitted = new Set(
      [...brandCss(DEFAULT_BRAND).matchAll(/(--[a-zA-Z0-9-]+):/g)].map((m) => m[1]!),
    );
    const defined = declared(all);
    const dangling = [...referenced(all)].filter(
      (name) => !defined.has(name) && !emitted.has(name) && !(name in PROVIDED_ELSEWHERE),
    );
    expect(dangling, `undefined custom properties: ${dangling.join(', ')}`).toEqual([]);
  });

  it('keeps the allowlist honest: every entry is actually still referenced', () => {
    const all = FILES.map(read).join('\n');
    const used = referenced(all);
    const stale = Object.keys(PROVIDED_ELSEWHERE).filter((name) => !used.has(name));
    expect(stale, `allowlist entries nothing reads any more: ${stale.join(', ')}`).toEqual([]);
  });

  it('proves the check bites: a token the brand stopped emitting is caught', () => {
    // Simulates exactly what `@theme inline` would have done to `--color-surface`.
    const withoutSurface = brandCss(DEFAULT_BRAND).replace(/--color-surface:[^;}]+;?/, '');
    const emitted = new Set([...withoutSurface.matchAll(/(--[a-zA-Z0-9-]+):/g)].map((m) => m[1]!));
    expect(emitted.has('--color-surface')).toBe(false);
    const css = read(FILES[0]!);
    expect(referenced(css).has('--color-surface')).toBe(true);
  });
});
