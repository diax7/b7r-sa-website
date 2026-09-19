import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Umami on the dashboard (Level 4 PR 4c, ADR-048 amended): the `umami` connection kind and
 * the `umami` snapshot source. Additive: two enum values, `IF NOT EXISTS` so a database that
 * took them from an earlier build of the branch is not refused.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_connections_kind" ADD VALUE IF NOT EXISTS 'umami';
  ALTER TYPE "public"."enum_metrics_source" ADD VALUE IF NOT EXISTS 'umami';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "connections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "connections" ALTER COLUMN "kind" SET DEFAULT 'openai'::text;
  DROP TYPE "public"."enum_connections_kind";
  CREATE TYPE "public"."enum_connections_kind" AS ENUM('openai', 'anthropic', 'google', 'deepseek', 'openai-compatible', 'mock', 'google-search-console', 'bing-webmaster', 'pagespeed');
  ALTER TABLE "connections" ALTER COLUMN "kind" SET DEFAULT 'openai'::"public"."enum_connections_kind";
  ALTER TABLE "connections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_connections_kind" USING "kind"::"public"."enum_connections_kind";
  ALTER TABLE "metrics" ALTER COLUMN "source" SET DATA TYPE text;
  DROP TYPE "public"."enum_metrics_source";
  CREATE TYPE "public"."enum_metrics_source" AS ENUM('search-console', 'bing', 'pagespeed', 'score');
  ALTER TABLE "metrics" ALTER COLUMN "source" SET DATA TYPE "public"."enum_metrics_source" USING "source"::"public"."enum_metrics_source";`)
}
