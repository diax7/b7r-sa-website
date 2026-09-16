import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * The traffic count (ADR-048): one row per day, kind, source and page; the unique index is
 * what the batcher's `ON CONFLICT` upsert targets.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_traffic_kind" AS ENUM('landing', 'crawl');
  CREATE TABLE "traffic" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" varchar NOT NULL,
  	"kind" "enum_traffic_kind" NOT NULL,
  	"hits" numeric NOT NULL,
  	"source" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "traffic_id" integer;
  CREATE INDEX "traffic_updated_at_idx" ON "traffic" USING btree ("updated_at");
  CREATE INDEX "traffic_created_at_idx" ON "traffic" USING btree ("created_at");
  CREATE UNIQUE INDEX "date_kind_source_path_idx" ON "traffic" USING btree ("date","kind","source","path");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_traffic_fk" FOREIGN KEY ("traffic_id") REFERENCES "public"."traffic"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_traffic_id_idx" ON "payload_locked_documents_rels" USING btree ("traffic_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_traffic_fk";
  DROP INDEX "payload_locked_documents_rels_traffic_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "traffic_id";
  DROP TABLE "traffic" CASCADE;
  DROP TYPE "public"."enum_traffic_kind";`)
}
