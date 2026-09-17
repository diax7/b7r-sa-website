/**
 * CMS environment (BRD 9.2). Read here, without `server-only`, because the Payload CLI loads
 * the config outside a React server context (migrations, import map). Never imported by
 * client code: the values are secrets.
 */
export interface CmsEnv {
  databaseUrl: string;
  secret: string;
  serverUrl: string;
  /** Resend for the admin's own e-mail (password resets); undefined → console. */
  email: { apiKey: string; fromAddress: string; fromName: string } | undefined;
  s3:
    | {
        bucket: string;
        region: string;
        endpoint: string;
        accessKeyId: string;
        secretAccessKey: string;
        /** Public base for object URLs; defaults to `${endpoint}/${bucket}` (path style). */
        publicUrl: string;
      }
    | undefined;
}

/**
 * The production runtime: `B7R_RUNTIME=production` is set solely in the CranL production
 * app, never derived from the origin, so CI and previews never act as production.
 */
export function isProductionRuntime(
  raw: Record<string, string | undefined> = process.env,
): boolean {
  return raw['B7R_RUNTIME'] === 'production';
}

/** The sender when `RESEND_FROM` is unset: the brand on its own domain (the one Resend verifies). */
export const DEFAULT_FROM = 'بحر برنت <no-reply@b7r.sa>';

export function cmsEnv(raw: Record<string, string | undefined> = process.env): CmsEnv {
  const bucket = raw['S3_BUCKET'];
  const endpoint = raw['S3_ENDPOINT'];
  const s3 =
    bucket && endpoint
      ? {
          bucket,
          region: raw['S3_REGION'] || 'auto',
          endpoint,
          accessKeyId: raw['S3_ACCESS_KEY_ID'] ?? '',
          secretAccessKey: raw['S3_SECRET_ACCESS_KEY'] ?? '',
          publicUrl: (raw['S3_PUBLIC_URL'] || `${endpoint.replace(/\/$/, '')}/${bucket}`).replace(
            /\/$/,
            '',
          ),
        }
      : undefined;
  const from = parseFrom(raw['RESEND_FROM'] || DEFAULT_FROM);
  const email =
    raw['RESEND_API_KEY'] && from ? { apiKey: raw['RESEND_API_KEY'], ...from } : undefined;
  return {
    email,
    databaseUrl: raw['DATABASE_URL'] ?? '',
    secret: raw['PAYLOAD_SECRET'] ?? '',
    serverUrl:
      raw['PAYLOAD_PUBLIC_SERVER_URL'] || raw['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3004',
    s3,
  };
}

/** True while `next build` runs: hooks and start-up migrations must not touch production. */
export function isBuildPhase(raw: Record<string, string | undefined> = process.env): boolean {
  return raw['NEXT_PHASE'] === 'phase-production-build';
}

/** `بحر برنت <no-reply@b7r.sa>` or a bare address → the adapter's name + address. */
export function parseFrom(
  value: string | undefined,
): { fromAddress: string; fromName: string } | undefined {
  if (!value) return undefined;
  const match = /^\s*(?:"?([^"<]*?)"?\s*)?<([^<>\s]+@[^<>\s]+)>\s*$/.exec(value);
  if (match) return { fromName: match[1]?.trim() || 'بحر برنت', fromAddress: match[2] ?? '' };
  if (/^[^<>\s]+@[^<>\s]+$/.test(value.trim())) {
    return { fromName: 'بحر برنت', fromAddress: value.trim() };
  }
  return undefined;
}
