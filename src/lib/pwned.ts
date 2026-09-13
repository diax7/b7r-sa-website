import { createHash } from 'node:crypto';

export const PASSWORD_MIN_LENGTH = 12;
const RANGE_URL = 'https://api.pwnedpasswords.com/range/';

/**
 * Have I Been Pwned k-anonymity check (BRD 9.3 "where feasible"): only the first five hex
 * characters of the SHA-1 leave the server. Returns how many breaches contain the password,
 * or null when the service could not be reached (the caller fails open and logs).
 */
export async function pwnedCount(
  password: string,
  fetchImpl: typeof fetch = fetch,
): Promise<number | null> {
  const sha1 = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  try {
    const res = await fetchImpl(`${RANGE_URL}${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return countInRange(await res.text(), suffix);
  } catch {
    return null;
  }
}

/** Parses the `SUFFIX:COUNT` lines of a range response. */
export function countInRange(body: string, suffix: string): number {
  for (const line of body.split(/\r?\n/)) {
    const [hash, count] = line.split(':');
    if (hash?.toUpperCase() === suffix) return Number(count ?? 0);
  }
  return 0;
}

export type PasswordProblem = 'too_short' | 'breached';

/** The policy for admin users: length first, then the breach check (fail-open). */
export async function passwordProblem(
  password: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PasswordProblem | null> {
  if (password.length < PASSWORD_MIN_LENGTH) return 'too_short';
  const count = await pwnedCount(password, fetchImpl);
  if (count === null) {
    console.warn('pwned: breach check unavailable; accepting the password on length alone');
    return null;
  }
  return count > 0 ? 'breached' : null;
}
