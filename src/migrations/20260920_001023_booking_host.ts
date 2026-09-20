import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * The booker's event pane (ADR-063): the `host` relationship to the author record and the
 * localized `blurb` on the booking global. The diff also carries the `status` index of the
 * bookings collection (declared in PR 4b's second phase after its migration was generated):
 * `IF NOT EXISTS`, since a database the dev push touched may hold it already. That
 * `IF NOT EXISTS` is hand-written: a regenerated drizzle diff carries a plain
 * `CREATE INDEX` and must be edited back, so a future regeneration on top of a newer main
 * keeps this file (its snapshot JSON beside it) rather than replacing it, as the enum
 * migration of the Umami kind does.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "booking" ADD COLUMN "host_id" integer;
  ALTER TABLE "booking_locales" ADD COLUMN "blurb" varchar;
  ALTER TABLE "booking" ADD CONSTRAINT "booking_host_id_authors_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings" USING btree ("status");
  CREATE INDEX "booking_host_idx" ON "booking" USING btree ("host_id");`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "booking" DROP CONSTRAINT "booking_host_id_authors_id_fk";

  DROP INDEX "bookings_status_idx";
  DROP INDEX "booking_host_idx";
  ALTER TABLE "booking" DROP COLUMN "host_id";
  ALTER TABLE "booking_locales" DROP COLUMN "blurb";`);
}
