import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_appearance_surfaces_kind" AS ENUM('solid', 'gradient');
  CREATE TYPE "public"."enum_appearance_surfaces_button" AS ENUM('primary', 'inverse');
  CREATE TABLE "appearance_surfaces_blooms" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"colour" varchar,
  	"x" numeric,
  	"y" numeric,
  	"width" numeric,
  	"height" numeric
  );
  
  CREATE TABLE "appearance_surfaces" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"kind" "enum_appearance_surfaces_kind" DEFAULT 'solid' NOT NULL,
  	"background" varchar NOT NULL,
  	"button" "enum_appearance_surfaces_button" DEFAULT 'primary' NOT NULL,
  	"text" varchar NOT NULL,
  	"text_muted" varchar NOT NULL,
  	"link" varchar NOT NULL,
  	"grain" numeric DEFAULT 0
  );
  
  CREATE TABLE "appearance_surfaces_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "appearance" ADD COLUMN "translations" jsonb;
  ALTER TABLE "appearance_surfaces_blooms" ADD CONSTRAINT "appearance_surfaces_blooms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."appearance_surfaces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "appearance_surfaces" ADD CONSTRAINT "appearance_surfaces_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."appearance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "appearance_surfaces_locales" ADD CONSTRAINT "appearance_surfaces_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."appearance_surfaces"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "appearance_surfaces_blooms_order_idx" ON "appearance_surfaces_blooms" USING btree ("_order");
  CREATE INDEX "appearance_surfaces_blooms_parent_id_idx" ON "appearance_surfaces_blooms" USING btree ("_parent_id");
  CREATE INDEX "appearance_surfaces_order_idx" ON "appearance_surfaces" USING btree ("_order");
  CREATE INDEX "appearance_surfaces_parent_id_idx" ON "appearance_surfaces" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "appearance_surfaces_locales_locale_parent_id_unique" ON "appearance_surfaces_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "appearance_surfaces_blooms" CASCADE;
  DROP TABLE "appearance_surfaces" CASCADE;
  DROP TABLE "appearance_surfaces_locales" CASCADE;
  ALTER TABLE "appearance" DROP COLUMN "translations";
  DROP TYPE "public"."enum_appearance_surfaces_kind";
  DROP TYPE "public"."enum_appearance_surfaces_button";`)
}
