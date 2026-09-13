/**
 * Media URL helpers (ADR-029). The browser never requests a storage URL directly: every image
 * goes through Next's optimizer, which keeps the CSP at `img-src 'self'` and, for the designer,
 * keeps the Konva canvas untainted (same-origin response).
 */
interface RemotePattern {
  protocol: 'http' | 'https';
  hostname: string;
  port?: string;
  pathname?: string;
}

type RawEnv = Record<string, string | undefined>;

/** The URL media is served from (`S3_PUBLIC_URL`, else the endpoint), or undefined when local. */
function s3PublicBase(raw: RawEnv): URL | undefined {
  const base = raw['S3_PUBLIC_URL'] || raw['S3_ENDPOINT'];
  if (!base) return undefined;
  try {
    return new URL(base);
  } catch {
    return undefined;
  }
}

/** Origin of the S3 public host for the admin CSP, when configured. */
export function s3PublicOrigin(raw: RawEnv = process.env): string | undefined {
  return s3PublicBase(raw)?.origin;
}

/** `images.remotePatterns` entry for the S3 public host, when configured. */
export function s3RemotePatterns(raw: RawEnv = process.env): RemotePattern[] {
  const url = s3PublicBase(raw);
  if (!url) return [];
  return [
    {
      protocol: url.protocol === 'http:' ? 'http' : 'https',
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: '/**',
    },
  ];
}

/** The optimizer URL `next/image` would request for `src` at `width`; for raw `<img>`/Konva loads. */
export function optimizedSrc(src: string, width: number, quality = 82): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
