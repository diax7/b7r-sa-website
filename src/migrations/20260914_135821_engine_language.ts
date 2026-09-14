import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// The engine in two languages (ADR-043, 5c): `ai-topics.language` (Arabic for every existing
// row) and the settings' style tab localised (style guide, system prompt, banned phrases and
// claims), the Arabic values carried into the 'ar' row before the old columns go. Pre-launch
// only: nothing is deployed, so the additive rule (ADR-025, RUNBOOK) has no running image to
// protect. After launch a moved field is a two-release contract.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ai_topics_language" AS ENUM('ar', 'en');
  CREATE TABLE "ai_settings_locales" (
  	"style_style_guide" varchar NOT NULL,
  	"style_system_prompt" varchar NOT NULL,
  	"style_banned_phrases" varchar NOT NULL,
  	"style_banned_claims" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  ALTER TABLE "ai_topics" ADD COLUMN "language" "enum_ai_topics_language" DEFAULT 'ar' NOT NULL;
  ALTER TABLE "ai_settings_locales" ADD CONSTRAINT "ai_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ai_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "ai_settings_locales_locale_parent_id_unique" ON "ai_settings_locales" USING btree ("_locale","_parent_id");
  INSERT INTO "ai_settings_locales" ("style_style_guide", "style_system_prompt", "style_banned_phrases", "style_banned_claims", "_locale", "_parent_id")
    SELECT "style_style_guide", "style_system_prompt", "style_banned_phrases", "style_banned_claims", 'ar', "id" FROM "ai_settings";
  ALTER TABLE "ai_settings" DROP COLUMN "style_style_guide";
  ALTER TABLE "ai_settings" DROP COLUMN "style_system_prompt";
  ALTER TABLE "ai_settings" DROP COLUMN "style_banned_phrases";
  ALTER TABLE "ai_settings" DROP COLUMN "style_banned_claims";`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ai_settings" ADD COLUMN "style_style_guide" varchar NOT NULL DEFAULT '';
  ALTER TABLE "ai_settings" ADD COLUMN "style_system_prompt" varchar NOT NULL DEFAULT '';
  ALTER TABLE "ai_settings" ADD COLUMN "style_banned_phrases" varchar NOT NULL DEFAULT '';
  ALTER TABLE "ai_settings" ADD COLUMN "style_banned_claims" varchar NOT NULL DEFAULT '';
  UPDATE "ai_settings" s SET
    "style_style_guide" = l."style_style_guide",
    "style_system_prompt" = l."style_system_prompt",
    "style_banned_phrases" = l."style_banned_phrases",
    "style_banned_claims" = l."style_banned_claims"
    FROM "ai_settings_locales" l WHERE l."_parent_id" = s."id" AND l."_locale" = 'ar';
  ALTER TABLE "ai_settings" ALTER COLUMN "style_style_guide" DROP DEFAULT;
  ALTER TABLE "ai_settings" ALTER COLUMN "style_system_prompt" DROP DEFAULT;
  ALTER TABLE "ai_settings" ALTER COLUMN "style_banned_phrases" DROP DEFAULT;
  ALTER TABLE "ai_settings" ALTER COLUMN "style_banned_claims" DROP DEFAULT;
  DROP TABLE "ai_settings_locales" CASCADE;
  ALTER TABLE "ai_topics" DROP COLUMN "language";
  DROP TYPE "public"."enum_ai_topics_language";`);
}
