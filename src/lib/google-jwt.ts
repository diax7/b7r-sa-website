import type { ServiceAccountKey } from '@/lib/service-account';

/**
 * A Google access token from a service account (ADR-049): the JWT-bearer flow, signed with the
 * account's private key through Web Crypto (RS256), no `google-auth-library`. The token lives
 * in memory keyed by the key's id until it expires, never on a row. Forty lines, tested with a
 * key generated at test time.
 */
export const SEARCH_CONSOLE_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

const TOKEN_TTL_S = 3600;
const cache = new Map<string, { token: string; expiresAt: number }>();

function base64url(bytes: Uint8Array | string): string {
  const raw = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
  let binary = '';
  for (const b of raw) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** The signed assertion for one scope, valid for an hour from `now`. */
export async function signJwt(
  key: ServiceAccountKey,
  scope: string,
  now = new Date(),
): Promise<string> {
  const iat = Math.floor(now.getTime() / 1000);
  const header = base64url(
    JSON.stringify({
      alg: 'RS256',
      typ: 'JWT',
      ...(key.privateKeyId ? { kid: key.privateKeyId } : {}),
    }),
  );
  const claims = base64url(
    JSON.stringify({ iss: key.clientEmail, scope, aud: key.tokenUri, iat, exp: iat + TOKEN_TTL_S }),
  );
  const signingKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(key.privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signingKey,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  return `${header}.${claims}.${base64url(new Uint8Array(signature))}`;
}

/** The access token, from memory while it lasts, else from Google's token endpoint. */
export async function accessToken(
  key: ServiceAccountKey,
  scope: string,
  fetcher: typeof fetch = fetch,
  now = new Date(),
): Promise<string> {
  const cacheKey = `${key.privateKeyId || key.clientEmail}\n${scope}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now.getTime() + 60_000) return cached.token;
  const assertion = await signJwt(key, scope, now);
  const res = await fetcher(key.tokenUri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Google token endpoint answered ${res.status}`);
  const body = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!body.access_token) throw new Error('Google token endpoint answered without a token');
  cache.set(cacheKey, {
    token: body.access_token,
    expiresAt: now.getTime() + (body.expires_in ?? TOKEN_TTL_S) * 1000,
  });
  return body.access_token;
}

/** For the tests. */
export function forgetTokens(): void {
  cache.clear();
}
