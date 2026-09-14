import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ai_topics_intent" AS ENUM('informational', 'commercial', 'seasonal');
  CREATE TYPE "public"."enum_ai_topics_status" AS ENUM('backlog', 'scheduled', 'generating', 'published', 'failed', 'rejected');
  CREATE TYPE "public"."enum_ai_topics_source" AS ENUM('seed', 'manual', 'searchConsole');
  CREATE TYPE "public"."enum_ai_runs_kind" AS ENUM('generate', 'freshness');
  CREATE TYPE "public"."enum_ai_runs_status" AS ENUM('running', 'done', 'failed', 'skipped');
  CREATE TYPE "public"."enum_payload_jobs_workflow_slug" AS ENUM('generatePost');
  CREATE TYPE "public"."enum_ai_settings_active_provider" AS ENUM('openai', 'deepseek', 'anthropic', 'google', 'mock');
  CREATE TYPE "public"."enum_ai_settings_images_image_mode" AS ENUM('hubDefault', 'stock', 'generate');
  CREATE TABLE "ai_topics_secondary_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"keyword" varchar NOT NULL
  );
  
  CREATE TABLE "ai_topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"hub_id" integer NOT NULL,
  	"intent" "enum_ai_topics_intent" DEFAULT 'informational' NOT NULL,
  	"priority" numeric DEFAULT 3 NOT NULL,
  	"primary_keyword" varchar NOT NULL,
  	"window_start" timestamp(3) with time zone,
  	"window_end" timestamp(3) with time zone,
  	"status" "enum_ai_topics_status" DEFAULT 'backlog' NOT NULL,
  	"source" "enum_ai_topics_source" DEFAULT 'manual' NOT NULL,
  	"notes" varchar,
  	"post_id" integer,
  	"last_run_id" integer,
  	"last_error" varchar,
  	"last_saved_by_name" varchar,
  	"last_saved_by_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ai_runs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"kind" "enum_ai_runs_kind" DEFAULT 'generate' NOT NULL,
  	"status" "enum_ai_runs_status" DEFAULT 'running' NOT NULL,
  	"provider" varchar,
  	"model" varchar,
  	"score" numeric,
  	"tokens_in" numeric,
  	"tokens_out" numeric,
  	"cost_usd" numeric,
  	"duration_ms" numeric,
  	"rubric" jsonb,
  	"steps" jsonb,
  	"outline" jsonb,
  	"system_prompt_version" numeric,
  	"topic_id" integer,
  	"post_id" integer,
  	"error" varchar,
  	"started_at" timestamp(3) with time zone,
  	"finished_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ai_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"active_provider" "enum_ai_settings_active_provider" DEFAULT 'openai' NOT NULL,
  	"providers_openai_model" varchar DEFAULT 'gpt-4.1' NOT NULL,
  	"providers_openai_api_key" varchar,
  	"providers_openai_input_per_million_usd" numeric DEFAULT 2 NOT NULL,
  	"providers_openai_output_per_million_usd" numeric DEFAULT 8 NOT NULL,
  	"providers_deepseek_model" varchar DEFAULT 'deepseek-chat' NOT NULL,
  	"providers_deepseek_api_key" varchar,
  	"providers_deepseek_input_per_million_usd" numeric DEFAULT 0.27 NOT NULL,
  	"providers_deepseek_output_per_million_usd" numeric DEFAULT 1.1 NOT NULL,
  	"providers_anthropic_model" varchar DEFAULT 'claude-sonnet-4-5' NOT NULL,
  	"providers_anthropic_api_key" varchar,
  	"providers_anthropic_input_per_million_usd" numeric DEFAULT 3 NOT NULL,
  	"providers_anthropic_output_per_million_usd" numeric DEFAULT 15 NOT NULL,
  	"providers_google_model" varchar DEFAULT 'gemini-2.5-pro' NOT NULL,
  	"providers_google_api_key" varchar,
  	"providers_google_input_per_million_usd" numeric DEFAULT 1.25 NOT NULL,
  	"providers_google_output_per_million_usd" numeric DEFAULT 10 NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"posts_per_day" numeric DEFAULT 1 NOT NULL,
  	"publish_hour_riyadh" numeric DEFAULT 9 NOT NULL,
  	"max_posts_per_month" numeric DEFAULT 31 NOT NULL,
  	"daily_cost_cap_usd" numeric DEFAULT 5 NOT NULL,
  	"review_first_runs" numeric DEFAULT 3 NOT NULL,
  	"style_style_guide" varchar DEFAULT 'اللغة: فصحى مبسطة بنبرة سعودية دافئة ومباشرة، من رائد أعمال إلى رائد أعمال.
  - الأفعال أولاً في الإرشادات (ارفع تصميمك)، والعبارات الاسمية في العناوين.
  - ممنوع: قم بـ، القيام بـ، تم + مصدر، يرجى، بنجاح، الخاص بك، هناك في بداية الجملة، بشكل + صفة، الجمل بترتيب إنجليزي، الشرطة المائلة للبدائل (استخدم "أو")، الشرطة الطويلة.
  - المخاطب تاجر بصيغة المذكر المفرد.
  - الأرقام غربية (1، 2، 3). المبالغ: "45 ريالاً". المدد: "5 أيام".
  - الفاصلة العربية «،» وعلامة الاستفهام «؟». لا تعجّب.
  - المصطلحات: الطباعة عند الطلب (وطباعة حسب الطلب مرة واحدة للبحث)، بحر برنت، متجرك، سلة · زد · شوبيفاي، تيشيرت أساسي · تيشيرت أوفرسايز · هودي · بربتوز أطفال · حقيبة قماشية، التكلفة · سعر البيع · ربحك · المحفظة · رصيد ترحيبي، علامتك التجارية في النص وبراندك في الدعوة إلى الإجراء.
  - الفقرات قصيرة (ثلاث جمل أو أربع)، والقوائم عندما تفيد، ومثال واحد على الأقل بأرقام حقيقية من ورقة الحقائق.
  - عناوين H2 بصيغة أسئلة، وكل عنوان يبدأ بجواب مباشر في جملة واحدة.
  - لا فقرات بحروف لاتينية؛ أسماء المنصات والعلامات تُكتب بالعربية إلا داخل رابط أو رمز.
  - لا ذكر للذكاء الاصطناعي أو لطريقة كتابة المقال في أي موضع.' NOT NULL,
  	"style_system_prompt" varchar DEFAULT 'أنت كاتب محتوى في بحر برنت، منصة الطباعة عند الطلب في السعودية. تكتب أدلة عملية لتجار يبدؤون براند ملابس بلا مخزون. تلتزم بدليل الأسلوب حرفياً، ولا تذكر أي رقم أو وعد غير موجود في ورقة الحقائق، ولا تذكر منتجات أو أسعاراً خارجها. تكتب بالعربية فقط، بصيغة Markdown: عناوين من المستوى الثاني (##) بصيغة أسئلة، فقرات قصيرة، قوائم عند الحاجة، وروابط داخلية بصيغة [نص](/مسار) إلى المسارات المسموح بها فقط. لا جداول، لا عناوين من المستوى الأول، لا شرطة طويلة، لا إشارة إلى الذكاء الاصطناعي.' NOT NULL,
  	"style_system_prompt_version" numeric DEFAULT 1,
  	"style_banned_phrases" varchar DEFAULT 'قم بـ
  قم ب
  القيام بـ
  تم 
  تمت 
  يرجى
  بنجاح
  الخاص بك
  الخاصة بك
  هناك 
  بشكل 
  لقد قمت' NOT NULL,
  	"style_banned_claims" varchar DEFAULT '- أي مدة توصيل غير المدة في ورقة الحقائق.
  - أي منتج أو مقاس أو لون غير الموجود في الكتالوج.
  - أي سعر أو تكلفة أو ربح غير الأرقام في ورقة الحقائق.
  - أي ادعاء عن Printful أو Printify أو Gelato يتجاوز ما هو معلن على مواقعها.
  - عبارات التفضيل المطلق مثل "الأفضل في السعودية" أو "الأرخص".
  - أي ضمان للدخل أو للمبيعات أو وعد بربح محدد.
  - أي ذكر لجهة حكومية أو رقم نظامي دون مصدر رسمي.' NOT NULL,
  	"images_image_mode" "enum_ai_settings_images_image_mode" DEFAULT 'hubDefault' NOT NULL,
  	"images_image_style" varchar DEFAULT 'no text, no letters, no logos, flat studio light, brand blue accents, clean background',
  	"images_pexels_key" varchar,
  	"quality_quality_threshold" numeric DEFAULT 80 NOT NULL,
  	"quality_max_revision_passes" numeric DEFAULT 1 NOT NULL,
  	"quality_min_words" numeric DEFAULT 800 NOT NULL,
  	"quality_max_words" numeric DEFAULT 1600 NOT NULL,
  	"notifications_notify_email" varchar,
  	"notifications_weekly_digest" boolean DEFAULT true,
  	"notifications_failure_alerts" boolean DEFAULT true,
  	"last_saved_by_name" varchar,
  	"last_saved_by_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_jobs" ADD COLUMN "workflow_slug" "enum_payload_jobs_workflow_slug";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_topics_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_runs_id" integer;
  ALTER TABLE "ai_topics_secondary_keywords" ADD CONSTRAINT "ai_topics_secondary_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ai_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ai_topics" ADD CONSTRAINT "ai_topics_hub_id_categories_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_topics" ADD CONSTRAINT "ai_topics_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_topics" ADD CONSTRAINT "ai_topics_last_run_id_ai_runs_id_fk" FOREIGN KEY ("last_run_id") REFERENCES "public"."ai_runs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_topic_id_ai_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."ai_topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "ai_topics_secondary_keywords_order_idx" ON "ai_topics_secondary_keywords" USING btree ("_order");
  CREATE INDEX "ai_topics_secondary_keywords_parent_id_idx" ON "ai_topics_secondary_keywords" USING btree ("_parent_id");
  CREATE INDEX "ai_topics_hub_idx" ON "ai_topics" USING btree ("hub_id");
  CREATE INDEX "ai_topics_post_idx" ON "ai_topics" USING btree ("post_id");
  CREATE INDEX "ai_topics_last_run_idx" ON "ai_topics" USING btree ("last_run_id");
  CREATE INDEX "ai_topics_updated_at_idx" ON "ai_topics" USING btree ("updated_at");
  CREATE INDEX "ai_topics_created_at_idx" ON "ai_topics" USING btree ("created_at");
  CREATE INDEX "ai_runs_topic_idx" ON "ai_runs" USING btree ("topic_id");
  CREATE INDEX "ai_runs_post_idx" ON "ai_runs" USING btree ("post_id");
  CREATE INDEX "ai_runs_updated_at_idx" ON "ai_runs" USING btree ("updated_at");
  CREATE INDEX "ai_runs_created_at_idx" ON "ai_runs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_topics_fk" FOREIGN KEY ("ai_topics_id") REFERENCES "public"."ai_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_runs_fk" FOREIGN KEY ("ai_runs_id") REFERENCES "public"."ai_runs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_jobs_workflow_slug_idx" ON "payload_jobs" USING btree ("workflow_slug");
  CREATE INDEX "payload_locked_documents_rels_ai_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_topics_id");
  CREATE INDEX "payload_locked_documents_rels_ai_runs_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_runs_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ai_topics_secondary_keywords" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_runs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ai_topics_secondary_keywords" CASCADE;
  DROP TABLE "ai_topics" CASCADE;
  DROP TABLE "ai_runs" CASCADE;
  DROP TABLE "ai_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_topics_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_runs_fk";
  
  DROP INDEX "payload_jobs_workflow_slug_idx";
  DROP INDEX "payload_locked_documents_rels_ai_topics_id_idx";
  DROP INDEX "payload_locked_documents_rels_ai_runs_id_idx";
  ALTER TABLE "payload_jobs" DROP COLUMN "workflow_slug";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_topics_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_runs_id";
  DROP TYPE "public"."enum_ai_topics_intent";
  DROP TYPE "public"."enum_ai_topics_status";
  DROP TYPE "public"."enum_ai_topics_source";
  DROP TYPE "public"."enum_ai_runs_kind";
  DROP TYPE "public"."enum_ai_runs_status";
  DROP TYPE "public"."enum_payload_jobs_workflow_slug";
  DROP TYPE "public"."enum_ai_settings_active_provider";
  DROP TYPE "public"."enum_ai_settings_images_image_mode";`)
}
