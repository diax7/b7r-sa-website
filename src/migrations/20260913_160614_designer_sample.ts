import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

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
