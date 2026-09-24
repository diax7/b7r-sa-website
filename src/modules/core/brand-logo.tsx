import { StaticImage } from '@/components/shared/static-image';
import { cn } from '@/lib/cn';
import { LOGO_BOX, LOGO_SPRITE, MARK_BOX } from '@/modules/core/logo-box';
import type { LogoImage } from '@/modules/core/logo-image';

/**
 * The drawn logo (or the square mark), sized by its class: give it a height, the width
 * follows the artwork. Decorative: the link or the heading around it carries the name.
 *
 * A `<use>` of the traced sprite (spec 010, phase 1d), whose paths are filled with
 * `var(--logo-*, var(--color-*))`: the custom properties inherit into the drawing, so the
 * logo takes the brand's colours, and a wrapper can repaint every layer (the footer's white,
 * `.logo-on-dark` in `globals.css`). The sprite is a static file the browser caches once, so
 * no path data rides in a page's HTML or JavaScript.
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
  const box = mark ? MARK_BOX : LOGO_BOX;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${box.width} ${box.height}`}
      className={cn(onDark && 'logo-on-dark', className)}
      data-brand-logo={mark ? 'mark' : 'logo'}
    >
      <use href={`${LOGO_SPRITE}#${mark ? 'b7r-mark' : 'b7r-logo'}`} />
    </svg>
  );
}

/**
 * The logo a place of the shell shows (spec 010): the Appearance screen's upload when there
 * is one, else the drawn logo in the brand's colours. The upload keeps its own colours and is
 * served as it was uploaded, from the storage CDN, never through the image optimizer
 * (ADR-064); `priority` preloads it, as the header's is.
 */
export function ShellLogo({
  logo,
  className,
  priority = false,
  onDark = false,
}: {
  logo: LogoImage | null;
  className: string;
  priority?: boolean;
  onDark?: boolean;
}) {
  if (!logo) return <BrandLogo onDark={onDark} className={className} />;
  return (
    <StaticImage
      src={logo.src}
      alt=""
      width={logo.width}
      height={logo.height}
      preload={priority}
      className={className}
    />
  );
}
