import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';
import { createRequire } from 'node:module';
import { redirectRules } from './src/lib/redirects';
import { s3PublicOrigin, s3RemotePatterns } from './src/lib/image-url';
import { headerRoutes, originOf } from './src/lib/security-headers';

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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560],
    qualities: [75, 82],
    // CMS media on S3 (ADR-029): the optimizer fetches it, the browser never does.
    remotePatterns: s3RemotePatterns(),
    // Next refuses to optimise images from a private IP (SSRF guard). Only the CI MinIO job
    // serves media from localhost; production media sits on a public host.
    ...(process.env['IMAGES_ALLOW_LOCAL_IP'] === '1' ? { dangerouslyAllowLocalIP: true } : {}),
  },
  // BRD 8.10 headers and 5.2 redirects live in src/lib so they are unit-tested as data.
  async headers() {
    return headerRoutes({
      umamiOrigin: originOf(process.env.NEXT_PUBLIC_UMAMI_SRC),
      mediaOrigin: s3PublicOrigin(),
      allowEval: process.env.NODE_ENV === 'development',
    });
  },
  async redirects() {
    return redirectRules();
  },
};

export default withPayload(nextConfig);
