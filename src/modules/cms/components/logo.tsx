/* eslint-disable @next/next/no-img-element -- Payload's admin graphics are plain images */

/** Brand mark for the admin login and nav (BRD 9.3). Served from the site's public folder. */
export function Logo() {
  return <img src="/images/logo/logo.png" alt="بحر برنت" style={{ height: 56, width: 'auto' }} />;
}

/** Square; the inline `maxWidth` beats the site preflight's `img { max-width: 100% }`. */
export function Icon() {
  return (
    <img
      src="/images/logo/icon.png"
      alt=""
      width={28}
      height={28}
      style={{ height: 28, width: 28, maxWidth: 'none', objectFit: 'contain', display: 'block' }}
    />
  );
}
