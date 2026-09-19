import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * The double-booking guard (ADR-062): one active booking per start. A partial unique index
 * is beyond what the Payload config can declare, so a generated diff never carries it: it
 * is created and dropped here by hand, and the snapshot beside this file is the previous
 * one unchanged. With the grid rule (every start sits on the settings' grid), two bookings
 * that overlap have the same start, so the index alone makes a race a refusal; a cancelled
 * booking frees its slot by leaving the index.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE UNIQUE INDEX "bookings_start_active" ON "bookings" USING btree ("start") WHERE "status" <> 'cancelled';`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "bookings_start_active";`);
}
