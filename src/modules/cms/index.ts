import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { resendAdapter } from '@payloadcms/email-resend';
import { redirectsPlugin } from '@payloadcms/plugin-redirects';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { en } from '@payloadcms/translations/languages/en';
import { buildConfig } from 'payload';
import { digestTask } from '@/modules/ai-content/digest';
import { freshnessTask } from '@/modules/ai-content/freshness';
import { contentTickTask } from '@/modules/ai-content/tick';
import { AI_QUEUE, generatePostWorkflow } from '@/modules/ai-content/workflow';
import { REDIRECT_OVERRIDES } from '@/modules/cms/collections/redirects';
import { indexNowTask } from '@/modules/cms/jobs/indexnow';
import { cmsEnv, isBuildPhase } from '@/lib/cms/env';
import { COLLECTIONS, GLOBALS } from '@/modules/cms/entities';
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
    user: 'users',
    // Dark only (Dhia, 2026-09-13; ADR-039): the panel keeps Payload's dark greys.
    theme: 'dark',
    // The default avatar fetches gravatar.com with a hash of the user's email (ADR-028).
    avatar: 'default',
    meta: {
      titleSuffix: ' | B7R Print Admin',
      icons: [{ rel: 'icon', type: 'image/png', url: '/icon.png' }],
    },
    components: {
      graphics: {
        Logo: '@/modules/cms/components/logo#Logo',
        Icon: '@/modules/cms/components/logo#Icon',
      },
      // The shell (ADR-039): sidebar with an icon per entity, header palette + site link.
      Nav: '@/modules/cms/admin/nav/nav#Nav',
      actions: ['@/modules/cms/admin/header/actions#HeaderActions'],
      views: { dashboard: { Component: '@/modules/cms/admin/dashboard/dashboard#Dashboard' } },
      // The Turnstile widget above the login form (ADR-034); one line under it (ADR-039).
      beforeLogin: ['@/modules/cms/auth/login-turnstile#LoginTurnstile'],
      afterLogin: ['@/modules/cms/admin/login/after-login#AfterLogin'],
    },
    importMap: { baseDir: path.resolve(dirname, '../..') },
  },
  // The panel is English for everyone (Dhia, 2026-09-13; ADR-039): one UI language, so a
  // browser's Accept-Language cannot switch it. The content locale (`localization`) is a
  // separate setting and stays Arabic-first.
  i18n: { supportedLanguages: { en }, fallbackLanguage: 'en' },
  localization: {
    locales: [
      { code: 'ar', label: 'العربية', rtl: true },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'ar',
    fallback: true,
  },
  editor: lexicalEditor(),
  // Password resets go out through Resend when configured (ADR-034); otherwise Payload logs
  // the e-mail and the RUNBOOK's manual reset applies.
  ...(env.email
    ? {
        email: resendAdapter({
          apiKey: env.email.apiKey,
          defaultFromAddress: env.email.fromAddress,
          defaultFromName: env.email.fromName,
        }),
      }
    : {}),
  collections: COLLECTIONS,
  globals: GLOBALS,
  db: postgresAdapter({
    pool: { connectionString: env.databaseUrl },
    push: false,
    migrationDir: path.resolve(dirname, '../../migrations'),
    // Safety net for anything CI did not apply; never during the build (ADR-025).
    ...(isBuildPhase() ? {} : { prodMigrations: migrations }),
  }),
  /**
   * Jobs (ADR-033): the IndexNow ping and Payload's scheduled publish run in-process on a
   * one-minute cron (never during `next build`); the run endpoint answers nobody, the cron
   * is the only runner. Completed jobs are deleted.
   */
  jobs: {
    tasks: [indexNowTask, contentTickTask, freshnessTask, digestTask],
    workflows: [generatePostWorkflow],
    // The default queue serves IndexNow and scheduled publishes; the `ai` queue runs one
    // content-engine job at a time and carries the engine's schedules: the hourly tick, the
    // weekly freshness pass and the weekly digest (ADR-042).
    autoRun: [
      { cron: '* * * * *', limit: 10 },
      { cron: '* * * * *', queue: AI_QUEUE, limit: 1 },
    ],
    shouldAutoRun: () => !isBuildPhase(),
    deleteJobOnComplete: true,
    access: { run: () => false },
  },
  plugins: [
    redirectsPlugin({
      collections: ['pages'],
      redirectTypes: ['301', '302'],
      overrides: REDIRECT_OVERRIDES,
    }),
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
