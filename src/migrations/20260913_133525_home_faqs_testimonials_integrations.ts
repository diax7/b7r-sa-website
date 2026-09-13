import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_faqs_group" AS ENUM('البداية', 'الأسعار والربح', 'الطلبات والتوصيل', 'المتاجر والربط', 'الجودة والدعم');
  CREATE TYPE "public"."enum_testimonials_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__testimonials_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__testimonials_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_integrations_platform" AS ENUM('salla', 'zid', 'shopify');
  CREATE TYPE "public"."enum_home_why_us_items_icon" AS ENUM('ShieldCheck', 'Workflow', 'Zap');
  CREATE TYPE "public"."enum_home_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_v_version_why_us_items_icon" AS ENUM('ShieldCheck', 'Workflow', 'Zap');
  CREATE TYPE "public"."enum__home_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_v_published_locale" AS ENUM('ar', 'en');
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"group" "enum_faqs_group" NOT NULL,
  	"order" numeric DEFAULT 1 NOT NULL,
  	"show_on_home" boolean DEFAULT false,
  	"home_order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"avatar_id" integer,
  	"order" numeric DEFAULT 1,
  	"placeholder" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_testimonials_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "testimonials_locales" (
  	"quote" varchar,
  	"name" varchar,
  	"store" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_testimonials_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_avatar_id" integer,
  	"version_order" numeric DEFAULT 1,
  	"version_placeholder" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__testimonials_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__testimonials_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_testimonials_v_locales" (
  	"version_quote" varchar,
  	"version_name" varchar,
  	"version_store" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "integrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"platform" "enum_integrations_platform" NOT NULL,
  	"order" numeric DEFAULT 1 NOT NULL,
  	"name_latin" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "integrations_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "home_hero_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_desktop_id" integer,
  	"image_mobile_id" integer
  );
  
  CREATE TABLE "home_hero_slides_locales" (
  	"headline" varchar,
  	"subline" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_hero_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "home_hero_chips_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon_id" integer
  );
  
  CREATE TABLE "home_steps_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_why_us_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_home_why_us_items_icon"
  );
  
  CREATE TABLE "home_why_us_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"steps_enabled" boolean DEFAULT true,
  	"video_enabled" boolean DEFAULT true,
  	"why_us_enabled" boolean DEFAULT true,
  	"testimonials_enabled" boolean DEFAULT true,
  	"integrations_enabled" boolean DEFAULT true,
  	"faq_enabled" boolean DEFAULT true,
  	"_status" "enum_home_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_locales" (
  	"hero_primary_cta" varchar,
  	"hero_secondary_cta" varchar,
  	"hero_microcopy" varchar,
  	"product_strip_eyebrow" varchar,
  	"product_strip_title" varchar,
  	"product_strip_lead" varchar,
  	"product_strip_price_prefix" varchar,
  	"product_strip_button" varchar,
  	"designer_eyebrow" varchar,
  	"designer_title" varchar,
  	"designer_lead" varchar,
  	"designer_sample" varchar,
  	"designer_cta" varchar,
  	"steps_eyebrow" varchar,
  	"steps_title" varchar,
  	"steps_link" varchar,
  	"video_title" varchar,
  	"video_lead" varchar,
  	"why_us_eyebrow" varchar,
  	"why_us_title" varchar,
  	"testimonials_eyebrow" varchar,
  	"testimonials_title" varchar,
  	"integrations_title" varchar,
  	"integrations_lead" varchar,
  	"faq_title" varchar,
  	"faq_link" varchar,
  	"ribbon_title" varchar,
  	"ribbon_lead" varchar,
  	"ribbon_button" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "home_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "_home_v_version_hero_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_desktop_id" integer,
  	"image_mobile_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_hero_slides_locales" (
  	"headline" varchar,
  	"subline" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_v_version_hero_chips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_hero_chips_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_v_version_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_steps_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_v_version_why_us_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__home_v_version_why_us_items_icon",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_why_us_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_steps_enabled" boolean DEFAULT true,
  	"version_video_enabled" boolean DEFAULT true,
  	"version_why_us_enabled" boolean DEFAULT true,
  	"version_testimonials_enabled" boolean DEFAULT true,
  	"version_integrations_enabled" boolean DEFAULT true,
  	"version_faq_enabled" boolean DEFAULT true,
  	"version__status" "enum__home_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__home_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_home_v_locales" (
  	"version_hero_primary_cta" varchar,
  	"version_hero_secondary_cta" varchar,
  	"version_hero_microcopy" varchar,
  	"version_product_strip_eyebrow" varchar,
  	"version_product_strip_title" varchar,
  	"version_product_strip_lead" varchar,
  	"version_product_strip_price_prefix" varchar,
  	"version_product_strip_button" varchar,
  	"version_designer_eyebrow" varchar,
  	"version_designer_title" varchar,
  	"version_designer_lead" varchar,
  	"version_designer_sample" varchar,
  	"version_designer_cta" varchar,
  	"version_steps_eyebrow" varchar,
  	"version_steps_title" varchar,
  	"version_steps_link" varchar,
  	"version_video_title" varchar,
  	"version_video_lead" varchar,
  	"version_why_us_eyebrow" varchar,
  	"version_why_us_title" varchar,
  	"version_testimonials_eyebrow" varchar,
  	"version_testimonials_title" varchar,
  	"version_integrations_title" varchar,
  	"version_integrations_lead" varchar,
  	"version_faq_title" varchar,
  	"version_faq_link" varchar,
  	"version_ribbon_title" varchar,
  	"version_ribbon_lead" varchar,
  	"version_ribbon_button" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "faqs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "testimonials_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "integrations_id" integer;
  ALTER TABLE "faqs_locales" ADD CONSTRAINT "faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials_locales" ADD CONSTRAINT "testimonials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_testimonials_v" ADD CONSTRAINT "_testimonials_v_parent_id_testimonials_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."testimonials"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_testimonials_v" ADD CONSTRAINT "_testimonials_v_version_avatar_id_media_id_fk" FOREIGN KEY ("version_avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_testimonials_v_locales" ADD CONSTRAINT "_testimonials_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_testimonials_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "integrations_locales" ADD CONSTRAINT "integrations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_image_desktop_id_media_id_fk" FOREIGN KEY ("image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_hero_slides" ADD CONSTRAINT "home_hero_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_hero_slides_locales" ADD CONSTRAINT "home_hero_slides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_hero_slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_hero_chips" ADD CONSTRAINT "home_hero_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_hero_chips_locales" ADD CONSTRAINT "home_hero_chips_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_hero_chips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_steps_items" ADD CONSTRAINT "home_steps_items_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_steps_items" ADD CONSTRAINT "home_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_steps_items_locales" ADD CONSTRAINT "home_steps_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_steps_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_why_us_items" ADD CONSTRAINT "home_why_us_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_why_us_items_locales" ADD CONSTRAINT "home_why_us_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_why_us_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_locales" ADD CONSTRAINT "home_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_rels" ADD CONSTRAINT "home_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_image_desktop_id_media_id_fk" FOREIGN KEY ("image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_image_mobile_id_media_id_fk" FOREIGN KEY ("image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides" ADD CONSTRAINT "_home_v_version_hero_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_slides_locales" ADD CONSTRAINT "_home_v_version_hero_slides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v_version_hero_slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_chips" ADD CONSTRAINT "_home_v_version_hero_chips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_hero_chips_locales" ADD CONSTRAINT "_home_v_version_hero_chips_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v_version_hero_chips"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_steps_items" ADD CONSTRAINT "_home_v_version_steps_items_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_version_steps_items" ADD CONSTRAINT "_home_v_version_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_steps_items_locales" ADD CONSTRAINT "_home_v_version_steps_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v_version_steps_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_why_us_items" ADD CONSTRAINT "_home_v_version_why_us_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_why_us_items_locales" ADD CONSTRAINT "_home_v_version_why_us_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v_version_why_us_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_locales" ADD CONSTRAINT "_home_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_rels" ADD CONSTRAINT "_home_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_rels" ADD CONSTRAINT "_home_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE UNIQUE INDEX "faqs_locales_locale_parent_id_unique" ON "faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "testimonials_avatar_idx" ON "testimonials" USING btree ("avatar_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE INDEX "testimonials__status_idx" ON "testimonials" USING btree ("_status");
  CREATE UNIQUE INDEX "testimonials_locales_locale_parent_id_unique" ON "testimonials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_testimonials_v_parent_idx" ON "_testimonials_v" USING btree ("parent_id");
  CREATE INDEX "_testimonials_v_version_version_avatar_idx" ON "_testimonials_v" USING btree ("version_avatar_id");
  CREATE INDEX "_testimonials_v_version_version_updated_at_idx" ON "_testimonials_v" USING btree ("version_updated_at");
  CREATE INDEX "_testimonials_v_version_version_created_at_idx" ON "_testimonials_v" USING btree ("version_created_at");
  CREATE INDEX "_testimonials_v_version_version__status_idx" ON "_testimonials_v" USING btree ("version__status");
  CREATE INDEX "_testimonials_v_created_at_idx" ON "_testimonials_v" USING btree ("created_at");
  CREATE INDEX "_testimonials_v_updated_at_idx" ON "_testimonials_v" USING btree ("updated_at");
  CREATE INDEX "_testimonials_v_snapshot_idx" ON "_testimonials_v" USING btree ("snapshot");
  CREATE INDEX "_testimonials_v_published_locale_idx" ON "_testimonials_v" USING btree ("published_locale");
  CREATE INDEX "_testimonials_v_latest_idx" ON "_testimonials_v" USING btree ("latest");
  CREATE INDEX "_testimonials_v_autosave_idx" ON "_testimonials_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_testimonials_v_locales_locale_parent_id_unique" ON "_testimonials_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "integrations_platform_idx" ON "integrations" USING btree ("platform");
  CREATE INDEX "integrations_updated_at_idx" ON "integrations" USING btree ("updated_at");
  CREATE INDEX "integrations_created_at_idx" ON "integrations" USING btree ("created_at");
  CREATE UNIQUE INDEX "integrations_locales_locale_parent_id_unique" ON "integrations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_hero_slides_order_idx" ON "home_hero_slides" USING btree ("_order");
  CREATE INDEX "home_hero_slides_parent_id_idx" ON "home_hero_slides" USING btree ("_parent_id");
  CREATE INDEX "home_hero_slides_image_desktop_idx" ON "home_hero_slides" USING btree ("image_desktop_id");
  CREATE INDEX "home_hero_slides_image_mobile_idx" ON "home_hero_slides" USING btree ("image_mobile_id");
  CREATE UNIQUE INDEX "home_hero_slides_locales_locale_parent_id_unique" ON "home_hero_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_hero_chips_order_idx" ON "home_hero_chips" USING btree ("_order");
  CREATE INDEX "home_hero_chips_parent_id_idx" ON "home_hero_chips" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_hero_chips_locales_locale_parent_id_unique" ON "home_hero_chips_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_steps_items_order_idx" ON "home_steps_items" USING btree ("_order");
  CREATE INDEX "home_steps_items_parent_id_idx" ON "home_steps_items" USING btree ("_parent_id");
  CREATE INDEX "home_steps_items_icon_idx" ON "home_steps_items" USING btree ("icon_id");
  CREATE UNIQUE INDEX "home_steps_items_locales_locale_parent_id_unique" ON "home_steps_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_why_us_items_order_idx" ON "home_why_us_items" USING btree ("_order");
  CREATE INDEX "home_why_us_items_parent_id_idx" ON "home_why_us_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_why_us_items_locales_locale_parent_id_unique" ON "home_why_us_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home__status_idx" ON "home" USING btree ("_status");
  CREATE UNIQUE INDEX "home_locales_locale_parent_id_unique" ON "home_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_rels_order_idx" ON "home_rels" USING btree ("order");
  CREATE INDEX "home_rels_parent_idx" ON "home_rels" USING btree ("parent_id");
  CREATE INDEX "home_rels_path_idx" ON "home_rels" USING btree ("path");
  CREATE INDEX "home_rels_products_id_idx" ON "home_rels" USING btree ("products_id");
  CREATE INDEX "_home_v_version_hero_slides_order_idx" ON "_home_v_version_hero_slides" USING btree ("_order");
  CREATE INDEX "_home_v_version_hero_slides_parent_id_idx" ON "_home_v_version_hero_slides" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_hero_slides_image_desktop_idx" ON "_home_v_version_hero_slides" USING btree ("image_desktop_id");
  CREATE INDEX "_home_v_version_hero_slides_image_mobile_idx" ON "_home_v_version_hero_slides" USING btree ("image_mobile_id");
  CREATE UNIQUE INDEX "_home_v_version_hero_slides_locales_locale_parent_id_unique" ON "_home_v_version_hero_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_home_v_version_hero_chips_order_idx" ON "_home_v_version_hero_chips" USING btree ("_order");
  CREATE INDEX "_home_v_version_hero_chips_parent_id_idx" ON "_home_v_version_hero_chips" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_home_v_version_hero_chips_locales_locale_parent_id_unique" ON "_home_v_version_hero_chips_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_home_v_version_steps_items_order_idx" ON "_home_v_version_steps_items" USING btree ("_order");
  CREATE INDEX "_home_v_version_steps_items_parent_id_idx" ON "_home_v_version_steps_items" USING btree ("_parent_id");
  CREATE INDEX "_home_v_version_steps_items_icon_idx" ON "_home_v_version_steps_items" USING btree ("icon_id");
  CREATE UNIQUE INDEX "_home_v_version_steps_items_locales_locale_parent_id_unique" ON "_home_v_version_steps_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_home_v_version_why_us_items_order_idx" ON "_home_v_version_why_us_items" USING btree ("_order");
  CREATE INDEX "_home_v_version_why_us_items_parent_id_idx" ON "_home_v_version_why_us_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_home_v_version_why_us_items_locales_locale_parent_id_unique" ON "_home_v_version_why_us_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_home_v_version_version__status_idx" ON "_home_v" USING btree ("version__status");
  CREATE INDEX "_home_v_created_at_idx" ON "_home_v" USING btree ("created_at");
  CREATE INDEX "_home_v_updated_at_idx" ON "_home_v" USING btree ("updated_at");
  CREATE INDEX "_home_v_snapshot_idx" ON "_home_v" USING btree ("snapshot");
  CREATE INDEX "_home_v_published_locale_idx" ON "_home_v" USING btree ("published_locale");
  CREATE INDEX "_home_v_latest_idx" ON "_home_v" USING btree ("latest");
  CREATE INDEX "_home_v_autosave_idx" ON "_home_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_home_v_locales_locale_parent_id_unique" ON "_home_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_home_v_rels_order_idx" ON "_home_v_rels" USING btree ("order");
  CREATE INDEX "_home_v_rels_parent_idx" ON "_home_v_rels" USING btree ("parent_id");
  CREATE INDEX "_home_v_rels_path_idx" ON "_home_v_rels" USING btree ("path");
  CREATE INDEX "_home_v_rels_products_id_idx" ON "_home_v_rels" USING btree ("products_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_integrations_fk" FOREIGN KEY ("integrations_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_integrations_id_idx" ON "payload_locked_documents_rels" USING btree ("integrations_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faqs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "testimonials_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_testimonials_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_testimonials_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "integrations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "integrations_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_hero_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_hero_slides_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_hero_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_hero_chips_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_steps_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_why_us_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_why_us_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_v_version_hero_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_v_version_hero_slides_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_v_version_hero_chips" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_v_version_hero_chips_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_v_version_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_v_version_steps_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_v_version_why_us_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_v_version_why_us_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_home_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "faqs_locales" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "testimonials_locales" CASCADE;
  DROP TABLE "_testimonials_v" CASCADE;
  DROP TABLE "_testimonials_v_locales" CASCADE;
  DROP TABLE "integrations" CASCADE;
  DROP TABLE "integrations_locales" CASCADE;
  DROP TABLE "home_hero_slides" CASCADE;
  DROP TABLE "home_hero_slides_locales" CASCADE;
  DROP TABLE "home_hero_chips" CASCADE;
  DROP TABLE "home_hero_chips_locales" CASCADE;
  DROP TABLE "home_steps_items" CASCADE;
  DROP TABLE "home_steps_items_locales" CASCADE;
  DROP TABLE "home_why_us_items" CASCADE;
  DROP TABLE "home_why_us_items_locales" CASCADE;
  DROP TABLE "home" CASCADE;
  DROP TABLE "home_locales" CASCADE;
  DROP TABLE "home_rels" CASCADE;
  DROP TABLE "_home_v_version_hero_slides" CASCADE;
  DROP TABLE "_home_v_version_hero_slides_locales" CASCADE;
  DROP TABLE "_home_v_version_hero_chips" CASCADE;
  DROP TABLE "_home_v_version_hero_chips_locales" CASCADE;
  DROP TABLE "_home_v_version_steps_items" CASCADE;
  DROP TABLE "_home_v_version_steps_items_locales" CASCADE;
  DROP TABLE "_home_v_version_why_us_items" CASCADE;
  DROP TABLE "_home_v_version_why_us_items_locales" CASCADE;
  DROP TABLE "_home_v" CASCADE;
  DROP TABLE "_home_v_locales" CASCADE;
  DROP TABLE "_home_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faqs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_testimonials_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_integrations_fk";
  
  DROP INDEX "payload_locked_documents_rels_faqs_id_idx";
  DROP INDEX "payload_locked_documents_rels_testimonials_id_idx";
  DROP INDEX "payload_locked_documents_rels_integrations_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "faqs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "testimonials_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "integrations_id";
  DROP TYPE "public"."enum_faqs_group";
  DROP TYPE "public"."enum_testimonials_status";
  DROP TYPE "public"."enum__testimonials_v_version_status";
  DROP TYPE "public"."enum__testimonials_v_published_locale";
  DROP TYPE "public"."enum_integrations_platform";
  DROP TYPE "public"."enum_home_why_us_items_icon";
  DROP TYPE "public"."enum_home_status";
  DROP TYPE "public"."enum__home_v_version_why_us_items_icon";
  DROP TYPE "public"."enum__home_v_version_status";
  DROP TYPE "public"."enum__home_v_published_locale";`)
}
