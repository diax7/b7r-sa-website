import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';
import { createRequire } from 'node:module';
import { redirectRules } from './src/lib/redirects';
import { s3PublicOrigin, s3RemotePatterns } from './src/lib/image-url';
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
    // 3840 lets a 2x screen at 1920 ask for a full-width photo once the 3000 px photographs
    // land (ADR-029, amended 2026-09-19); `PHOTO_MAX_WIDTH` in src/lib/photo.ts is this value.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],
    // 75 is Next's default (logos, icons, badges), 82 the designer's mock-up (`optimizedSrc`),
    // 90 every photo (`PHOTO_QUALITY`): one lossy encode over a q92 source.
    qualities: [75, 82, 90],
    // An optimised rendition is cached for a year (CMS media filenames are unique, ADR-029);
    // a `public/` image that changes must change its name to reach a returning browser.
    minimumCacheTTL: 31536000,
    // CMS media on S3 (ADR-029): the optimizer fetches it, the browser never does.
    remotePatterns: s3RemotePatterns(),
    // Next refuses to optimise images from a private IP (SSRF guard). Only the CI MinIO job
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
