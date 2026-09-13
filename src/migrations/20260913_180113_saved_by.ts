import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "last_saved_by_name" varchar;
  ALTER TABLE "media" ADD COLUMN "last_saved_by_at" timestamp(3) with time zone;
  ALTER TABLE "products" ADD COLUMN "last_saved_by_name" varchar;
  ALTER TABLE "products" ADD COLUMN "last_saved_by_at" timestamp(3) with time zone;
  ALTER TABLE "_products_v" ADD COLUMN "version_last_saved_by_name" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_last_saved_by_at" timestamp(3) with time zone;
  ALTER TABLE "pages" ADD COLUMN "last_saved_by_name" varchar;
  ALTER TABLE "pages" ADD COLUMN "last_saved_by_at" timestamp(3) with time zone;
  ALTER TABLE "_pages_v" ADD COLUMN "version_last_saved_by_name" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_last_saved_by_at" timestamp(3) with time zone;
  ALTER TABLE "faqs" ADD COLUMN "last_saved_by_name" varchar;
  ALTER TABLE "faqs" ADD COLUMN "last_saved_by_at" timestamp(3) with time zone;
  ALTER TABLE "testimonials" ADD COLUMN "last_saved_by_name" varchar;
  ALTER TABLE "testimonials" ADD COLUMN "last_saved_by_at" timestamp(3) with time zone;
  ALTER TABLE "_testimonials_v" ADD COLUMN "version_last_saved_by_name" varchar;
  ALTER TABLE "_testimonials_v" ADD COLUMN "version_last_saved_by_at" timestamp(3) with time zone;
  ALTER TABLE "integrations" ADD COLUMN "last_saved_by_name" varchar;
  ALTER TABLE "integrations" ADD COLUMN "last_saved_by_at" timestamp(3) with time zone;
  ALTER TABLE "home" ADD COLUMN "last_saved_by_name" varchar;
  ALTER TABLE "home" ADD COLUMN "last_saved_by_at" timestamp(3) with time zone;
  ALTER TABLE "_home_v" ADD COLUMN "version_last_saved_by_name" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_last_saved_by_at" timestamp(3) with time zone;
  ALTER TABLE "site_settings" ADD COLUMN "last_saved_by_name" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "last_saved_by_at" timestamp(3) with time zone;
  ALTER TABLE "navigation" ADD COLUMN "last_saved_by_name" varchar;
  ALTER TABLE "navigation" ADD COLUMN "last_saved_by_at" timestamp(3) with time zone;
  ALTER TABLE "seo_defaults" ADD COLUMN "last_saved_by_name" varchar;
  ALTER TABLE "seo_defaults" ADD COLUMN "last_saved_by_at" timestamp(3) with time zone;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN "last_saved_by_name";
  ALTER TABLE "media" DROP COLUMN "last_saved_by_at";
  ALTER TABLE "products" DROP COLUMN "last_saved_by_name";
  ALTER TABLE "products" DROP COLUMN "last_saved_by_at";
  ALTER TABLE "_products_v" DROP COLUMN "version_last_saved_by_name";
  ALTER TABLE "_products_v" DROP COLUMN "version_last_saved_by_at";
  ALTER TABLE "pages" DROP COLUMN "last_saved_by_name";
  ALTER TABLE "pages" DROP COLUMN "last_saved_by_at";
  ALTER TABLE "_pages_v" DROP COLUMN "version_last_saved_by_name";
  ALTER TABLE "_pages_v" DROP COLUMN "version_last_saved_by_at";
  ALTER TABLE "faqs" DROP COLUMN "last_saved_by_name";
  ALTER TABLE "faqs" DROP COLUMN "last_saved_by_at";
  ALTER TABLE "testimonials" DROP COLUMN "last_saved_by_name";
  ALTER TABLE "testimonials" DROP COLUMN "last_saved_by_at";
  ALTER TABLE "_testimonials_v" DROP COLUMN "version_last_saved_by_name";
  ALTER TABLE "_testimonials_v" DROP COLUMN "version_last_saved_by_at";
  ALTER TABLE "integrations" DROP COLUMN "last_saved_by_name";
  ALTER TABLE "integrations" DROP COLUMN "last_saved_by_at";
  ALTER TABLE "home" DROP COLUMN "last_saved_by_name";
  ALTER TABLE "home" DROP COLUMN "last_saved_by_at";
  ALTER TABLE "_home_v" DROP COLUMN "version_last_saved_by_name";
  ALTER TABLE "_home_v" DROP COLUMN "version_last_saved_by_at";
  ALTER TABLE "site_settings" DROP COLUMN "last_saved_by_name";
  ALTER TABLE "site_settings" DROP COLUMN "last_saved_by_at";
  ALTER TABLE "navigation" DROP COLUMN "last_saved_by_name";
  ALTER TABLE "navigation" DROP COLUMN "last_saved_by_at";
  ALTER TABLE "seo_defaults" DROP COLUMN "last_saved_by_name";
  ALTER TABLE "seo_defaults" DROP COLUMN "last_saved_by_at";`)
}
