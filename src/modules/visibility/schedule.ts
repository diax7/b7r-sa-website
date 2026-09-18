/**
 * When the nightly pull runs (ADR-049 PR 3b): 04:00 Riyadh on the UTC clock the runtime
 * keeps (Riyadh is UTC+3, no daylight saving). Read by the task (`pull.ts`) and by the
 * dashboard's jobs queue (`cms/admin/dashboard/schedule.ts`); no imports, so the dashboard
 * never pulls the pull's services.
 */
export const PULL_CRON = '0 1 * * *';
