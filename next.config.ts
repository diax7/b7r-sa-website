import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('./package.json') as { version: string };

const nextConfig: NextConfig = {
  output: 'standalone',
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
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
