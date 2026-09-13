import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Drops `designer.sample` in place. Pre-launch only: nothing is deployed, so the additive
// rule (ADR-025, RUNBOOK) has no running image to protect. After launch a removed field is a
// two-release contract — stop writing it first, drop the column in the next release.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_locales" DROP COLUMN "designer_sample";
  ALTER TABLE "_home_v_locales" DROP COLUMN "version_designer_sample";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_locales" ADD COLUMN "designer_sample" varchar;
  ALTER TABLE "_home_v_locales" ADD COLUMN "version_designer_sample" varchar;`)
}
