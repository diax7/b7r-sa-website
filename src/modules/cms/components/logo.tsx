/* eslint-disable @next/next/no-img-element -- Payload's admin graphics are plain images */

/** Brand mark for the admin login and nav (BRD 9.3). Served from the site's public folder. */
export function Logo() {
  return <img src="/images/logo/logo.png" alt="بحر برنت" style={{ height: 56, width: 'auto' }} />;
}

export function Icon() {
  return <img src="/images/logo/icon.png" alt="" style={{ height: 28, width: 28 }} />;
}
