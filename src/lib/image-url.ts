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

/** `images.remotePatterns` entry for the S3 public host, when configured. */
export function s3RemotePatterns(
  raw: Record<string, string | undefined> = process.env,
): RemotePattern[] {
  const base = raw['S3_PUBLIC_URL'] || raw['S3_ENDPOINT'];
  if (!base) return [];
  try {
    const url = new URL(base);
    return [
      {
        protocol: url.protocol === 'http:' ? 'http' : 'https',
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: '/**',
      },
    ];
  } catch {
    return [];
  }
}

/** The optimizer URL `next/image` would request for `src` at `width`; for raw `<img>`/Konva loads. */
export function optimizedSrc(src: string, width: number, quality = 82): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
