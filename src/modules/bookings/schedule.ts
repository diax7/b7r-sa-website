/**
 * When the bookings sweep runs (ADR-062): every fifteen minutes, on the clock the runtime
 * keeps. Read by the task (`sweep.ts`) and by the dashboard's jobs queue
 * (`cms/admin/dashboard/schedule.ts`); no imports, so the dashboard never pulls the sweep's
 * calendar and mail.
 */
export const SWEEP_CRON = '*/15 * * * *';
