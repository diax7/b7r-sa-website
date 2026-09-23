import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { APP_ICON_ROUTES, appIconSize } from '@/modules/brand/app-icons';
import { paintedColours, toAppearance } from '@/modules/brand/appearance';
import { DEFAULT_SOURCES } from '@/modules/brand/defaults';
import { BrandLogo, ShellLogo } from '@/modules/core/brand-logo';
import { LOGO_BOX, LOGO_SPRITE, MARK_BOX } from '@/modules/core/logo-box';

const root = process.cwd();
const sprite = readFileSync(join(root, 'public/images/logo/sprite.svg'), 'utf8');

/** The fills of one symbol of the sprite, in order. */
function fills(id: string): string[] {
  const body = new RegExp(`<symbol id="${id}"[^>]*>(.*?)</symbol>`).exec(sprite)?.[1] ?? '';
  return [...body.matchAll(/style="([^"]*)"/g)].map((m) => m[1]!);
}

/**
 * The drawn logo (spec 010, phase 1d): the traced paths painted with the tokens, so a saved
 * brand repaints the header, the menu, the footer, the error pages and the WhatsApp card.
 */
describe('the drawn logo', () => {
  it('paints every layer of both symbols of the sprite with the token it stands for', () => {
    expect(fills('b7r-logo')).toEqual([
      'fill:var(--logo-primary, var(--color-primary))',
      'fill:var(--logo-accent, var(--color-accent))',
      'fill:var(--logo-primary-dark, var(--color-primary-dark))',
    ]);
    expect(fills('b7r-mark')).toEqual([
      'fill:var(--logo-accent, var(--color-accent))',
      'fill:var(--logo-primary-dark, var(--color-primary-dark))',
    ]);
    // No colour is baked into the artwork: every fill comes from a token.
    expect(sprite).not.toMatch(/fill="#|#[0-9a-f]{6}/i);
  });

  it('keeps the view boxes the sprite was traced at, and a URL that changes with the trace', () => {
    expect(sprite).toContain(
      `<symbol id="b7r-logo" viewBox="0 0 ${LOGO_BOX.width} ${LOGO_BOX.height}">`,
    );
    expect(sprite).toContain(
      `<symbol id="b7r-mark" viewBox="0 0 ${MARK_BOX.width} ${MARK_BOX.height}">`,
    );
    expect(MARK_BOX.width).toBe(MARK_BOX.height);
    const version = createHash('sha256').update(sprite).digest('hex').slice(0, 10);
    expect(LOGO_SPRITE).toBe(`/images/logo/sprite.svg?v=${version}`);
  });

  it('draws a use of the symbol, white on a dark background through its class', () => {
    const { container } = render(
      <>
        <BrandLogo className="h-9 w-auto" />
        <BrandLogo mark onDark className="size-16" />
      </>,
    );
    const [logo, mark] = [...container.querySelectorAll('svg')];
    expect(logo!.querySelector('use')!.getAttribute('href')).toBe(`${LOGO_SPRITE}#b7r-logo`);
    expect(logo!.getAttribute('aria-hidden')).toBe('true');
    expect(logo!.classList.contains('logo-on-dark')).toBe(false);
    expect(mark!.querySelector('use')!.getAttribute('href')).toBe(`${LOGO_SPRITE}#b7r-mark`);
    expect(mark!.classList.contains('logo-on-dark')).toBe(true);
  });

  it('turns every layer white on a dark background (globals.css)', () => {
    const css = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
    const rule = /\.logo-on-dark\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    for (const layer of ['primary', 'accent', 'primary-dark']) {
      expect(rule, layer).toMatch(new RegExp(`--logo-${layer}:\\s*#ffffff;`));
    }
  });

  it('gives way to an upload from the Logo tab, which keeps its own colours', () => {
    const upload = { src: '/api/media/file/logo.png', width: 400, height: 146 };
    const drawn = render(<ShellLogo logo={null} className="h-9 w-auto" />).container;
    expect(drawn.querySelector('svg[data-brand-logo="logo"]')).not.toBeNull();
    const uploaded = render(<ShellLogo logo={upload} className="h-9 w-auto" />).container;
    expect(uploaded.querySelector('svg')).toBeNull();
    expect(uploaded.querySelector('img')!.getAttribute('src')).toContain('logo.png');
  });
});

describe('the app icons', () => {
  it('draws the three sizes it names and no other, so no size is drawn on demand', () => {
    expect(appIconSize('32')).toBe(32);
    expect(appIconSize('192')).toBe(192);
    expect(appIconSize('512')).toBe(512);
    for (const id of ['99', '5120', '032', '32.0', '', 'icon'])
      expect(appIconSize(id), id).toBe(null);
  });

  it('lists every icon route for the save to regenerate', () => {
    expect(APP_ICON_ROUTES).toEqual(['/icon/32', '/icon/192', '/icon/512', '/apple-icon']);
  });
});

describe('the colours painted outside the stylesheet', () => {
  it('are the saved brand, and the shipped one when the saved brand cannot be used', () => {
    const saved = toAppearance({ sources: { ...DEFAULT_SOURCES, primary: '#1a5caf' }, pins: [] });
    expect(paintedColours(saved.appearance)('primary')).toBe('#1a5caf');
    const unreadable = toAppearance({ sources: { ...DEFAULT_SOURCES, primary: '#ffff00' } });
    expect(paintedColours(unreadable.appearance)('primary')).toBe(DEFAULT_SOURCES.primary);
  });
});
