/** Up to two initials from the name (Arabic or Latin); the e-mail's first letter otherwise. */
export function initials(name: string, email: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0] ?? '');
  const out = letters.join('');
  return out || email[0]?.toUpperCase() || '?';
}
