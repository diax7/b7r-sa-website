/**
 * When the citation ledger runs (ADR-049 D5): every morning at 07:00 Riyadh on the UTC
 * clock the runtime keeps (Riyadh is UTC+3, no daylight saving); each prompt on its period.
 * Read by the task (`run.ts`) and by the dashboard (`cms/admin/dashboard/schedule.ts`).
 */
export const LEDGER_CRON = '0 4 * * *';
