/**
 * When the engine's weekly passes run (BRD 10.2.4 amendment, ADR-042), on the UTC clock the
 * runtime keeps (Riyadh is UTC+3, no daylight saving): the freshness pass Monday 06:00
 * Riyadh, the digest Sunday 08:00 Riyadh. Read by the tasks (`freshness.ts`, `digest.ts`)
 * and by the dashboard's jobs queue (`cms/admin/dashboard/schedule.ts`); no imports, so the
 * dashboard never pulls the engine's pipeline.
 */
export const FRESHNESS_CRON = '0 3 * * 1';
export const DIGEST_CRON = '0 5 * * 0';
