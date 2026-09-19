import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Bookings of our own (ADR-062), regenerated on the merged main so the snapshot chain stays
 * linear: the `booking` global with its hours and closed dates, the `bookings` collection
 * (the Meet request id column included), the two calendar kinds on the connections enum
 * and the sweep on the jobs enums. The Cal.com link is gone from the site settings' config
 * and its column stays (ADR-025: the running image keeps serving while the schema moves), so
 * the generated `ALTER TABLE "site_settings" DROP COLUMN "booking_url"` is left out on
 * purpose; a later migration drops it by hand. The partial unique index that refuses a
 * double booking follows in the next migration: a generated diff never carries it.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_bookings_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_bookings_status" AS ENUM('booked', 'rescheduled', 'cancelled', 'completed');
  CREATE TYPE "public"."enum_bookings_calendar" AS ENUM('synced', 'failed', 'off');
  CREATE TYPE "public"."enum_booking_hours_day" AS ENUM('0', '1', '2', '3', '4', '5', '6');
  ALTER TYPE "public"."enum_connections_kind" ADD VALUE 'google-calendar';
  ALTER TYPE "public"."enum_connections_kind" ADD VALUE 'mock-calendar';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'bookings-sweep' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'bookings-sweep' BEFORE 'schedulePublish';
  CREATE TABLE "bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"start" timestamp(3) with time zone NOT NULL,
  	"end" timestamp(3) with time zone NOT NULL,
  	"locale" "enum_bookings_locale" DEFAULT 'ar' NOT NULL,
  	"status" "enum_bookings_status" DEFAULT 'booked' NOT NULL,
  	"notes" varchar,
  	"meet_link" varchar,
  	"calendar" "enum_bookings_calendar" DEFAULT 'off' NOT NULL,
  	"google_event_id" varchar,
  	"meet_request_id" varchar,
  	"calendar_attempts" numeric DEFAULT 0,
  	"calendar_attempt_at" timestamp(3) with time zone,
  	"reminded24h" boolean DEFAULT false,
  	"reminded1h" boolean DEFAULT false,
  	"page" varchar,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "booking_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" "enum_booking_hours_day" NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL
  );
  
  CREATE TABLE "booking_closed_dates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "booking_closed_dates_locales" (
  	"reason" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "booking" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"duration_minutes" numeric DEFAULT 30 NOT NULL,
  	"buffer_minutes" numeric DEFAULT 10 NOT NULL,
  	"notice_hours" numeric DEFAULT 24 NOT NULL,
  	"horizon_days" numeric DEFAULT 30 NOT NULL,
  	"max_per_day" numeric DEFAULT 4 NOT NULL,
  	"host_email" varchar,
  	"enabled" boolean DEFAULT false,
  	"last_saved_by_name" varchar,
  	"last_saved_by_at" timestamp(3) with time zone,
  	"translations" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "booking_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "bookings_id" integer;
  ALTER TABLE "booking_hours" ADD CONSTRAINT "booking_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "booking_closed_dates" ADD CONSTRAINT "booking_closed_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "booking_closed_dates_locales" ADD CONSTRAINT "booking_closed_dates_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking_closed_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "booking_locales" ADD CONSTRAINT "booking_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "bookings_start_idx" ON "bookings" USING btree ("start");
  CREATE INDEX "bookings_updated_at_idx" ON "bookings" USING btree ("updated_at");
  CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");
  CREATE INDEX "booking_hours_order_idx" ON "booking_hours" USING btree ("_order");
  CREATE INDEX "booking_hours_parent_id_idx" ON "booking_hours" USING btree ("_parent_id");
  CREATE INDEX "booking_closed_dates_order_idx" ON "booking_closed_dates" USING btree ("_order");
  CREATE INDEX "booking_closed_dates_parent_id_idx" ON "booking_closed_dates" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "booking_closed_dates_locales_locale_parent_id_unique" ON "booking_closed_dates_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "booking_locales_locale_parent_id_unique" ON "booking_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_bookings_id_idx" ON "payload_locked_documents_rels" USING btree ("bookings_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bookings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "booking_hours" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "booking_closed_dates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "booking_closed_dates_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "booking" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "booking_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "bookings" CASCADE;
  DROP TABLE "booking_hours" CASCADE;
  DROP TABLE "booking_closed_dates" CASCADE;
  DROP TABLE "booking_closed_dates_locales" CASCADE;
  DROP TABLE "booking" CASCADE;
  DROP TABLE "booking_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_bookings_fk";
  
  ALTER TABLE "connections" ALTER COLUMN "kind" SET DATA TYPE text;
  ALTER TABLE "connections" ALTER COLUMN "kind" SET DEFAULT 'openai'::text;
  DROP TYPE "public"."enum_connections_kind";
  CREATE TYPE "public"."enum_connections_kind" AS ENUM('openai', 'anthropic', 'google', 'deepseek', 'openai-compatible', 'mock', 'google-search-console', 'bing-webmaster', 'pagespeed', 'umami');
  ALTER TABLE "connections" ALTER COLUMN "kind" SET DEFAULT 'openai'::"public"."enum_connections_kind";
  ALTER TABLE "connections" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_connections_kind" USING "kind"::"public"."enum_connections_kind";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'indexnow-ping', 'content-tick', 'content-freshness', 'content-digest', 'visibility-pull', 'citation-ledger', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'indexnow-ping', 'content-tick', 'content-freshness', 'content-digest', 'visibility-pull', 'citation-ledger', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_locked_documents_rels_bookings_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "bookings_id";
  DROP TYPE "public"."enum_bookings_locale";
  DROP TYPE "public"."enum_bookings_status";
  DROP TYPE "public"."enum_bookings_calendar";
  DROP TYPE "public"."enum_booking_hours_day";`)
}
