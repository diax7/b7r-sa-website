import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "visibility_checklist" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"linkedin_company" boolean DEFAULT false,
  	"linkedin_founder" boolean DEFAULT false,
  	"youtube" boolean DEFAULT false,
  	"x_profile" boolean DEFAULT false,
  	"first_mention" boolean DEFAULT false,
  	"last_saved_by_name" varchar,
  	"last_saved_by_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "visibility_checklist" CASCADE;`)
}
