import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_cards_items_icon" AS ENUM('ShieldCheck', 'Workflow', 'Zap', 'Target', 'Eye', 'Heart');
  CREATE TYPE "public"."enum_pages_blocks_faq_list_selection" AS ENUM('all', 'home');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_cards_items_icon" AS ENUM('ShieldCheck', 'Workflow', 'Zap', 'Target', 'Eye', 'Heart');
  CREATE TYPE "public"."enum__pages_v_blocks_faq_list_selection" AS ENUM('all', 'home');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('ar', 'en');
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_rich_text_locales" (
  	"title" varchar,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_story" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"with_facts" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_story_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"line" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_cards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_pages_blocks_cards_items_icon",
  	"art_id" integer
  );
  
  CREATE TABLE "pages_blocks_cards_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cards_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon_id" integer
  );
  
  CREATE TABLE "pages_blocks_steps_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_profit_equation" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_profit_equation_locales" (
  	"title" varchar,
  	"sell" varchar,
  	"base" varchar,
  	"profit" varchar,
  	"example_line" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selection" "enum_pages_blocks_faq_list_selection" DEFAULT 'all',
  	"offset" numeric DEFAULT 0,
  	"limit" numeric,
  	"link_href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_list_locales" (
  	"title" varchar,
  	"link_label" varchar,
  	"bottom_line" varchar,
  	"bottom_link_word" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_misk_credential" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_misk_credential_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contact_locales" (
  	"whatsapp_title" varchar,
  	"whatsapp_text" varchar,
  	"email_title" varchar,
  	"phone_title" varchar,
  	"follow_title" varchar,
  	"booking_title" varchar,
  	"booking_text" varchar,
  	"booking_button" varchar,
  	"booking_whatsapp_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_legal_body" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_legal_body_locales" (
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_media_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_media_banner_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"lead" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text_locales" (
  	"title" varchar,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_story" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"with_facts" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_story_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"line" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_cards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__pages_v_blocks_cards_items_icon",
  	"art_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cards_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cards_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_steps_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_profit_equation" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_profit_equation_locales" (
  	"title" varchar,
  	"sell" varchar,
  	"base" varchar,
  	"profit" varchar,
  	"example_line" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_faq_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"selection" "enum__pages_v_blocks_faq_list_selection" DEFAULT 'all',
  	"offset" numeric DEFAULT 0,
  	"limit" numeric,
  	"link_href" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_list_locales" (
  	"title" varchar,
  	"link_label" varchar,
  	"bottom_line" varchar,
  	"bottom_link_word" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_misk_credential" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_misk_credential_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_contact_locales" (
  	"whatsapp_title" varchar,
  	"whatsapp_text" varchar,
  	"email_title" varchar,
  	"phone_title" varchar,
  	"follow_title" varchar,
  	"booking_title" varchar,
  	"booking_text" varchar,
  	"booking_button" varchar,
  	"booking_whatsapp_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_legal_body" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_legal_body_locales" (
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_media_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_media_banner_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_title" varchar,
  	"version_lead" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text_locales" ADD CONSTRAINT "pages_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_story" ADD CONSTRAINT "pages_blocks_story_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_story" ADD CONSTRAINT "pages_blocks_story_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_story_locales" ADD CONSTRAINT "pages_blocks_story_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_story"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards_items" ADD CONSTRAINT "pages_blocks_cards_items_art_id_media_id_fk" FOREIGN KEY ("art_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards_items" ADD CONSTRAINT "pages_blocks_cards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards_items_locales" ADD CONSTRAINT "pages_blocks_cards_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cards_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards" ADD CONSTRAINT "pages_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards_locales" ADD CONSTRAINT "pages_blocks_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps_items" ADD CONSTRAINT "pages_blocks_steps_items_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps_items" ADD CONSTRAINT "pages_blocks_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps_items_locales" ADD CONSTRAINT "pages_blocks_steps_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps" ADD CONSTRAINT "pages_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_profit_equation" ADD CONSTRAINT "pages_blocks_profit_equation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_profit_equation_locales" ADD CONSTRAINT "pages_blocks_profit_equation_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_profit_equation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_list" ADD CONSTRAINT "pages_blocks_faq_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_list_locales" ADD CONSTRAINT "pages_blocks_faq_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_misk_credential" ADD CONSTRAINT "pages_blocks_misk_credential_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_misk_credential_locales" ADD CONSTRAINT "pages_blocks_misk_credential_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_misk_credential"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact" ADD CONSTRAINT "pages_blocks_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_locales" ADD CONSTRAINT "pages_blocks_contact_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_contact"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_legal_body" ADD CONSTRAINT "pages_blocks_legal_body_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_legal_body_locales" ADD CONSTRAINT "pages_blocks_legal_body_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_legal_body"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_banner" ADD CONSTRAINT "pages_blocks_media_banner_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_banner" ADD CONSTRAINT "pages_blocks_media_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_banner_locales" ADD CONSTRAINT "pages_blocks_media_banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_media_banner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text_locales" ADD CONSTRAINT "_pages_v_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_story" ADD CONSTRAINT "_pages_v_blocks_story_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_story" ADD CONSTRAINT "_pages_v_blocks_story_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_story_locales" ADD CONSTRAINT "_pages_v_blocks_story_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_story"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards_items" ADD CONSTRAINT "_pages_v_blocks_cards_items_art_id_media_id_fk" FOREIGN KEY ("art_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards_items" ADD CONSTRAINT "_pages_v_blocks_cards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards_items_locales" ADD CONSTRAINT "_pages_v_blocks_cards_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cards_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards" ADD CONSTRAINT "_pages_v_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cards_locales" ADD CONSTRAINT "_pages_v_blocks_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps_items" ADD CONSTRAINT "_pages_v_blocks_steps_items_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps_items" ADD CONSTRAINT "_pages_v_blocks_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps_items_locales" ADD CONSTRAINT "_pages_v_blocks_steps_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps" ADD CONSTRAINT "_pages_v_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_profit_equation" ADD CONSTRAINT "_pages_v_blocks_profit_equation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_profit_equation_locales" ADD CONSTRAINT "_pages_v_blocks_profit_equation_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_profit_equation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_list" ADD CONSTRAINT "_pages_v_blocks_faq_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_list_locales" ADD CONSTRAINT "_pages_v_blocks_faq_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_misk_credential" ADD CONSTRAINT "_pages_v_blocks_misk_credential_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_misk_credential_locales" ADD CONSTRAINT "_pages_v_blocks_misk_credential_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_misk_credential"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact" ADD CONSTRAINT "_pages_v_blocks_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_locales" ADD CONSTRAINT "_pages_v_blocks_contact_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_contact"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_legal_body" ADD CONSTRAINT "_pages_v_blocks_legal_body_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_legal_body_locales" ADD CONSTRAINT "_pages_v_blocks_legal_body_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_legal_body"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_banner" ADD CONSTRAINT "_pages_v_blocks_media_banner_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_banner" ADD CONSTRAINT "_pages_v_blocks_media_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_banner_locales" ADD CONSTRAINT "_pages_v_blocks_media_banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_media_banner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_rich_text_locales_locale_parent_id_unique" ON "pages_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_story_order_idx" ON "pages_blocks_story" USING btree ("_order");
  CREATE INDEX "pages_blocks_story_parent_id_idx" ON "pages_blocks_story" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_story_path_idx" ON "pages_blocks_story" USING btree ("_path");
  CREATE INDEX "pages_blocks_story_photo_idx" ON "pages_blocks_story" USING btree ("photo_id");
  CREATE UNIQUE INDEX "pages_blocks_story_locales_locale_parent_id_unique" ON "pages_blocks_story_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_cards_items_order_idx" ON "pages_blocks_cards_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_cards_items_parent_id_idx" ON "pages_blocks_cards_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cards_items_art_idx" ON "pages_blocks_cards_items" USING btree ("art_id");
  CREATE UNIQUE INDEX "pages_blocks_cards_items_locales_locale_parent_id_unique" ON "pages_blocks_cards_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_cards_order_idx" ON "pages_blocks_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_cards_parent_id_idx" ON "pages_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cards_path_idx" ON "pages_blocks_cards" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_cards_locales_locale_parent_id_unique" ON "pages_blocks_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_steps_items_order_idx" ON "pages_blocks_steps_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_steps_items_parent_id_idx" ON "pages_blocks_steps_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_items_icon_idx" ON "pages_blocks_steps_items" USING btree ("icon_id");
  CREATE UNIQUE INDEX "pages_blocks_steps_items_locales_locale_parent_id_unique" ON "pages_blocks_steps_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_steps_order_idx" ON "pages_blocks_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_steps_parent_id_idx" ON "pages_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_path_idx" ON "pages_blocks_steps" USING btree ("_path");
  CREATE INDEX "pages_blocks_profit_equation_order_idx" ON "pages_blocks_profit_equation" USING btree ("_order");
  CREATE INDEX "pages_blocks_profit_equation_parent_id_idx" ON "pages_blocks_profit_equation" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_profit_equation_path_idx" ON "pages_blocks_profit_equation" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_profit_equation_locales_locale_parent_id_unique" ON "pages_blocks_profit_equation_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_faq_list_order_idx" ON "pages_blocks_faq_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_list_parent_id_idx" ON "pages_blocks_faq_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_list_path_idx" ON "pages_blocks_faq_list" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_faq_list_locales_locale_parent_id_unique" ON "pages_blocks_faq_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_misk_credential_order_idx" ON "pages_blocks_misk_credential" USING btree ("_order");
  CREATE INDEX "pages_blocks_misk_credential_parent_id_idx" ON "pages_blocks_misk_credential" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_misk_credential_path_idx" ON "pages_blocks_misk_credential" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_misk_credential_locales_locale_parent_id_unique" ON "pages_blocks_misk_credential_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_contact_order_idx" ON "pages_blocks_contact" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_parent_id_idx" ON "pages_blocks_contact" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_path_idx" ON "pages_blocks_contact" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_contact_locales_locale_parent_id_unique" ON "pages_blocks_contact_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_legal_body_order_idx" ON "pages_blocks_legal_body" USING btree ("_order");
  CREATE INDEX "pages_blocks_legal_body_parent_id_idx" ON "pages_blocks_legal_body" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_legal_body_path_idx" ON "pages_blocks_legal_body" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_legal_body_locales_locale_parent_id_unique" ON "pages_blocks_legal_body_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_media_banner_order_idx" ON "pages_blocks_media_banner" USING btree ("_order");
  CREATE INDEX "pages_blocks_media_banner_parent_id_idx" ON "pages_blocks_media_banner" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_banner_path_idx" ON "pages_blocks_media_banner" USING btree ("_path");
  CREATE INDEX "pages_blocks_media_banner_media_idx" ON "pages_blocks_media_banner" USING btree ("media_id");
  CREATE UNIQUE INDEX "pages_blocks_media_banner_locales_locale_parent_id_unique" ON "pages_blocks_media_banner_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_seo_seo_og_image_idx" ON "pages" USING btree ("seo_og_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_rich_text_locales_locale_parent_id_unique" ON "_pages_v_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_story_order_idx" ON "_pages_v_blocks_story" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_story_parent_id_idx" ON "_pages_v_blocks_story" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_story_path_idx" ON "_pages_v_blocks_story" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_story_photo_idx" ON "_pages_v_blocks_story" USING btree ("photo_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_story_locales_locale_parent_id_unique" ON "_pages_v_blocks_story_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_cards_items_order_idx" ON "_pages_v_blocks_cards_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cards_items_parent_id_idx" ON "_pages_v_blocks_cards_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cards_items_art_idx" ON "_pages_v_blocks_cards_items" USING btree ("art_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_cards_items_locales_locale_parent_id_unique" ON "_pages_v_blocks_cards_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_cards_order_idx" ON "_pages_v_blocks_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cards_parent_id_idx" ON "_pages_v_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cards_path_idx" ON "_pages_v_blocks_cards" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_cards_locales_locale_parent_id_unique" ON "_pages_v_blocks_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_items_order_idx" ON "_pages_v_blocks_steps_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_steps_items_parent_id_idx" ON "_pages_v_blocks_steps_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_items_icon_idx" ON "_pages_v_blocks_steps_items" USING btree ("icon_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_steps_items_locales_locale_parent_id_unique" ON "_pages_v_blocks_steps_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_order_idx" ON "_pages_v_blocks_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_steps_parent_id_idx" ON "_pages_v_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_path_idx" ON "_pages_v_blocks_steps" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_profit_equation_order_idx" ON "_pages_v_blocks_profit_equation" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_profit_equation_parent_id_idx" ON "_pages_v_blocks_profit_equation" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_profit_equation_path_idx" ON "_pages_v_blocks_profit_equation" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_profit_equation_locales_locale_parent_id_uni" ON "_pages_v_blocks_profit_equation_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_list_order_idx" ON "_pages_v_blocks_faq_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_list_parent_id_idx" ON "_pages_v_blocks_faq_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_list_path_idx" ON "_pages_v_blocks_faq_list" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_faq_list_locales_locale_parent_id_unique" ON "_pages_v_blocks_faq_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_misk_credential_order_idx" ON "_pages_v_blocks_misk_credential" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_misk_credential_parent_id_idx" ON "_pages_v_blocks_misk_credential" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_misk_credential_path_idx" ON "_pages_v_blocks_misk_credential" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_misk_credential_locales_locale_parent_id_uni" ON "_pages_v_blocks_misk_credential_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_order_idx" ON "_pages_v_blocks_contact" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_contact_parent_id_idx" ON "_pages_v_blocks_contact" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_path_idx" ON "_pages_v_blocks_contact" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_contact_locales_locale_parent_id_unique" ON "_pages_v_blocks_contact_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_legal_body_order_idx" ON "_pages_v_blocks_legal_body" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_legal_body_parent_id_idx" ON "_pages_v_blocks_legal_body" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_legal_body_path_idx" ON "_pages_v_blocks_legal_body" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_legal_body_locales_locale_parent_id_unique" ON "_pages_v_blocks_legal_body_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_media_banner_order_idx" ON "_pages_v_blocks_media_banner" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_media_banner_parent_id_idx" ON "_pages_v_blocks_media_banner" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_banner_path_idx" ON "_pages_v_blocks_media_banner" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_banner_media_idx" ON "_pages_v_blocks_media_banner" USING btree ("media_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_media_banner_locales_locale_parent_id_unique" ON "_pages_v_blocks_media_banner_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_seo_version_seo_og_image_idx" ON "_pages_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_story" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_story_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cards_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cards_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_steps_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_profit_equation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_profit_equation_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_misk_credential" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_misk_credential_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_contact" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_contact_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_legal_body" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_legal_body_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_media_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_media_banner_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_story" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_story_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cards_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cards_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_steps_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_profit_equation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_profit_equation_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_misk_credential" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_misk_credential_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_contact" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_contact_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_legal_body" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_legal_body_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_media_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_media_banner_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_rich_text_locales" CASCADE;
  DROP TABLE "pages_blocks_story" CASCADE;
  DROP TABLE "pages_blocks_story_locales" CASCADE;
  DROP TABLE "pages_blocks_cards_items" CASCADE;
  DROP TABLE "pages_blocks_cards_items_locales" CASCADE;
  DROP TABLE "pages_blocks_cards" CASCADE;
  DROP TABLE "pages_blocks_cards_locales" CASCADE;
  DROP TABLE "pages_blocks_steps_items" CASCADE;
  DROP TABLE "pages_blocks_steps_items_locales" CASCADE;
  DROP TABLE "pages_blocks_steps" CASCADE;
  DROP TABLE "pages_blocks_profit_equation" CASCADE;
  DROP TABLE "pages_blocks_profit_equation_locales" CASCADE;
  DROP TABLE "pages_blocks_faq_list" CASCADE;
  DROP TABLE "pages_blocks_faq_list_locales" CASCADE;
  DROP TABLE "pages_blocks_misk_credential" CASCADE;
  DROP TABLE "pages_blocks_misk_credential_locales" CASCADE;
  DROP TABLE "pages_blocks_contact" CASCADE;
  DROP TABLE "pages_blocks_contact_locales" CASCADE;
  DROP TABLE "pages_blocks_legal_body" CASCADE;
  DROP TABLE "pages_blocks_legal_body_locales" CASCADE;
  DROP TABLE "pages_blocks_media_banner" CASCADE;
  DROP TABLE "pages_blocks_media_banner_locales" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_story" CASCADE;
  DROP TABLE "_pages_v_blocks_story_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_cards_items" CASCADE;
  DROP TABLE "_pages_v_blocks_cards_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_cards_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_steps_items" CASCADE;
  DROP TABLE "_pages_v_blocks_steps_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_profit_equation" CASCADE;
  DROP TABLE "_pages_v_blocks_profit_equation_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_list" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_list_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_misk_credential" CASCADE;
  DROP TABLE "_pages_v_blocks_misk_credential_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_contact" CASCADE;
  DROP TABLE "_pages_v_blocks_contact_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_legal_body" CASCADE;
  DROP TABLE "_pages_v_blocks_legal_body_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_media_banner" CASCADE;
  DROP TABLE "_pages_v_blocks_media_banner_locales" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pages_fk";
  
  DROP INDEX "payload_locked_documents_rels_pages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pages_id";
  DROP TYPE "public"."enum_pages_blocks_cards_items_icon";
  DROP TYPE "public"."enum_pages_blocks_faq_list_selection";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_cards_items_icon";
  DROP TYPE "public"."enum__pages_v_blocks_faq_list_selection";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";`)
}
