import { type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * The stranded content locale (ADR-057, PR C of the no-locale-switch plan): Payload's admin
 * kept the last `?locale=` a person opened as a persistent `locale` preference
 * (`@payloadcms/next`'s `getRequestLocale`), and read it on every admin request after. With
 * the locale switcher gone and the panel refusing a `?locale=` on its URLs, a preference of
 * `en` left from before would open every form in the English view with no control to leave
 * it. The rows go; the panel then opens the default locale for everyone. Data only, no
 * schema change (the snapshot beside this file equals the previous one).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`DELETE FROM "payload_preferences" WHERE "key" = 'locale';`);
}

export async function down(): Promise<void> {
  // Nothing to restore: the rows held a per-person view choice the panel no longer offers.
}
