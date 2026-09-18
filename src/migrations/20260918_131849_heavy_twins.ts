import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * The heavy twins (ADR-057, PR B): one nullable sibling column per localized rich text or
 * upload, on the row that holds the original and on its versions table: the page block's
 * `content_twin` and the post's `body_twin` (jsonb), the hero slide's two photo twins
 * (media ids). Every twin is null at rest; it carries the English between an admin read and
 * the save that applies it. Additive, no data moves.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_rich_text" ADD COLUMN "content_twin" jsonb;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD COLUMN "content_twin" jsonb;
  ALTER TABLE "posts" ADD COLUMN "body_twin" jsonb;
  ALTER TABLE "_posts_v" ADD COLUMN "version_body_twin" jsonb;
  ALTER TABLE "home_hero_slides" ADD COLUMN "image_desktop_twin_id" integer;
  ALTER TABLE "home_hero_slides" ADD COLUMN "image_mobile_twin_id" integer;
  ALTER TABLE "_home_v_version_hero_slides" ADD COLUMN "image_desktop_twin_id" integer;
  ALTER TABLE "_home_v_version_hero_slides" ADD COLUMN "image_mobile_twin_id" integer;
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_image_desktop_twin_id_media_id_fk" FOREIGN KEY ("image_desktop_twin_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_image_mobile_twin_id_media_id_fk" FOREIGN KEY ("image_mobile_twin_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_image_desktop_twin_id_media_id_fk" FOREIGN KEY ("image_desktop_twin_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_image_mobile_twin_id_media_id_fk" FOREIGN KEY ("image_mobile_twin_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_hero_slides_image_desktop_twin_idx" ON "home_hero_slides" USING btree ("image_desktop_twin_id");
  CREATE INDEX "home_hero_slides_image_mobile_twin_idx" ON "home_hero_slides" USING btree ("image_mobile_twin_id");
  CREATE INDEX "_home_v_version_hero_slides_image_desktop_twin_idx" ON "_home_v_version_hero_slides" USING btree ("image_desktop_twin_id");
  CREATE INDEX "_home_v_version_hero_slides_image_mobile_twin_idx" ON "_home_v_version_hero_slides" USING btree ("image_mobile_twin_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_hero_slides" DROP CONSTRAINT "home_hero_slides_image_desktop_twin_id_media_id_fk";
  
  ALTER TABLE "home_hero_slides" DROP CONSTRAINT "home_hero_slides_image_mobile_twin_id_media_id_fk";
  
  ALTER TABLE "_home_v_version_hero_slides" DROP CONSTRAINT "_home_v_version_hero_slides_image_desktop_twin_id_media_id_fk";
  
  ALTER TABLE "_home_v_version_hero_slides" DROP CONSTRAINT "_home_v_version_hero_slides_image_mobile_twin_id_media_id_fk";
  
  DROP INDEX "home_hero_slides_image_desktop_twin_idx";
  DROP INDEX "home_hero_slides_image_mobile_twin_idx";
  DROP INDEX "_home_v_version_hero_slides_image_desktop_twin_idx";
  DROP INDEX "_home_v_version_hero_slides_image_mobile_twin_idx";
  ALTER TABLE "pages_blocks_rich_text" DROP COLUMN "content_twin";
  ALTER TABLE "_pages_v_blocks_rich_text" DROP COLUMN "content_twin";
  ALTER TABLE "posts" DROP COLUMN "body_twin";
  ALTER TABLE "_posts_v" DROP COLUMN "version_body_twin";
  ALTER TABLE "home_hero_slides" DROP COLUMN "image_desktop_twin_id";
  ALTER TABLE "home_hero_slides" DROP COLUMN "image_mobile_twin_id";
  ALTER TABLE "_home_v_version_hero_slides" DROP COLUMN "image_desktop_twin_id";
  ALTER TABLE "_home_v_version_hero_slides" DROP COLUMN "image_mobile_twin_id";`)
}
