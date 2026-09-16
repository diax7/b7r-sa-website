import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * The citation ledger (ADR-049 PR 3c): the `prompts` and `citations` tables, the `citation`
 * run kind on `ai-runs`, the weekly job's task slug.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_prompts_language" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_prompts_intent" AS ENUM('category', 'compare', 'how-to');
  CREATE TYPE "public"."enum_citations_mode" AS ENUM('search', 'plain');
  ALTER TYPE "public"."enum_ai_runs_kind" ADD VALUE 'citation';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'citation-ledger' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'citation-ledger' BEFORE 'schedulePublish';
  CREATE TABLE "prompts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"language" "enum_prompts_language" DEFAULT 'ar' NOT NULL,
  	"intent" "enum_prompts_intent" DEFAULT 'category' NOT NULL,
  	"order" numeric DEFAULT 100 NOT NULL,
  	"names_brand" boolean DEFAULT false,
  	"enabled" boolean DEFAULT true,
  	"last_saved_by_name" varchar,
  	"last_saved_by_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "citations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" varchar NOT NULL,
  	"provider" varchar NOT NULL,
  	"model" varchar,
  	"mode" "enum_citations_mode" NOT NULL,
  	"mentioned" boolean DEFAULT false,
  	"linked" boolean DEFAULT false,
  	"names_brand" boolean DEFAULT false,
  	"excerpt" varchar,
  	"urls" jsonb,
  	"competitors" jsonb,
  	"prompt_id" integer,
  	"connection_id" integer,
  	"run_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "prompts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "citations_id" integer;
  ALTER TABLE "citations" ADD CONSTRAINT "citations_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "citations" ADD CONSTRAINT "citations_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "citations" ADD CONSTRAINT "citations_run_id_ai_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ai_runs"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "prompts_updated_at_idx" ON "prompts" USING btree ("updated_at");
  CREATE INDEX "prompts_created_at_idx" ON "prompts" USING btree ("created_at");
  CREATE INDEX "citations_prompt_idx" ON "citations" USING btree ("prompt_id");
  CREATE INDEX "citations_connection_idx" ON "citations" USING btree ("connection_id");
  CREATE INDEX "citations_run_idx" ON "citations" USING btree ("run_id");
  CREATE INDEX "citations_updated_at_idx" ON "citations" USING btree ("updated_at");
  CREATE INDEX "citations_created_at_idx" ON "citations" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_prompts_fk" FOREIGN KEY ("prompts_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_citations_fk" FOREIGN KEY ("citations_id") REFERENCES "public"."citations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_prompts_id_idx" ON "payload_locked_documents_rels" USING btree ("prompts_id");
  CREATE INDEX "payload_locked_documents_rels_citations_id_idx" ON "payload_locked_documents_rels" USING btree ("citations_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "prompts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "citations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "prompts" CASCADE;
  DROP TABLE "citations" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_prompts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_citations_fk";
  
  ALTER TABLE "ai_runs" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "ai_runs" ALTER COLUMN "kind" SET DEFAULT 'generate'::text;
  DROP TYPE "public"."enum_ai_runs_kind";
  CREATE TYPE "public"."enum_ai_runs_kind" AS ENUM('generate', 'freshness');
  ALTER TABLE "ai_runs" ALTER COLUMN "kind" SET DEFAULT 'generate'::"public"."enum_ai_runs_kind";
  ALTER TABLE "ai_runs" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_ai_runs_kind" USING "kind"::"public"."enum_ai_runs_kind";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'indexnow-ping', 'content-tick', 'content-freshness', 'content-digest', 'visibility-pull', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'indexnow-ping', 'content-tick', 'content-freshness', 'content-digest', 'visibility-pull', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_locked_documents_rels_prompts_id_idx";
  DROP INDEX "payload_locked_documents_rels_citations_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "prompts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "citations_id";
  DROP TYPE "public"."enum_prompts_language";
  DROP TYPE "public"."enum_prompts_intent";
  DROP TYPE "public"."enum_citations_mode";`)
}
