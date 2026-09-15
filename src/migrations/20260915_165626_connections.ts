import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * The engine's per-vendor keys become Connections (ADR-047): the collection and the two
 * relationships first, then one connection per vendor that had a key in the engine settings
 * (the ciphertext copied as it is, same scheme), the settings pointed at the connection of
 * the active vendor (or at a new mock connection when the mock was active), every run row
 * linked to the connection its provider text names, and the vendor columns dropped last.
 * Row ids are looked up, never assumed. A settings row whose active vendor had no key keeps
 * a null relationship, and the engine refuses with "no connection" until one is picked.
 * `down` restores the columns and copies the keys back by kind, the active vendor from the
 * connection's kind (a compatible connection reads back as the default, openai).
 */
const VENDORS = ['openai', 'deepseek', 'anthropic', 'google'] as const;

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_connections_kind" AS ENUM('openai', 'anthropic', 'google', 'deepseek', 'openai-compatible', 'mock');
  CREATE TABLE "connections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"kind" "enum_connections_kind" DEFAULT 'openai' NOT NULL,
  	"model" varchar,
  	"base_url" varchar,
  	"api_key" varchar,
  	"input_per_million_usd" numeric,
  	"output_per_million_usd" numeric,
  	"monthly_limit_usd" numeric,
  	"enabled" boolean DEFAULT true,
  	"last_test_at" timestamp(3) with time zone,
  	"last_test_ok" boolean,
  	"last_test_message" varchar,
  	"last_saved_by_name" varchar,
  	"last_saved_by_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "ai_runs" ADD COLUMN "connection_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "connections_id" integer;
  ALTER TABLE "ai_settings" ADD COLUMN "connection_id" integer;
  CREATE INDEX "connections_updated_at_idx" ON "connections" USING btree ("updated_at");
  CREATE INDEX "connections_created_at_idx" ON "connections" USING btree ("created_at");
  ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_connections_fk" FOREIGN KEY ("connections_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "ai_runs_connection_idx" ON "ai_runs" USING btree ("connection_id");
  CREATE INDEX "payload_locked_documents_rels_connections_id_idx" ON "payload_locked_documents_rels" USING btree ("connections_id");
  CREATE INDEX "ai_settings_connection_idx" ON "ai_settings" USING btree ("connection_id");`);

  // One connection per vendor with a key: the key, model and rates as they were.
  for (const vendor of VENDORS) {
    // oxlint-disable-next-line no-await-in-loop
    await db.execute(sql`
      INSERT INTO "connections" ("label", "kind", "model", "api_key", "input_per_million_usd", "output_per_million_usd", "enabled")
      SELECT
        ${vendor}::varchar,
        ${vendor}::"enum_connections_kind",
        ${sql.raw(`"providers_${vendor}_model"`)},
        ${sql.raw(`"providers_${vendor}_api_key"`)},
        ${sql.raw(`"providers_${vendor}_input_per_million_usd"`)},
        ${sql.raw(`"providers_${vendor}_output_per_million_usd"`)},
        true
      FROM "ai_settings"
      WHERE ${sql.raw(`"providers_${vendor}_api_key"`)} IS NOT NULL
      LIMIT 1;`);
  }
  // The mock, when it was the active provider (the review server, CI).
  await db.execute(sql`
    INSERT INTO "connections" ("label", "kind", "model", "input_per_million_usd", "output_per_million_usd", "enabled")
    SELECT 'Mock', 'mock'::"enum_connections_kind", 'mock', 0, 0, true
    FROM "ai_settings"
    WHERE "active_provider" = 'mock'
    LIMIT 1;`);
  // The settings point at the active vendor's connection, when one was made.
  await db.execute(sql`
    UPDATE "ai_settings" s
    SET "connection_id" = c."id"
    FROM "connections" c
    WHERE c."kind"::text = s."active_provider"::text;`);
  // Every run links to the connection its provider text names.
  await db.execute(sql`
    UPDATE "ai_runs" r
    SET "connection_id" = c."id"
    FROM "connections" c
    WHERE r."connection_id" IS NULL AND c."kind"::text = r."provider";`);

  await db.execute(sql`
   ALTER TABLE "ai_settings" DROP COLUMN "active_provider";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_openai_model";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_openai_api_key";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_openai_input_per_million_usd";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_openai_output_per_million_usd";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_deepseek_model";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_deepseek_api_key";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_deepseek_input_per_million_usd";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_deepseek_output_per_million_usd";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_anthropic_model";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_anthropic_api_key";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_anthropic_input_per_million_usd";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_anthropic_output_per_million_usd";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_google_model";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_google_api_key";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_google_input_per_million_usd";
  ALTER TABLE "ai_settings" DROP COLUMN "providers_google_output_per_million_usd";
  DROP TYPE "public"."enum_ai_settings_active_provider";`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ai_settings_active_provider" AS ENUM('openai', 'deepseek', 'anthropic', 'google', 'mock');
  ALTER TABLE "ai_settings" ADD COLUMN "active_provider" "enum_ai_settings_active_provider" DEFAULT 'openai' NOT NULL;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_openai_model" varchar DEFAULT 'gpt-4.1' NOT NULL;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_openai_api_key" varchar;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_openai_input_per_million_usd" numeric DEFAULT 2 NOT NULL;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_openai_output_per_million_usd" numeric DEFAULT 8 NOT NULL;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_deepseek_model" varchar DEFAULT 'deepseek-chat' NOT NULL;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_deepseek_api_key" varchar;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_deepseek_input_per_million_usd" numeric DEFAULT 0.27 NOT NULL;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_deepseek_output_per_million_usd" numeric DEFAULT 1.1 NOT NULL;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_anthropic_model" varchar DEFAULT 'claude-sonnet-4-5' NOT NULL;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_anthropic_api_key" varchar;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_anthropic_input_per_million_usd" numeric DEFAULT 3 NOT NULL;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_anthropic_output_per_million_usd" numeric DEFAULT 15 NOT NULL;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_google_model" varchar DEFAULT 'gemini-2.5-pro' NOT NULL;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_google_api_key" varchar;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_google_input_per_million_usd" numeric DEFAULT 1.25 NOT NULL;
  ALTER TABLE "ai_settings" ADD COLUMN "providers_google_output_per_million_usd" numeric DEFAULT 10 NOT NULL;`);

  // The keys back by kind (the newest connection of a kind wins), the active vendor from
  // the engine's connection.
  for (const vendor of VENDORS) {
    // oxlint-disable-next-line no-await-in-loop
    await db.execute(sql`
      UPDATE "ai_settings" s
      SET
        ${sql.raw(`"providers_${vendor}_model"`)} = COALESCE(c."model", ${sql.raw(`s."providers_${vendor}_model"`)}),
        ${sql.raw(`"providers_${vendor}_api_key"`)} = c."api_key",
        ${sql.raw(`"providers_${vendor}_input_per_million_usd"`)} = COALESCE(c."input_per_million_usd", ${sql.raw(`s."providers_${vendor}_input_per_million_usd"`)}),
        ${sql.raw(`"providers_${vendor}_output_per_million_usd"`)} = COALESCE(c."output_per_million_usd", ${sql.raw(`s."providers_${vendor}_output_per_million_usd"`)})
      FROM (
        SELECT * FROM "connections" WHERE "kind" = ${vendor}::"enum_connections_kind" ORDER BY "id" DESC LIMIT 1
      ) c;`);
  }
  await db.execute(sql`
    UPDATE "ai_settings" s
    SET "active_provider" = c."kind"::text::"enum_ai_settings_active_provider"
    FROM "connections" c
    WHERE c."id" = s."connection_id" AND c."kind"::text IN ('openai', 'deepseek', 'anthropic', 'google', 'mock');`);

  await db.execute(sql`
   ALTER TABLE "ai_runs" DROP CONSTRAINT "ai_runs_connection_id_connections_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_connections_fk";
  ALTER TABLE "ai_settings" DROP CONSTRAINT "ai_settings_connection_id_connections_id_fk";
  DROP INDEX "ai_runs_connection_idx";
  DROP INDEX "payload_locked_documents_rels_connections_id_idx";
  DROP INDEX "ai_settings_connection_idx";
  ALTER TABLE "ai_runs" DROP COLUMN "connection_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "connections_id";
  ALTER TABLE "ai_settings" DROP COLUMN "connection_id";
  DROP TABLE "connections" CASCADE;
  DROP TYPE "public"."enum_connections_kind";`);
}
