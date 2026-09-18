import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * A post's takeaways become one list of shared rows with the text per language (ADR-057,
 * PR A): a localized-as-a-whole array has one row set per language and no way to pair them,
 * so the bilingual row (one edit for both languages) needs the row shared. The Arabic rows
 * keep their ids; each English row is paired with the Arabic row of the same post and the
 * same `_order`, which is how `scripts/migrate-content-en.ts` created them; its text moves
 * to the locale table under the Arabic row's id and the English row goes. An English row
 * with no Arabic partner (an engine post written in English) stays a row of its own with
 * its English text. The versions table is covered the same way (its rows are paired inside
 * each version). Two English rows at one `_order` of one post would collide on the locale
 * table's unique index and roll the migration back: the right failure, nothing dropped
 * silently. The column defaults that drifted since the last migration ride along.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "posts_takeaways_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "_posts_v_version_takeaways_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  ALTER TABLE "posts_takeaways_locales" ADD CONSTRAINT "posts_takeaways_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts_takeaways"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_takeaways_locales" ADD CONSTRAINT "_posts_v_version_takeaways_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v_version_takeaways"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "posts_takeaways_locales_locale_parent_id_unique" ON "posts_takeaways_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_posts_v_version_takeaways_locales_locale_parent_id_unique" ON "_posts_v_version_takeaways_locales" USING btree ("_locale","_parent_id");

  INSERT INTO "posts_takeaways_locales" ("_locale", "_parent_id", "text")
    SELECT ar."_locale", ar."id", ar."text"
    FROM "posts_takeaways" ar
    WHERE ar."_locale" = 'ar';
  INSERT INTO "posts_takeaways_locales" ("_locale", "_parent_id", "text")
    SELECT en."_locale", ar."id", en."text"
    FROM "posts_takeaways" en
    JOIN "posts_takeaways" ar
      ON ar."_parent_id" = en."_parent_id" AND ar."_order" = en."_order" AND ar."_locale" = 'ar'
    WHERE en."_locale" = 'en';
  INSERT INTO "posts_takeaways_locales" ("_locale", "_parent_id", "text")
    SELECT en."_locale", en."id", en."text"
    FROM "posts_takeaways" en
    WHERE en."_locale" = 'en' AND NOT EXISTS (
      SELECT 1 FROM "posts_takeaways" ar
      WHERE ar."_parent_id" = en."_parent_id" AND ar."_order" = en."_order" AND ar."_locale" = 'ar'
    );
  DELETE FROM "posts_takeaways" en
    WHERE en."_locale" = 'en' AND EXISTS (
      SELECT 1 FROM "posts_takeaways" ar
      WHERE ar."_parent_id" = en."_parent_id" AND ar."_order" = en."_order" AND ar."_locale" = 'ar'
    );

  INSERT INTO "_posts_v_version_takeaways_locales" ("_locale", "_parent_id", "text")
    SELECT ar."_locale", ar."id", ar."text"
    FROM "_posts_v_version_takeaways" ar
    WHERE ar."_locale" = 'ar';
  INSERT INTO "_posts_v_version_takeaways_locales" ("_locale", "_parent_id", "text")
    SELECT en."_locale", ar."id", en."text"
    FROM "_posts_v_version_takeaways" en
    JOIN "_posts_v_version_takeaways" ar
      ON ar."_parent_id" = en."_parent_id" AND ar."_order" = en."_order" AND ar."_locale" = 'ar'
    WHERE en."_locale" = 'en';
  INSERT INTO "_posts_v_version_takeaways_locales" ("_locale", "_parent_id", "text")
    SELECT en."_locale", en."id", en."text"
    FROM "_posts_v_version_takeaways" en
    WHERE en."_locale" = 'en' AND NOT EXISTS (
      SELECT 1 FROM "_posts_v_version_takeaways" ar
      WHERE ar."_parent_id" = en."_parent_id" AND ar."_order" = en."_order" AND ar."_locale" = 'ar'
    );
  DELETE FROM "_posts_v_version_takeaways" en
    WHERE en."_locale" = 'en' AND EXISTS (
      SELECT 1 FROM "_posts_v_version_takeaways" ar
      WHERE ar."_parent_id" = en."_parent_id" AND ar."_order" = en."_order" AND ar."_locale" = 'ar'
    );

  DROP INDEX "posts_takeaways_locale_idx";
  DROP INDEX "_posts_v_version_takeaways_locale_idx";
  ALTER TABLE "posts_takeaways" DROP COLUMN "_locale";
  ALTER TABLE "posts_takeaways" DROP COLUMN "text";
  ALTER TABLE "_posts_v_version_takeaways" DROP COLUMN "_locale";
  ALTER TABLE "_posts_v_version_takeaways" DROP COLUMN "text";
  ALTER TABLE "products_locales" ALTER COLUMN "print_area_label" DROP DEFAULT;
  ALTER TABLE "products_locales" ALTER COLUMN "print_method_label" DROP DEFAULT;
  ALTER TABLE "_products_v_locales" ALTER COLUMN "version_print_area_label" DROP DEFAULT;
  ALTER TABLE "_products_v_locales" ALTER COLUMN "version_print_method_label" DROP DEFAULT;
  ALTER TABLE "prompts" ALTER COLUMN "every_days" SET DEFAULT 7;`);
}

/**
 * Back to one row set per language: each shared row becomes the Arabic row (its id kept)
 * and its English text a row of its own at the same `_order`; a row with English only stays
 * an English row.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts_takeaways" ADD COLUMN "_locale" "_locales";
  ALTER TABLE "posts_takeaways" ADD COLUMN "text" varchar;
  UPDATE "posts_takeaways" r SET "_locale" = 'ar', "text" = l."text"
    FROM "posts_takeaways_locales" l
    WHERE l."_parent_id" = r."id" AND l."_locale" = 'ar';
  INSERT INTO "posts_takeaways" ("_order", "_parent_id", "id", "_locale", "text")
    SELECT r."_order", r."_parent_id", substr(md5(r."id" || ':en'), 1, 24), 'en', l."text"
    FROM "posts_takeaways" r
    JOIN "posts_takeaways_locales" l ON l."_parent_id" = r."id" AND l."_locale" = 'en'
    WHERE r."_locale" = 'ar';
  UPDATE "posts_takeaways" r SET "_locale" = 'en', "text" = l."text"
    FROM "posts_takeaways_locales" l
    WHERE l."_parent_id" = r."id" AND l."_locale" = 'en' AND r."_locale" IS NULL;
  UPDATE "posts_takeaways" SET "_locale" = 'ar' WHERE "_locale" IS NULL;
  ALTER TABLE "posts_takeaways" ALTER COLUMN "_locale" SET NOT NULL;

  ALTER TABLE "_posts_v_version_takeaways" ADD COLUMN "_locale" "_locales";
  ALTER TABLE "_posts_v_version_takeaways" ADD COLUMN "text" varchar;
  UPDATE "_posts_v_version_takeaways" r SET "_locale" = 'ar', "text" = l."text"
    FROM "_posts_v_version_takeaways_locales" l
    WHERE l."_parent_id" = r."id" AND l."_locale" = 'ar';
  INSERT INTO "_posts_v_version_takeaways" ("_order", "_parent_id", "_uuid", "_locale", "text")
    SELECT r."_order", r."_parent_id", substr(md5(r."id"::text || ':en'), 1, 24), 'en', l."text"
    FROM "_posts_v_version_takeaways" r
    JOIN "_posts_v_version_takeaways_locales" l ON l."_parent_id" = r."id" AND l."_locale" = 'en'
    WHERE r."_locale" = 'ar';
  UPDATE "_posts_v_version_takeaways" r SET "_locale" = 'en', "text" = l."text"
    FROM "_posts_v_version_takeaways_locales" l
    WHERE l."_parent_id" = r."id" AND l."_locale" = 'en' AND r."_locale" IS NULL;
  UPDATE "_posts_v_version_takeaways" SET "_locale" = 'ar' WHERE "_locale" IS NULL;
  ALTER TABLE "_posts_v_version_takeaways" ALTER COLUMN "_locale" SET NOT NULL;

  ALTER TABLE "posts_takeaways_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_version_takeaways_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "posts_takeaways_locales" CASCADE;
  DROP TABLE "_posts_v_version_takeaways_locales" CASCADE;
  CREATE INDEX "posts_takeaways_locale_idx" ON "posts_takeaways" USING btree ("_locale");
  CREATE INDEX "_posts_v_version_takeaways_locale_idx" ON "_posts_v_version_takeaways" USING btree ("_locale");
  ALTER TABLE "products_locales" ALTER COLUMN "print_area_label" SET DEFAULT 'الواجهة الأمامية، 28 × 38 سم';
  ALTER TABLE "products_locales" ALTER COLUMN "print_method_label" SET DEFAULT 'طباعة رقمية عالية الجودة';
  ALTER TABLE "_products_v_locales" ALTER COLUMN "version_print_area_label" SET DEFAULT 'الواجهة الأمامية، 28 × 38 سم';
  ALTER TABLE "_products_v_locales" ALTER COLUMN "version_print_method_label" SET DEFAULT 'طباعة رقمية عالية الجودة';
  ALTER TABLE "prompts" ALTER COLUMN "every_days" SET DEFAULT 1;`);
}
