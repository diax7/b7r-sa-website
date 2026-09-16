import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/** The comparison block on pages (ADR-050): its rows and its two lists, live and versioned. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_compare_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_compare_rows_locales" (
  	"criterion" varchar,
  	"ours" varchar,
  	"theirs" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_compare_best_for" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_compare_best_for_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_compare_not_best_for" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_compare_not_best_for_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_compare" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"as_of" timestamp(3) with time zone,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_compare_locales" (
  	"title" varchar,
  	"intro" varchar,
  	"ours" varchar,
  	"theirs" varchar,
  	"closing" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_compare_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_compare_rows_locales" (
  	"criterion" varchar,
  	"ours" varchar,
  	"theirs" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_compare_best_for" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_compare_best_for_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_compare_not_best_for" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_compare_not_best_for_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_compare" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"as_of" timestamp(3) with time zone,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_compare_locales" (
  	"title" varchar,
  	"intro" varchar,
  	"ours" varchar,
  	"theirs" varchar,
  	"closing" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_blocks_compare_rows" ADD CONSTRAINT "pages_blocks_compare_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_compare_rows_locales" ADD CONSTRAINT "pages_blocks_compare_rows_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_compare_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_compare_best_for" ADD CONSTRAINT "pages_blocks_compare_best_for_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_compare_best_for_locales" ADD CONSTRAINT "pages_blocks_compare_best_for_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_compare_best_for"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_compare_not_best_for" ADD CONSTRAINT "pages_blocks_compare_not_best_for_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_compare_not_best_for_locales" ADD CONSTRAINT "pages_blocks_compare_not_best_for_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_compare_not_best_for"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_compare" ADD CONSTRAINT "pages_blocks_compare_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_compare_locales" ADD CONSTRAINT "pages_blocks_compare_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_compare_rows" ADD CONSTRAINT "_pages_v_blocks_compare_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_compare_rows_locales" ADD CONSTRAINT "_pages_v_blocks_compare_rows_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_compare_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_compare_best_for" ADD CONSTRAINT "_pages_v_blocks_compare_best_for_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_compare_best_for_locales" ADD CONSTRAINT "_pages_v_blocks_compare_best_for_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_compare_best_for"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_compare_not_best_for" ADD CONSTRAINT "_pages_v_blocks_compare_not_best_for_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_compare"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_compare_not_best_for_locales" ADD CONSTRAINT "_pages_v_blocks_compare_not_best_for_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_compare_not_best_for"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_compare" ADD CONSTRAINT "_pages_v_blocks_compare_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_compare_locales" ADD CONSTRAINT "_pages_v_blocks_compare_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_compare"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_compare_rows_order_idx" ON "pages_blocks_compare_rows" USING btree ("_order");
  CREATE INDEX "pages_blocks_compare_rows_parent_id_idx" ON "pages_blocks_compare_rows" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_compare_rows_locales_locale_parent_id_unique" ON "pages_blocks_compare_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_compare_best_for_order_idx" ON "pages_blocks_compare_best_for" USING btree ("_order");
  CREATE INDEX "pages_blocks_compare_best_for_parent_id_idx" ON "pages_blocks_compare_best_for" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_compare_best_for_locales_locale_parent_id_uniqu" ON "pages_blocks_compare_best_for_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_compare_not_best_for_order_idx" ON "pages_blocks_compare_not_best_for" USING btree ("_order");
  CREATE INDEX "pages_blocks_compare_not_best_for_parent_id_idx" ON "pages_blocks_compare_not_best_for" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_compare_not_best_for_locales_locale_parent_id_u" ON "pages_blocks_compare_not_best_for_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_compare_order_idx" ON "pages_blocks_compare" USING btree ("_order");
  CREATE INDEX "pages_blocks_compare_parent_id_idx" ON "pages_blocks_compare" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_compare_path_idx" ON "pages_blocks_compare" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_compare_locales_locale_parent_id_unique" ON "pages_blocks_compare_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_compare_rows_order_idx" ON "_pages_v_blocks_compare_rows" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_compare_rows_parent_id_idx" ON "_pages_v_blocks_compare_rows" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_compare_rows_locales_locale_parent_id_unique" ON "_pages_v_blocks_compare_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_compare_best_for_order_idx" ON "_pages_v_blocks_compare_best_for" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_compare_best_for_parent_id_idx" ON "_pages_v_blocks_compare_best_for" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_compare_best_for_locales_locale_parent_id_un" ON "_pages_v_blocks_compare_best_for_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_compare_not_best_for_order_idx" ON "_pages_v_blocks_compare_not_best_for" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_compare_not_best_for_parent_id_idx" ON "_pages_v_blocks_compare_not_best_for" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_compare_not_best_for_locales_locale_parent_i" ON "_pages_v_blocks_compare_not_best_for_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_compare_order_idx" ON "_pages_v_blocks_compare" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_compare_parent_id_idx" ON "_pages_v_blocks_compare" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_compare_path_idx" ON "_pages_v_blocks_compare" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_compare_locales_locale_parent_id_unique" ON "_pages_v_blocks_compare_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_compare_rows" CASCADE;
  DROP TABLE "pages_blocks_compare_rows_locales" CASCADE;
  DROP TABLE "pages_blocks_compare_best_for" CASCADE;
  DROP TABLE "pages_blocks_compare_best_for_locales" CASCADE;
  DROP TABLE "pages_blocks_compare_not_best_for" CASCADE;
  DROP TABLE "pages_blocks_compare_not_best_for_locales" CASCADE;
  DROP TABLE "pages_blocks_compare" CASCADE;
  DROP TABLE "pages_blocks_compare_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_compare_rows" CASCADE;
  DROP TABLE "_pages_v_blocks_compare_rows_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_compare_best_for" CASCADE;
  DROP TABLE "_pages_v_blocks_compare_best_for_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_compare_not_best_for" CASCADE;
  DROP TABLE "_pages_v_blocks_compare_not_best_for_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_compare" CASCADE;
  DROP TABLE "_pages_v_blocks_compare_locales" CASCADE;`)
}
