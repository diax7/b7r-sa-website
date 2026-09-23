import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_rich_text" ADD COLUMN "background" varchar;
  ALTER TABLE "pages_blocks_story" ADD COLUMN "background" varchar;
  ALTER TABLE "pages_blocks_cards" ADD COLUMN "background" varchar;
  ALTER TABLE "pages_blocks_steps" ADD COLUMN "background" varchar;
  ALTER TABLE "pages_blocks_profit_equation" ADD COLUMN "background" varchar;
  ALTER TABLE "pages_blocks_faq_list" ADD COLUMN "background" varchar;
  ALTER TABLE "pages_blocks_misk_credential" ADD COLUMN "background" varchar;
  ALTER TABLE "pages_blocks_contact" ADD COLUMN "background" varchar;
  ALTER TABLE "pages_blocks_legal_body" ADD COLUMN "background" varchar;
  ALTER TABLE "pages_blocks_media_banner" ADD COLUMN "background" varchar;
  ALTER TABLE "pages_blocks_compare" ADD COLUMN "background" varchar;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD COLUMN "background" varchar;
  ALTER TABLE "_pages_v_blocks_story" ADD COLUMN "background" varchar;
  ALTER TABLE "_pages_v_blocks_cards" ADD COLUMN "background" varchar;
  ALTER TABLE "_pages_v_blocks_steps" ADD COLUMN "background" varchar;
  ALTER TABLE "_pages_v_blocks_profit_equation" ADD COLUMN "background" varchar;
  ALTER TABLE "_pages_v_blocks_faq_list" ADD COLUMN "background" varchar;
  ALTER TABLE "_pages_v_blocks_misk_credential" ADD COLUMN "background" varchar;
  ALTER TABLE "_pages_v_blocks_contact" ADD COLUMN "background" varchar;
  ALTER TABLE "_pages_v_blocks_legal_body" ADD COLUMN "background" varchar;
  ALTER TABLE "_pages_v_blocks_media_banner" ADD COLUMN "background" varchar;
  ALTER TABLE "_pages_v_blocks_compare" ADD COLUMN "background" varchar;
  ALTER TABLE "home" ADD COLUMN "product_strip_background" varchar;
  ALTER TABLE "home" ADD COLUMN "designer_background" varchar;
  ALTER TABLE "home" ADD COLUMN "steps_background" varchar;
  ALTER TABLE "home" ADD COLUMN "video_background" varchar;
  ALTER TABLE "home" ADD COLUMN "why_us_background" varchar;
  ALTER TABLE "home" ADD COLUMN "testimonials_background" varchar;
  ALTER TABLE "home" ADD COLUMN "integrations_background" varchar;
  ALTER TABLE "home" ADD COLUMN "faq_background" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_product_strip_background" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_designer_background" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_steps_background" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_video_background" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_why_us_background" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_testimonials_background" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_integrations_background" varchar;
  ALTER TABLE "_home_v" ADD COLUMN "version_faq_background" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_rich_text" DROP COLUMN "background";
  ALTER TABLE "pages_blocks_story" DROP COLUMN "background";
  ALTER TABLE "pages_blocks_cards" DROP COLUMN "background";
  ALTER TABLE "pages_blocks_steps" DROP COLUMN "background";
  ALTER TABLE "pages_blocks_profit_equation" DROP COLUMN "background";
  ALTER TABLE "pages_blocks_faq_list" DROP COLUMN "background";
  ALTER TABLE "pages_blocks_misk_credential" DROP COLUMN "background";
  ALTER TABLE "pages_blocks_contact" DROP COLUMN "background";
  ALTER TABLE "pages_blocks_legal_body" DROP COLUMN "background";
  ALTER TABLE "pages_blocks_media_banner" DROP COLUMN "background";
  ALTER TABLE "pages_blocks_compare" DROP COLUMN "background";
  ALTER TABLE "_pages_v_blocks_rich_text" DROP COLUMN "background";
  ALTER TABLE "_pages_v_blocks_story" DROP COLUMN "background";
  ALTER TABLE "_pages_v_blocks_cards" DROP COLUMN "background";
  ALTER TABLE "_pages_v_blocks_steps" DROP COLUMN "background";
  ALTER TABLE "_pages_v_blocks_profit_equation" DROP COLUMN "background";
  ALTER TABLE "_pages_v_blocks_faq_list" DROP COLUMN "background";
  ALTER TABLE "_pages_v_blocks_misk_credential" DROP COLUMN "background";
  ALTER TABLE "_pages_v_blocks_contact" DROP COLUMN "background";
  ALTER TABLE "_pages_v_blocks_legal_body" DROP COLUMN "background";
  ALTER TABLE "_pages_v_blocks_media_banner" DROP COLUMN "background";
  ALTER TABLE "_pages_v_blocks_compare" DROP COLUMN "background";
  ALTER TABLE "home" DROP COLUMN "product_strip_background";
  ALTER TABLE "home" DROP COLUMN "designer_background";
  ALTER TABLE "home" DROP COLUMN "steps_background";
  ALTER TABLE "home" DROP COLUMN "video_background";
  ALTER TABLE "home" DROP COLUMN "why_us_background";
  ALTER TABLE "home" DROP COLUMN "testimonials_background";
  ALTER TABLE "home" DROP COLUMN "integrations_background";
  ALTER TABLE "home" DROP COLUMN "faq_background";
  ALTER TABLE "_home_v" DROP COLUMN "version_product_strip_background";
  ALTER TABLE "_home_v" DROP COLUMN "version_designer_background";
  ALTER TABLE "_home_v" DROP COLUMN "version_steps_background";
  ALTER TABLE "_home_v" DROP COLUMN "version_video_background";
  ALTER TABLE "_home_v" DROP COLUMN "version_why_us_background";
  ALTER TABLE "_home_v" DROP COLUMN "version_testimonials_background";
  ALTER TABLE "_home_v" DROP COLUMN "version_integrations_background";
  ALTER TABLE "_home_v" DROP COLUMN "version_faq_background";`)
}
