import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { ar } from '@payloadcms/translations/languages/ar';
import { en } from '@payloadcms/translations/languages/en';
import { buildConfig } from 'payload';
import { Faqs } from '@/modules/cms/collections/faqs';
import { Integrations } from '@/modules/cms/collections/integrations';
import { Media } from '@/modules/cms/collections/media';
import { Pages } from '@/modules/cms/collections/pages';
import { Products } from '@/modules/cms/collections/products';
import { Testimonials } from '@/modules/cms/collections/testimonials';
import { Users } from '@/modules/cms/collections/users';
import { cmsEnv, isBuildPhase } from '@/lib/cms/env';
import { Home } from '@/modules/cms/globals/home';
import { Navigation } from '@/modules/cms/globals/navigation';
import { SeoDefaults } from '@/modules/cms/globals/seo-defaults';
import { SiteSettings } from '@/modules/cms/globals/site-settings';
import { migrations } from '@/migrations';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const env = cmsEnv();

/**
 * Payload configuration (BRD 9.3). Admin at /admin in Arabic RTL, REST at /api/payload,
 * GraphQL off, SQL migrations only (`push: false`), run at container start except during
 * `next build` (ADR-025). S3 storage when configured, local disk otherwise (ADR-029).
 */
export default buildConfig({
  serverURL: env.serverUrl,
  secret: env.secret,
  routes: { admin: '/admin', api: '/api/payload' },
  graphQL: { disable: true },
  telemetry: false,
  // Expected client-side outcomes (a refused edit, a wrong password, a bad form) are not
  // server errors; keep the error log for what needs a human.
  loggingLevels: {
    AuthenticationError: 'info',
    Forbidden: 'info',
    NotFound: 'info',
    ValidationError: 'info',
  },
  admin: {
    user: Users.slug,
    // The default avatar fetches gravatar.com with a hash of the user's email (ADR-028).
    avatar: 'default',
    meta: {
      titleSuffix: ' | لوحة بحر برنت',
      icons: [{ rel: 'icon', type: 'image/png', url: '/icon.png' }],
    },
    components: {
      graphics: {
        Logo: '@/modules/cms/components/logo#Logo',
        Icon: '@/modules/cms/components/logo#Icon',
      },
    },
    importMap: { baseDir: path.resolve(dirname, '../..') },
  },
  i18n: { supportedLanguages: { ar, en }, fallbackLanguage: 'ar' },
  localization: {
    locales: [
      { code: 'ar', label: 'العربية', rtl: true },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'ar',
    fallback: true,
  },
  editor: lexicalEditor(),
  collections: [Users, Media, Products, Pages, Faqs, Testimonials, Integrations],
  globals: [Home, SiteSettings, Navigation, SeoDefaults],
  db: postgresAdapter({
    pool: { connectionString: env.databaseUrl },
    push: false,
    migrationDir: path.resolve(dirname, '../../migrations'),
    // Safety net for anything CI did not apply; never during the build (ADR-025).
    ...(isBuildPhase() ? {} : { prodMigrations: migrations }),
  }),
  plugins: [
    s3Storage({
      enabled: Boolean(env.s3),
      // The `prefix` column exists whether or not S3 is on, so one migration fits both
      // storages (local disk in dev and CI, S3 in production).
      alwaysInsertFields: true,
      collections: {
        media: {
          prefix: 'media',
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            `${env.s3?.publicUrl ?? ''}/${prefix ? `${prefix}/` : ''}${filename}`,
        },
      },
      bucket: env.s3?.bucket ?? '',
      config: {
        credentials: {
          accessKeyId: env.s3?.accessKeyId ?? '',
          secretAccessKey: env.s3?.secretAccessKey ?? '',
        },
        region: env.s3?.region ?? 'auto',
        endpoint: env.s3?.endpoint ?? '',
        forcePathStyle: true,
      },
    }),
  ],
  typescript: { outputFile: path.resolve(dirname, '../../payload-types.ts') },
  sharp: (await import('sharp')).default,
});
