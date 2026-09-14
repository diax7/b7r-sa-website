import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Localises `posts.readingMinutes` and `posts.warnings` (ADR-043, 5b): both are computed from
// the body in the language being saved, so each language keeps its own. The values written
// before are Arabic and move into the 'ar' rows; the old columns are dropped in place.
// Pre-launch only: nothing is deployed, so the additive rule (ADR-025, RUNBOOK) has no running
// image to protect. After launch a moved field is a two-release contract.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts_warnings" ADD COLUMN "_locale" "_locales";
  UPDATE "posts_warnings" SET "_locale" = 'ar';
  ALTER TABLE "posts_warnings" ALTER COLUMN "_locale" SET NOT NULL;
  ALTER TABLE "_posts_v_version_warnings" ADD COLUMN "_locale" "_locales";
  UPDATE "_posts_v_version_warnings" SET "_locale" = 'ar';
  ALTER TABLE "_posts_v_version_warnings" ALTER COLUMN "_locale" SET NOT NULL;
  ALTER TABLE "posts_locales" ADD COLUMN "reading_minutes" numeric;
  UPDATE "posts_locales" pl SET "reading_minutes" = p."reading_minutes"
    FROM "posts" p WHERE pl."_parent_id" = p."id" AND pl."_locale" = 'ar';
  ALTER TABLE "_posts_v_locales" ADD COLUMN "version_reading_minutes" numeric;
  UPDATE "_posts_v_locales" vl SET "version_reading_minutes" = v."version_reading_minutes"
    FROM "_posts_v" v WHERE vl."_parent_id" = v."id" AND vl."_locale" = 'ar';
  CREATE INDEX "posts_warnings_locale_idx" ON "posts_warnings" USING btree ("_locale");
  CREATE INDEX "_posts_v_version_warnings_locale_idx" ON "_posts_v_version_warnings" USING btree ("_locale");
  ALTER TABLE "posts" DROP COLUMN "reading_minutes";
  ALTER TABLE "_posts_v" DROP COLUMN "version_reading_minutes";`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "posts_warnings_locale_idx";
  DROP INDEX "_posts_v_version_warnings_locale_idx";
  ALTER TABLE "posts" ADD COLUMN "reading_minutes" numeric;
  ALTER TABLE "_posts_v" ADD COLUMN "version_reading_minutes" numeric;
  UPDATE "posts" p SET "reading_minutes" = pl."reading_minutes"
    FROM "posts_locales" pl WHERE pl."_parent_id" = p."id" AND pl."_locale" = 'ar';
  UPDATE "_posts_v" v SET "version_reading_minutes" = vl."version_reading_minutes"
    FROM "_posts_v_locales" vl WHERE vl."_parent_id" = v."id" AND vl."_locale" = 'ar';
  DELETE FROM "posts_warnings" WHERE "_locale" <> 'ar';
  DELETE FROM "_posts_v_version_warnings" WHERE "_locale" <> 'ar';
  ALTER TABLE "posts_warnings" DROP COLUMN "_locale";
  ALTER TABLE "posts_locales" DROP COLUMN "reading_minutes";
  ALTER TABLE "_posts_v_version_warnings" DROP COLUMN "_locale";
  ALTER TABLE "_posts_v_locales" DROP COLUMN "version_reading_minutes";`);
}
