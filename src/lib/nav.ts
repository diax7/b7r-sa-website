/** Active-link rule (BRD 5.3): exact match, or prefix match for /products/* and /blog/*. */
export function isActive(
  pathname: string,
  item: { href: string; matchPrefix?: string | undefined },
): boolean {
  if (item.href === '/') return pathname === '/';
  return item.matchPrefix ? pathname.startsWith(item.matchPrefix) : pathname === item.href;
}
