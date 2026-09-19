import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * The `booking` global (ADR-062): the settings, the weekly hours and the closed dates,
 * with the two language tables. The Cal.com link is gone from the site settings' config,
 * and its column stays: the snapshot beside this file no longer lists it, and the running
 * image keeps serving while the schema moves (ADR-025), so the generated
 * `ALTER TABLE "site_settings" DROP COLUMN "booking_url"` is left out here on purpose;
 * a later migration drops it by hand.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_booking_hours_day" AS ENUM('0', '1', '2', '3', '4', '5', '6');
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
  	"title" varchar DEFAULT 'استشارة مجانية، 30 دقيقة' NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "booking_hours" ADD CONSTRAINT "booking_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "booking_closed_dates" ADD CONSTRAINT "booking_closed_dates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "booking_closed_dates_locales" ADD CONSTRAINT "booking_closed_dates_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking_closed_dates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "booking_locales" ADD CONSTRAINT "booking_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "booking_hours_order_idx" ON "booking_hours" USING btree ("_order");
  CREATE INDEX "booking_hours_parent_id_idx" ON "booking_hours" USING btree ("_parent_id");
  CREATE INDEX "booking_closed_dates_order_idx" ON "booking_closed_dates" USING btree ("_order");
  CREATE INDEX "booking_closed_dates_parent_id_idx" ON "booking_closed_dates" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "booking_closed_dates_locales_locale_parent_id_unique" ON "booking_closed_dates_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "booking_locales_locale_parent_id_unique" ON "booking_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "booking_hours" CASCADE;
  DROP TABLE "booking_closed_dates" CASCADE;
  DROP TABLE "booking_closed_dates_locales" CASCADE;
  DROP TABLE "booking" CASCADE;
  DROP TABLE "booking_locales" CASCADE;
  DROP TYPE "public"."enum_booking_hours_day";`)
}
