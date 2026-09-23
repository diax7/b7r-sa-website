import Image from 'next/image';
import { cn } from '@/lib/cn';
import type { LogoImage } from '@/modules/core/logo-image';
import { LOGO, MARK } from '@/modules/core/logo-paths';

type Layer = keyof typeof LOGO.paths;

/**
 * Each blue of the logo painted with the token it stands for (spec 010, phase 1d), so the
 * logo follows the Appearance screen. A wrapper may set `--logo-*` to repaint every layer
 * (the footer's white logo, `.logo-on-dark` in `globals.css`).
 */
const FILL: Record<Layer, string> = {
  primary: 'var(--logo-primary, var(--color-primary))',
  accent: 'var(--logo-accent, var(--color-accent))',
  primaryDark: 'var(--logo-primary-dark, var(--color-primary-dark))',
};

export const LOGO_SYMBOL = 'b7r-logo';
export const MARK_SYMBOL = 'b7r-mark';

function layers(art: { paths: Partial<Record<Layer, string>> }) {
  return (Object.entries(art.paths) as Array<[Layer, string]>).map(([layer, d]) => (
    <path key={layer} d={d} fillRule="evenodd" style={{ fill: FILL[layer] }} />
  ));
}

/**
 * The logo and the square mark as symbols, once per document: every drawn logo on the page
 * is a `<use>` of these, so the path data is sent once however many places show it.
 */
export function BrandSymbols() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute">
      <symbol id={LOGO_SYMBOL} viewBox={`0 0 ${LOGO.width} ${LOGO.height}`}>
        {layers(LOGO)}
      </symbol>
      <symbol id={MARK_SYMBOL} viewBox={`0 0 ${MARK.width} ${MARK.height}`}>
        {layers(MARK)}
      </symbol>
    </svg>
  );
}

/**
 * The drawn logo (or the square mark), sized by its class: give it a height, the width
 * follows the artwork. Decorative: the link or the heading around it carries the name.
 */
export function BrandLogo({
  mark = false,
  onDark = false,
  className,
}: {
  mark?: boolean;
  /** White on a dark background, as the footer's. */
  onDark?: boolean;
  className?: string;
}) {
  const art = mark ? MARK : LOGO;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${art.width} ${art.height}`}
      className={cn(onDark && 'logo-on-dark', className)}
      data-brand-logo={mark ? 'mark' : 'logo'}
    >
      <use href={`#${mark ? MARK_SYMBOL : LOGO_SYMBOL}`} />
    </svg>
  );
}

/**
 * The logo a place of the shell shows (spec 010): the Appearance screen's upload when there
 * is one, else the drawn logo in the brand's colours. The upload keeps its own colours; the
 * drawn one follows the brand.
 */
export function ShellLogo({
  logo,
  className,
  sizes,
  priority = false,
  onDark = false,
}: {
  logo: LogoImage | null;
  className: string;
  sizes?: string;
  priority?: boolean;
  onDark?: boolean;
}) {
  if (!logo) return <BrandLogo onDark={onDark} className={className} />;
  return (
    <Image
      src={logo.src}
      alt=""
      width={logo.width}
      height={logo.height}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
