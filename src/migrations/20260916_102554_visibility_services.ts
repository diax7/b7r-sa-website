import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * The visibility services (ADR-049 PR 3b): the three service kinds on the connections enum,
 * the nightly pull's task slug, and the `metrics` snapshots with their unique day-and-source
 * index, which the pull's upsert targets.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_metrics_source" AS ENUM('search-console', 'bing', 'pagespeed', 'score');
  ALTER TYPE "public"."enum_connections_kind" ADD VALUE 'google-search-console';
  ALTER TYPE "public"."enum_connections_kind" ADD VALUE 'bing-webmaster';
  ALTER TYPE "public"."enum_connections_kind" ADD VALUE 'pagespeed';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'visibility-pull' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'visibility-pull' BEFORE 'schedulePublish';
  CREATE TABLE "metrics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" varchar NOT NULL,
  	"source" "enum_metrics_source" NOT NULL,
  	"data" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "metrics_id" integer;
  CREATE INDEX "metrics_updated_at_idx" ON "metrics" USING btree ("updated_at");
  CREATE INDEX "metrics_created_at_idx" ON "metrics" USING btree ("created_at");
  CREATE UNIQUE INDEX "date_source_idx" ON "metrics" USING btree ("date","source");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_metrics_fk" FOREIGN KEY ("metrics_id") REFERENCES "public"."metrics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_metrics_id_idx" ON "payload_locked_documents_rels" USING btree ("metrics_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_metrics_fk";
  
  ALTER TABLE "connections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "connections" ALTER COLUMN "kind" SET DEFAULT 'openai'::text;
  DROP TYPE "public"."enum_connections_kind";
  CREATE TYPE "public"."enum_connections_kind" AS ENUM('openai', 'anthropic', 'google', 'deepseek', 'openai-compatible', 'mock');
  ALTER TABLE "connections" ALTER COLUMN "kind" SET DEFAULT 'openai'::"public"."enum_connections_kind";
  ALTER TABLE "connections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_connections_kind" USING "kind"::"public"."enum_connections_kind";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'indexnow-ping', 'content-tick', 'content-freshness', 'content-digest', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'indexnow-ping', 'content-tick', 'content-freshness', 'content-digest', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_locked_documents_rels_metrics_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "metrics_id";
  DROP TABLE "metrics" CASCADE;
  DROP TYPE "public"."enum_metrics_source";`)
}
