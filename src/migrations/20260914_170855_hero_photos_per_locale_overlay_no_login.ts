import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// ADR-044. The hero photos become per language: the two upload columns move from the slide
// rows to their locale rows. The field was shared, so every existing locale row receives the
// photo its slide had (the site reads without locale fallback; `/en` must keep rendering);
// the English seed or the admin then sets the English photos. `hero.overlay` gains its two
// columns with the defaults the site assumed. The login label, the menu's WhatsApp line and
// the app URLs go: nothing reads them (pre-launch, drop in place; ADR-025's additive rule
// protects a running image, and there is none). `down` restores the shared columns from the
// Arabic rows and re-adds the dropped NOT NULL columns with a default, then drops the default.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_hero_slides" DROP CONSTRAINT "home_hero_slides_image_desktop_id_media_id_fk";
  
  ALTER TABLE "home_hero_slides" DROP CONSTRAINT "home_hero_slides_image_mobile_id_media_id_fk";
  
  ALTER TABLE "_home_v_version_hero_slides" DROP CONSTRAINT "_home_v_version_hero_slides_image_desktop_id_media_id_fk";
  
  ALTER TABLE "_home_v_version_hero_slides" DROP CONSTRAINT "_home_v_version_hero_slides_image_mobile_id_media_id_fk";
  
  DROP INDEX "home_hero_slides_image_desktop_idx";
  DROP INDEX "home_hero_slides_image_mobile_idx";
  DROP INDEX "_home_v_version_hero_slides_image_desktop_idx";
  DROP INDEX "_home_v_version_hero_slides_image_mobile_idx";
  ALTER TABLE "home_hero_slides_locales" ADD COLUMN "image_desktop_id" integer;
  ALTER TABLE "home_hero_slides_locales" ADD COLUMN "image_mobile_id" integer;
  ALTER TABLE "home" ADD COLUMN "hero_overlay_enabled" boolean DEFAULT true;
  ALTER TABLE "home" ADD COLUMN "hero_overlay_color" varchar DEFAULT '#ffffff';
  ALTER TABLE "_home_v_version_hero_slides_locales" ADD COLUMN "image_desktop_id" integer;
  ALTER TABLE "_home_v_version_hero_slides_locales" ADD COLUMN "image_mobile_id" integer;
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_overlay_enabled" boolean DEFAULT true;
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_overlay_color" varchar DEFAULT '#ffffff';
  ALTER TABLE "home_hero_slides_locales" ADD CONSTRAINT "home_hero_slides_locales_image_desktop_id_media_id_fk" FOREIGN KEY ("image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_slides_locales" ADD CONSTRAINT "home_hero_slides_locales_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides_locales" ADD CONSTRAINT "_home_v_version_hero_slides_locales_image_desktop_id_media_id_fk" FOREIGN KEY ("image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides_locales" ADD CONSTRAINT "_home_v_version_hero_slides_locales_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_hero_slides_image_desktop_idx" ON "home_hero_slides_locales" USING btree ("image_desktop_id","_locale");
  CREATE INDEX "home_hero_slides_image_mobile_idx" ON "home_hero_slides_locales" USING btree ("image_mobile_id","_locale");
  CREATE INDEX "_home_v_version_hero_slides_image_desktop_idx" ON "_home_v_version_hero_slides_locales" USING btree ("image_desktop_id","_locale");
  CREATE INDEX "_home_v_version_hero_slides_image_mobile_idx" ON "_home_v_version_hero_slides_locales" USING btree ("image_mobile_id","_locale");
  UPDATE "home_hero_slides_locales" l
    SET "image_desktop_id" = s."image_desktop_id", "image_mobile_id" = s."image_mobile_id"
    FROM "home_hero_slides" s WHERE l."_parent_id" = s."id";
  UPDATE "_home_v_version_hero_slides_locales" l
    SET "image_desktop_id" = s."image_desktop_id", "image_mobile_id" = s."image_mobile_id"
    FROM "_home_v_version_hero_slides" s WHERE l."_parent_id" = s."id";
  ALTER TABLE "home_hero_slides" DROP COLUMN "image_desktop_id";
  ALTER TABLE "home_hero_slides" DROP COLUMN "image_mobile_id";
  ALTER TABLE "_home_v_version_hero_slides" DROP COLUMN "image_desktop_id";
  ALTER TABLE "_home_v_version_hero_slides" DROP COLUMN "image_mobile_id";
  ALTER TABLE "site_settings" DROP COLUMN "app_urls_register";
  ALTER TABLE "site_settings" DROP COLUMN "app_urls_login";
  ALTER TABLE "navigation_locales" DROP COLUMN "login_label";
  ALTER TABLE "navigation_locales" DROP COLUMN "menu_whatsapp_line";`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home_hero_slides_locales" DROP CONSTRAINT "home_hero_slides_locales_image_desktop_id_media_id_fk";
  
  ALTER TABLE "home_hero_slides_locales" DROP CONSTRAINT "home_hero_slides_locales_image_mobile_id_media_id_fk";
  
  ALTER TABLE "_home_v_version_hero_slides_locales" DROP CONSTRAINT "_home_v_version_hero_slides_locales_image_desktop_id_media_id_fk";
  
  ALTER TABLE "_home_v_version_hero_slides_locales" DROP CONSTRAINT "_home_v_version_hero_slides_locales_image_mobile_id_media_id_fk";
  
  DROP INDEX "home_hero_slides_image_desktop_idx";
  DROP INDEX "home_hero_slides_image_mobile_idx";
  DROP INDEX "_home_v_version_hero_slides_image_desktop_idx";
  DROP INDEX "_home_v_version_hero_slides_image_mobile_idx";
  ALTER TABLE "home_hero_slides" ADD COLUMN "image_desktop_id" integer;
  ALTER TABLE "home_hero_slides" ADD COLUMN "image_mobile_id" integer;
  ALTER TABLE "_home_v_version_hero_slides" ADD COLUMN "image_desktop_id" integer;
  ALTER TABLE "_home_v_version_hero_slides" ADD COLUMN "image_mobile_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "app_urls_register" varchar NOT NULL DEFAULT 'https://b7r.app/register';
  ALTER TABLE "site_settings" ADD COLUMN "app_urls_login" varchar NOT NULL DEFAULT 'https://b7r.app/login';
  ALTER TABLE "navigation_locales" ADD COLUMN "login_label" varchar NOT NULL DEFAULT '';
  ALTER TABLE "navigation_locales" ADD COLUMN "menu_whatsapp_line" varchar NOT NULL DEFAULT '';
  ALTER TABLE "site_settings" ALTER COLUMN "app_urls_register" DROP DEFAULT;
  ALTER TABLE "site_settings" ALTER COLUMN "app_urls_login" DROP DEFAULT;
  ALTER TABLE "navigation_locales" ALTER COLUMN "login_label" DROP DEFAULT;
  ALTER TABLE "navigation_locales" ALTER COLUMN "menu_whatsapp_line" DROP DEFAULT;
  UPDATE "home_hero_slides" s
    SET "image_desktop_id" = l."image_desktop_id", "image_mobile_id" = l."image_mobile_id"
    FROM "home_hero_slides_locales" l WHERE l."_parent_id" = s."id" AND l."_locale" = 'ar';
  UPDATE "_home_v_version_hero_slides" s
    SET "image_desktop_id" = l."image_desktop_id", "image_mobile_id" = l."image_mobile_id"
    FROM "_home_v_version_hero_slides_locales" l WHERE l."_parent_id" = s."id" AND l."_locale" = 'ar';
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_image_desktop_id_media_id_fk" FOREIGN KEY ("image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_image_desktop_id_media_id_fk" FOREIGN KEY ("image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_hero_slides_image_desktop_idx" ON "home_hero_slides" USING btree ("image_desktop_id");
  CREATE INDEX "home_hero_slides_image_mobile_idx" ON "home_hero_slides" USING btree ("image_mobile_id");
  CREATE INDEX "_home_v_version_hero_slides_image_desktop_idx" ON "_home_v_version_hero_slides" USING btree ("image_desktop_id");
  CREATE INDEX "_home_v_version_hero_slides_image_mobile_idx" ON "_home_v_version_hero_slides" USING btree ("image_mobile_id");
  ALTER TABLE "home_hero_slides_locales" DROP COLUMN "image_desktop_id";
  ALTER TABLE "home_hero_slides_locales" DROP COLUMN "image_mobile_id";
  ALTER TABLE "home" DROP COLUMN "hero_overlay_enabled";
  ALTER TABLE "home" DROP COLUMN "hero_overlay_color";
  ALTER TABLE "_home_v_version_hero_slides_locales" DROP COLUMN "image_desktop_id";
  ALTER TABLE "_home_v_version_hero_slides_locales" DROP COLUMN "image_mobile_id";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_overlay_enabled";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_overlay_color";`);
}
