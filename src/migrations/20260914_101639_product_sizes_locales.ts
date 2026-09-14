import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Localises `products.sizes.label` and `products.sizesSummary` (ADR-043): the new locale
// tables and columns, the Arabic values carried into them, then the old columns dropped in
// place. Pre-launch only: nothing is deployed, so the additive rule (ADR-025, RUNBOOK) has
// no running image to protect. After launch a moved field is a two-release contract: add
// and copy first, drop the old column in the next release.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "products_sizes_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_products_v_version_sizes_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "products_locales" ADD COLUMN "sizes_summary" varchar;
  ALTER TABLE "_products_v_locales" ADD COLUMN "version_sizes_summary" varchar;
  ALTER TABLE "products_sizes_locales" ADD CONSTRAINT "products_sizes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_sizes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_sizes_locales" ADD CONSTRAINT "_products_v_version_sizes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_version_sizes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "products_sizes_locales_locale_parent_id_unique" ON "products_sizes_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_products_v_version_sizes_locales_locale_parent_id_unique" ON "_products_v_version_sizes_locales" USING btree ("_locale","_parent_id");
  -- The values written before the fields were localised are Arabic (ADR-043): carry them
  -- into the 'ar' rows before the old columns go, in the live tables and the versions.
  INSERT INTO "products_sizes_locales" ("label", "_locale", "_parent_id")
    SELECT "label", 'ar', "id" FROM "products_sizes" WHERE "label" IS NOT NULL;
  INSERT INTO "_products_v_version_sizes_locales" ("label", "_locale", "_parent_id")
    SELECT "label", 'ar', "id" FROM "_products_v_version_sizes" WHERE "label" IS NOT NULL;
  UPDATE "products_locales" pl SET "sizes_summary" = p."sizes_summary"
    FROM "products" p WHERE pl."_parent_id" = p."id" AND pl."_locale" = 'ar';
  UPDATE "_products_v_locales" vl SET "version_sizes_summary" = v."version_sizes_summary"
    FROM "_products_v" v WHERE vl."_parent_id" = v."id" AND vl."_locale" = 'ar';
  ALTER TABLE "products_sizes" DROP COLUMN "label";
  ALTER TABLE "products" DROP COLUMN "sizes_summary";
  ALTER TABLE "_products_v_version_sizes" DROP COLUMN "label";
  ALTER TABLE "_products_v" DROP COLUMN "version_sizes_summary";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_sizes" ADD COLUMN "label" varchar;
  ALTER TABLE "products" ADD COLUMN "sizes_summary" varchar;
  ALTER TABLE "_products_v_version_sizes" ADD COLUMN "label" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_sizes_summary" varchar;
  UPDATE "products_sizes" s SET "label" = l."label"
    FROM "products_sizes_locales" l WHERE l."_parent_id" = s."id" AND l."_locale" = 'ar';
  UPDATE "products" p SET "sizes_summary" = pl."sizes_summary"
    FROM "products_locales" pl WHERE pl."_parent_id" = p."id" AND pl."_locale" = 'ar';
  UPDATE "_products_v_version_sizes" s SET "label" = l."label"
    FROM "_products_v_version_sizes_locales" l WHERE l."_parent_id" = s."id" AND l."_locale" = 'ar';
  UPDATE "_products_v" v SET "version_sizes_summary" = vl."version_sizes_summary"
    FROM "_products_v_locales" vl WHERE vl."_parent_id" = v."id" AND vl."_locale" = 'ar';
  DROP TABLE "products_sizes_locales" CASCADE;
  DROP TABLE "_products_v_version_sizes_locales" CASCADE;
  ALTER TABLE "products_locales" DROP COLUMN "sizes_summary";
  ALTER TABLE "_products_v_locales" DROP COLUMN "version_sizes_summary";`)
}
