import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';
import createNextIntlPlugin from 'next-intl/plugin';
import { createRequire } from 'node:module';
import { redirectRules } from './src/lib/redirects';
import { s3RemotePatterns } from './src/lib/image-url';
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
  },
  // BRD 8.10 headers and 5.2 redirects live in src/lib so they are unit-tested as data.
  async headers() {
    return headerRoutes({
      umamiOrigin: originOf(process.env.NEXT_PUBLIC_UMAMI_SRC),
      allowEval: process.env.NODE_ENV === 'development',
    });
  },
  async redirects() {
    return redirectRules();
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withPayload(withNextIntl(nextConfig));
