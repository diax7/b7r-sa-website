import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';
import { createRequire } from 'node:module';
import { redirectRules } from './src/lib/redirects';
import { s3PublicOrigin, s3RemotePatterns } from './src/lib/image-url';
import { DEVICE_SIZES, IMAGE_SIZES } from './src/lib/renditions';
import { headerRoutes } from './src/lib/security-headers';

const require = createRequire(import.meta.url);
const { version } = require('./package.json') as { version: string };

const nextConfig: NextConfig = {
  output: 'standalone',
  // Next dev would write AGENTS.md/CLAUDE.md into the repo; the project keeps its own guidance.
  agentRules: false,
  // Two root layouts (site + admin): the 404 must render its own document (ADR-024).
  experimental: { globalNotFound: true },
  trailingSlash: false,
  // Payload stays a single runtime module instead of being bundled and minified into the
  // server chunks: its error classes keep their names (`loggingLevels` reads `err.name`) and
  // `instanceof` holds across the config boundary (ADR-033).
  serverExternalPackages: ['payload'],
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    APP_VERSION: version,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // The candidate widths are the rendition ladder, one file per candidate (ADR-064): a CMS
    // photo's `<Photo>` points every candidate at a file the upload wrote to the bucket, so
    // the two lists must agree, and `src/lib/renditions.ts` owns them. 1536 is the 2x
    // candidate of the 760 px reading column (a blog cover); 3840 lets a 2x screen at 1920
    // ask for a full-width photo once the 3000 px photographs land.
    deviceSizes: [...DEVICE_SIZES],
    imageSizes: [...IMAGE_SIZES],
    // What still goes through the optimizer: the `og:image` JPEG at 82 (`optimizedSrc`) and
    // the admin's thumbnail of a photo without renditions yet at 75. The photos' own encode
    // is `RENDITION_ENCODE`, done once on upload.
    qualities: [75, 82],
    // An optimised transform is cached for a year (CMS media filenames are unique, ADR-029);
    // a `public/` image that changes must change its name to reach a returning browser.
    minimumCacheTTL: 31536000,
    // CMS media on S3: the optimizer fetches an original for the `og:image` and the
    // thumbnail fallback; the browser fetches the renditions from the same host (ADR-064).
    remotePatterns: s3RemotePatterns(),
    // Next refuses to optimise images from a private IP (SSRF guard). Only the CI S3 job
    // serves media from localhost; production media sits on a public host.
    ...(process.env['IMAGES_ALLOW_LOCAL_IP'] === '1' ? { dangerouslyAllowLocalIP: true } : {}),
  },
  // BRD 8.10 headers and 5.2 redirects live in src/lib so they are unit-tested as data.
  async headers() {
    return headerRoutes({
      mediaOrigin: s3PublicOrigin(),
      allowEval: process.env.NODE_ENV === 'development',
    });
  },
  async redirects() {
    return redirectRules();
  },
};

export default withPayload(nextConfig);
