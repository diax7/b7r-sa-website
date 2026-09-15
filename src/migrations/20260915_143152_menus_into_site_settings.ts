import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * The Navigation global's fields move into the site settings as the `menu` group (ADR-046):
 * the new tables and columns first, then every row copied with its parent remapped to the
 * site-settings row, then the old tables dropped. Row ids are looked up, never assumed; the
 * array rows keep their ids, so their locale rows need no remap. The localized labels are
 * NOT NULL, so a locale row that exists in `site_settings_locales` but not in
 * `navigation_locales` gets an empty string, which `pnpm content:migrate --force` refills
 * (the English seed's "settings without menus" branch). Two states this never sees after a
 * seed, and what they do: an empty database copies nothing (the cross join with the empty
 * site-settings subselect yields no rows); navigation rows without a site-settings row fail
 * on the locale table's foreign key and roll the migration back, which is the right
 * failure, no data is lost silently.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_menu_primary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL,
  	"match_prefix" varchar
  );

  CREATE TABLE "site_settings_menu_primary_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "site_settings_menu_policies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL,
  	"match_prefix" varchar
  );

  CREATE TABLE "site_settings_menu_policies_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  ALTER TABLE "site_settings_locales" ADD COLUMN "menu_cta_label" varchar NOT NULL DEFAULT '';
  ALTER TABLE "site_settings_locales" ADD COLUMN "menu_skip_link_label" varchar NOT NULL DEFAULT '';
  ALTER TABLE "site_settings_locales" ADD COLUMN "menu_menu_open_label" varchar NOT NULL DEFAULT '';
  ALTER TABLE "site_settings_locales" ADD COLUMN "menu_menu_close_label" varchar NOT NULL DEFAULT '';
  ALTER TABLE "site_settings_menu_primary" ADD CONSTRAINT "site_settings_menu_primary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_menu_primary_locales" ADD CONSTRAINT "site_settings_menu_primary_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_menu_primary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_menu_policies" ADD CONSTRAINT "site_settings_menu_policies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_menu_policies_locales" ADD CONSTRAINT "site_settings_menu_policies_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_menu_policies"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_menu_primary_order_idx" ON "site_settings_menu_primary" USING btree ("_order");
  CREATE INDEX "site_settings_menu_primary_parent_id_idx" ON "site_settings_menu_primary" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_menu_primary_locales_locale_parent_id_unique" ON "site_settings_menu_primary_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_menu_policies_order_idx" ON "site_settings_menu_policies" USING btree ("_order");
  CREATE INDEX "site_settings_menu_policies_parent_id_idx" ON "site_settings_menu_policies" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_menu_policies_locales_locale_parent_id_unique" ON "site_settings_menu_policies_locales" USING btree ("_locale","_parent_id");

  -- The data: the site-settings row is the new parent (a global has one row; both may be
  -- absent on an empty database, in which case nothing is copied).
  INSERT INTO "site_settings_menu_primary" ("_order", "_parent_id", "id", "href", "match_prefix")
  SELECT p."_order", s."id", p."id", p."href", p."match_prefix"
  FROM "navigation_primary" p, (SELECT "id" FROM "site_settings" ORDER BY "id" LIMIT 1) s;
  INSERT INTO "site_settings_menu_primary_locales" ("label", "_locale", "_parent_id")
  SELECT "label", "_locale", "_parent_id" FROM "navigation_primary_locales";
  INSERT INTO "site_settings_menu_policies" ("_order", "_parent_id", "id", "href", "match_prefix")
  SELECT p."_order", s."id", p."id", p."href", p."match_prefix"
  FROM "navigation_policies" p, (SELECT "id" FROM "site_settings" ORDER BY "id" LIMIT 1) s;
  INSERT INTO "site_settings_menu_policies_locales" ("label", "_locale", "_parent_id")
  SELECT "label", "_locale", "_parent_id" FROM "navigation_policies_locales";
  UPDATE "site_settings_locales" sl
  SET "menu_cta_label" = nl."cta_label",
      "menu_skip_link_label" = nl."skip_link_label",
      "menu_menu_open_label" = nl."menu_open_label",
      "menu_menu_close_label" = nl."menu_close_label"
  FROM "navigation_locales" nl
  WHERE nl."_locale" = sl."_locale";

  ALTER TABLE "site_settings_locales" ALTER COLUMN "menu_cta_label" DROP DEFAULT;
  ALTER TABLE "site_settings_locales" ALTER COLUMN "menu_skip_link_label" DROP DEFAULT;
  ALTER TABLE "site_settings_locales" ALTER COLUMN "menu_menu_open_label" DROP DEFAULT;
  ALTER TABLE "site_settings_locales" ALTER COLUMN "menu_menu_close_label" DROP DEFAULT;

  DROP TABLE "navigation_primary" CASCADE;
  DROP TABLE "navigation_primary_locales" CASCADE;
  DROP TABLE "navigation_policies" CASCADE;
  DROP TABLE "navigation_policies_locales" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "navigation_locales" CASCADE;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "navigation_primary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL,
  	"match_prefix" varchar
  );

  CREATE TABLE "navigation_primary_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "navigation_policies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL,
  	"match_prefix" varchar
  );

  CREATE TABLE "navigation_policies_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"last_saved_by_name" varchar,
  	"last_saved_by_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  CREATE TABLE "navigation_locales" (
  	"cta_label" varchar NOT NULL,
  	"skip_link_label" varchar NOT NULL,
  	"menu_open_label" varchar NOT NULL,
  	"menu_close_label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  ALTER TABLE "navigation_primary" ADD CONSTRAINT "navigation_primary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_primary_locales" ADD CONSTRAINT "navigation_primary_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_primary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_policies" ADD CONSTRAINT "navigation_policies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_policies_locales" ADD CONSTRAINT "navigation_policies_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_policies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_locales" ADD CONSTRAINT "navigation_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "navigation_primary_order_idx" ON "navigation_primary" USING btree ("_order");
  CREATE INDEX "navigation_primary_parent_id_idx" ON "navigation_primary" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_primary_locales_locale_parent_id_unique" ON "navigation_primary_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_policies_order_idx" ON "navigation_policies" USING btree ("_order");
  CREATE INDEX "navigation_policies_parent_id_idx" ON "navigation_policies" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_policies_locales_locale_parent_id_unique" ON "navigation_policies_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "navigation_locales_locale_parent_id_unique" ON "navigation_locales" USING btree ("_locale","_parent_id");

  -- The data back: one navigation row, then the menus and the labels under it.
  INSERT INTO "navigation" ("updated_at", "created_at")
  SELECT now(), now() WHERE EXISTS (SELECT 1 FROM "site_settings");
  INSERT INTO "navigation_primary" ("_order", "_parent_id", "id", "href", "match_prefix")
  SELECT p."_order", n."id", p."id", p."href", p."match_prefix"
  FROM "site_settings_menu_primary" p, (SELECT "id" FROM "navigation" ORDER BY "id" LIMIT 1) n;
  INSERT INTO "navigation_primary_locales" ("label", "_locale", "_parent_id")
  SELECT "label", "_locale", "_parent_id" FROM "site_settings_menu_primary_locales";
  INSERT INTO "navigation_policies" ("_order", "_parent_id", "id", "href", "match_prefix")
  SELECT p."_order", n."id", p."id", p."href", p."match_prefix"
  FROM "site_settings_menu_policies" p, (SELECT "id" FROM "navigation" ORDER BY "id" LIMIT 1) n;
  INSERT INTO "navigation_policies_locales" ("label", "_locale", "_parent_id")
  SELECT "label", "_locale", "_parent_id" FROM "site_settings_menu_policies_locales";
  INSERT INTO "navigation_locales" ("cta_label", "skip_link_label", "menu_open_label", "menu_close_label", "_locale", "_parent_id")
  SELECT sl."menu_cta_label", sl."menu_skip_link_label", sl."menu_menu_open_label", sl."menu_menu_close_label", sl."_locale", n."id"
  FROM "site_settings_locales" sl, (SELECT "id" FROM "navigation" ORDER BY "id" LIMIT 1) n;

  DROP TABLE "site_settings_menu_primary" CASCADE;
  DROP TABLE "site_settings_menu_primary_locales" CASCADE;
  DROP TABLE "site_settings_menu_policies" CASCADE;
  DROP TABLE "site_settings_menu_policies_locales" CASCADE;
  ALTER TABLE "site_settings_locales" DROP COLUMN "menu_cta_label";
  ALTER TABLE "site_settings_locales" DROP COLUMN "menu_skip_link_label";
  ALTER TABLE "site_settings_locales" DROP COLUMN "menu_menu_open_label";
  ALTER TABLE "site_settings_locales" DROP COLUMN "menu_menu_close_label";`);
}
