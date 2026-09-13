import { describe, expect, it } from 'vitest';
import { optimizedSrc, s3PublicOrigin, s3RemotePatterns } from '@/lib/image-url';

describe('S3 media host (ADR-029)', () => {
  it('is absent until a storage endpoint is configured', () => {
    expect(s3RemotePatterns({})).toEqual([]);
    expect(s3PublicOrigin({})).toBeUndefined();
    expect(s3RemotePatterns({ S3_ENDPOINT: 'nope' })).toEqual([]);
  });

  it('allows only the site bucket on a shared path-style endpoint', () => {
    expect(
      s3RemotePatterns({ S3_ENDPOINT: 'http://localhost:9000', S3_BUCKET: 'b7r-media' }),
    ).toEqual([
      { protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/b7r-media/**' },
    ]);
    expect(s3PublicOrigin({ S3_ENDPOINT: 'http://localhost:9000' })).toBe('http://localhost:9000');
  });

  it('allows the whole path of a dedicated public host', () => {
    expect(
      s3RemotePatterns({
        S3_ENDPOINT: 'https://s3.example.com',
        S3_BUCKET: 'b7r-media',
        S3_PUBLIC_URL: 'https://media.b7r.sa',
      }),
    ).toEqual([{ protocol: 'https', hostname: 'media.b7r.sa', pathname: '/**' }]);
  });
});

describe('optimizedSrc', () => {
  it('builds the optimizer URL the way next/image does', () => {
    expect(optimizedSrc('/api/payload/media/file/a.jpg', 1080)).toBe(
      '/_next/image?url=%2Fapi%2Fpayload%2Fmedia%2Ffile%2Fa.jpg&w=1080&q=82',
    );
    expect(optimizedSrc('https://media.b7r.sa/media/a.jpg', 640, 75)).toContain(
      'url=https%3A%2F%2Fmedia.b7r.sa%2Fmedia%2Fa.jpg&w=640&q=75',
    );
  });
});
