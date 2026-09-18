import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "translations" jsonb;
  ALTER TABLE "products" ADD COLUMN "translations" jsonb;
  ALTER TABLE "_products_v" ADD COLUMN "version_translations" jsonb;
  ALTER TABLE "pages" ADD COLUMN "translations" jsonb;
  ALTER TABLE "_pages_v" ADD COLUMN "version_translations" jsonb;
  ALTER TABLE "faqs" ADD COLUMN "translations" jsonb;
  ALTER TABLE "testimonials" ADD COLUMN "translations" jsonb;
  ALTER TABLE "_testimonials_v" ADD COLUMN "version_translations" jsonb;
  ALTER TABLE "integrations" ADD COLUMN "translations" jsonb;
  ALTER TABLE "posts" ADD COLUMN "translations" jsonb;
  ALTER TABLE "_posts_v" ADD COLUMN "version_translations" jsonb;
  ALTER TABLE "categories" ADD COLUMN "translations" jsonb;
  ALTER TABLE "authors" ADD COLUMN "translations" jsonb;
  ALTER TABLE "tags" ADD COLUMN "translations" jsonb;
  ALTER TABLE "home" ADD COLUMN "translations" jsonb;
  ALTER TABLE "_home_v" ADD COLUMN "version_translations" jsonb;
  ALTER TABLE "site_settings" ADD COLUMN "translations" jsonb;
  ALTER TABLE "seo_defaults" ADD COLUMN "translations" jsonb;
  ALTER TABLE "ai_settings" ADD COLUMN "translations" jsonb;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN "translations";
  ALTER TABLE "products" DROP COLUMN "translations";
  ALTER TABLE "_products_v" DROP COLUMN "version_translations";
  ALTER TABLE "pages" DROP COLUMN "translations";
  ALTER TABLE "_pages_v" DROP COLUMN "version_translations";
  ALTER TABLE "faqs" DROP COLUMN "translations";
  ALTER TABLE "testimonials" DROP COLUMN "translations";
  ALTER TABLE "_testimonials_v" DROP COLUMN "version_translations";
  ALTER TABLE "integrations" DROP COLUMN "translations";
  ALTER TABLE "posts" DROP COLUMN "translations";
  ALTER TABLE "_posts_v" DROP COLUMN "version_translations";
  ALTER TABLE "categories" DROP COLUMN "translations";
  ALTER TABLE "authors" DROP COLUMN "translations";
  ALTER TABLE "tags" DROP COLUMN "translations";
  ALTER TABLE "home" DROP COLUMN "translations";
  ALTER TABLE "_home_v" DROP COLUMN "version_translations";
  ALTER TABLE "site_settings" DROP COLUMN "translations";
  ALTER TABLE "seo_defaults" DROP COLUMN "translations";
  ALTER TABLE "ai_settings" DROP COLUMN "translations";`)
}
