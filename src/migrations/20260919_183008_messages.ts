import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_messages_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_messages_status" AS ENUM('new', 'following', 'handled');
  CREATE TABLE "messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar,
  	"email" varchar NOT NULL,
  	"inquiry" varchar NOT NULL,
  	"locale" "enum_messages_locale" DEFAULT 'ar' NOT NULL,
  	"message" varchar NOT NULL,
  	"notes" varchar,
  	"status" "enum_messages_status" DEFAULT 'new' NOT NULL,
  	"emailed" boolean DEFAULT false,
  	"page" varchar,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "messages_id" integer;
  CREATE INDEX "messages_status_idx" ON "messages" USING btree ("status");
  CREATE INDEX "messages_updated_at_idx" ON "messages" USING btree ("updated_at");
  CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_messages_fk" FOREIGN KEY ("messages_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("messages_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "messages" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "messages" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_messages_fk";
  
  DROP INDEX "payload_locked_documents_rels_messages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "messages_id";
  DROP TYPE "public"."enum_messages_locale";
  DROP TYPE "public"."enum_messages_status";`)
}
