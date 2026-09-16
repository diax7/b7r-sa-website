import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/** A period in days per prompt (ADR-049 addendum, 2026-09-16): every row starts daily. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "prompts" ADD COLUMN "every_days" numeric DEFAULT 1 NOT NULL;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "prompts" DROP COLUMN "every_days";`)
}
