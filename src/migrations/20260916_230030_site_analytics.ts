import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "analytics_ga_id" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "analytics_umami_src" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "analytics_umami_id" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "analytics_ga_id";
  ALTER TABLE "site_settings" DROP COLUMN "analytics_umami_src";
  ALTER TABLE "site_settings" DROP COLUMN "analytics_umami_id";`)
}
