import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// Drops `seo-defaults.defaultOgImage` in place: nothing read it since the default Open Graph
// image became the rendered file per language (ADR-043), and a field an admin can edit with
// no effect is a lie. Pre-launch only: nothing is deployed, so the additive rule (ADR-025,
// RUNBOOK) has no running image to protect. `down` restores the column with the value the
// seed wrote, so a rollback keeps the NOT NULL the original migration declared.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seo_defaults" DROP COLUMN "default_og_image";`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seo_defaults" ADD COLUMN "default_og_image" varchar NOT NULL DEFAULT '/og/default.png';
  ALTER TABLE "seo_defaults" ALTER COLUMN "default_og_image" DROP DEFAULT;`);
}
