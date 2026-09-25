import { BrandLogo } from '@/modules/core/brand-logo';

/**
 * The logo on the admin login (BRD 9.3): the traced logo of the site (spec 010), in the
 * panel's shipped blues (`admin.css`), named for assistive technology since the drawing is
 * decorative. Sized inline: the panel's stylesheet has no utility for this place.
 */
export function Logo() {
  return (
    <span role="img" aria-label="بحر برنت" style={{ display: 'inline-block' }}>
      <BrandLogo style={{ display: 'block', height: 56, width: 'auto' }} />
    </span>
  );
}

/** Square; the inline `maxWidth` beats the site preflight's `max-width: 100%`. */
export function Icon() {
  return <BrandLogo mark style={{ display: 'block', height: 24, width: 24, maxWidth: 'none' }} />;
}
