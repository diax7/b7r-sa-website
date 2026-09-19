import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * The blur-up placeholder of a media document (ADR-029, amended 2026-09-19): a data URL of
 * about 300 bytes, computed by `stampBlur` on upload and backfilled by
 * `scripts/media-blur.ts`. Additive: the running image ignores the column.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "blur" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN "blur";`)
}
