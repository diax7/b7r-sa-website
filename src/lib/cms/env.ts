/**
 * CMS environment (BRD 9.2). Read here, without `server-only`, because the Payload CLI loads
 * the config outside a React server context (migrations, import map). Never imported by
 * client code: the values are secrets.
 */
export interface CmsEnv {
  databaseUrl: string;
  secret: string;
  serverUrl: string;
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
  return {
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
