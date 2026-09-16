/**
 * A service account's JSON key (Search Console, ADR-049): the three fields the JWT flow
 * needs, or a reason the paste is not one. Nothing else of the file is read; the token
 * endpoint is Google's, never the file's (a signed assertion goes nowhere else).
 */
export interface ServiceAccountKey {
  clientEmail: string;
  privateKey: string;
  privateKeyId: string;
  tokenUri: string;
}

export const GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token';

export function parseServiceAccount(plain: string): ServiceAccountKey | string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(plain);
  } catch {
    return 'not JSON: paste the whole key file';
  }
  const key = parsed as Record<string, unknown>;
  if (!key || typeof key !== 'object') return 'not a key file';
  if (key['type'] !== 'service_account')
    return 'not a service account key (type is not service_account)';
  const clientEmail = key['client_email'];
  const privateKey = key['private_key'];
  if (typeof clientEmail !== 'string' || !clientEmail.includes('@'))
    return 'client_email is missing';
  if (typeof privateKey !== 'string' || !privateKey.includes('PRIVATE KEY'))
    return 'private_key is missing';
  if (key['token_uri'] !== undefined && key['token_uri'] !== GOOGLE_TOKEN_URI)
    return `token_uri is not ${GOOGLE_TOKEN_URI}`;
  return {
    clientEmail,
    privateKey,
    privateKeyId: typeof key['private_key_id'] === 'string' ? key['private_key_id'] : '',
    tokenUri: GOOGLE_TOKEN_URI,
  };
}
