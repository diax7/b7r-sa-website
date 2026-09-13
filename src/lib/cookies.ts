/** The named cookie's value from a `Cookie` header, or undefined. */
export function readCookie(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

/** Next's draft-mode cookie: present while an editor previews drafts (ADR-039). */
export const DRAFT_COOKIE = '__prerender_bypass';

export function hasDraftCookie(header: string | null | undefined): boolean {
  return readCookie(header, DRAFT_COOKIE) !== undefined;
}
