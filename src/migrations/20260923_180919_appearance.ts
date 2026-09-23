import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_appearance_typeface" AS ENUM('rayat', 'baloo', 'plex', 'tajawal');
  CREATE TABLE "appearance" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sources_primary" varchar DEFAULT '#0058b0' NOT NULL,
  	"sources_primary_dark" varchar DEFAULT '#1858a8' NOT NULL,
  	"sources_accent" varchar DEFAULT '#0098e0' NOT NULL,
  	"sources_navy" varchar DEFAULT '#0a2f5e' NOT NULL,
  	"sources_ink" varchar DEFAULT '#14181f' NOT NULL,
  	"pins" jsonb DEFAULT '{"border":{"value":"#e5e9ef","origin":"factory"},"textMuted":{"value":"#5b6470","origin":"factory"},"accentOnTint":{"value":"#00639c","origin":"factory"}}'::jsonb,
  	"typeface" "enum_appearance_typeface" DEFAULT 'rayat' NOT NULL,
  	"logo_primary_id" integer,
  	"logo_on_dark_id" integer,
  	"last_saved_by_name" varchar,
  	"last_saved_by_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "appearance" ADD CONSTRAINT "appearance_logo_primary_id_media_id_fk" FOREIGN KEY ("logo_primary_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appearance" ADD CONSTRAINT "appearance_logo_on_dark_id_media_id_fk" FOREIGN KEY ("logo_on_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "appearance_logo_primary_idx" ON "appearance" USING btree ("logo_primary_id");
  CREATE INDEX "appearance_logo_on_dark_idx" ON "appearance" USING btree ("logo_on_dark_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "appearance" CASCADE;
  DROP TYPE "public"."enum_appearance_typeface";`)
}
