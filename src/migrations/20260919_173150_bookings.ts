import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * The `bookings` collection (ADR-062): one row per consultation with its status, its Meet
 * link and the calendar's state. The partial unique index that refuses a double booking
 * follows in the next migration by hand: a generated diff never carries it. The booking
 * title's SQL default goes because the config now defaults it per language.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_bookings_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_bookings_status" AS ENUM('booked', 'rescheduled', 'cancelled', 'completed');
  CREATE TYPE "public"."enum_bookings_calendar" AS ENUM('synced', 'failed', 'off');
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
  
  ALTER TABLE "booking_locales" ALTER COLUMN "title" DROP DEFAULT;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "bookings_id" integer;
  CREATE INDEX "bookings_start_idx" ON "bookings" USING btree ("start");
  CREATE INDEX "bookings_updated_at_idx" ON "bookings" USING btree ("updated_at");
  CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_bookings_id_idx" ON "payload_locked_documents_rels" USING btree ("bookings_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "bookings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "bookings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_bookings_fk";
  
  DROP INDEX "payload_locked_documents_rels_bookings_id_idx";
  ALTER TABLE "booking_locales" ALTER COLUMN "title" SET DEFAULT 'استشارة مجانية، 30 دقيقة';
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "bookings_id";
  DROP TYPE "public"."enum_bookings_locale";
  DROP TYPE "public"."enum_bookings_status";
  DROP TYPE "public"."enum_bookings_calendar";`)
}
