# Upstream report: two `autoRun` queues in the same second clobber each other's schedule stats

For Dhia to file on `payloadcms/payload` (not filed by the agent). Found on 2026-09-19
while building the bookings sweep (ADR-062); the workaround in this repository is the
runner tick offset in `src/modules/cms/jobs/runner.ts` and the rule in
`tests/jobs-runner.test.ts`.

## Title

`jobs.autoRun`: two queues with scheduled tasks ticking in the same second overwrite each
other's `lastScheduledRun` in `payload-jobs-stats`, so one schedule fires on every tick

## Version

`payload@3.89.0` (`@payloadcms/db-postgres`, Next 16 app; the same code is in `main`).

## Where

- `packages/payload/src/queues/operations/handleSchedules/index.ts`: `handleSchedules()`
  reads the `payload-jobs-stats` global once at the top of the tick
  (`req.payload.db.findGlobal({ slug: jobStatsGlobalSlug })`, dist `index.js` line 26) and
  hands that snapshot to every queueable of the tick as `jobStats`.
- `packages/payload/src/queues/operations/handleSchedules/defaultAfterSchedule.ts`
  (dist `defaultAfterSchedule.js` lines 19 to 37): `defaultAfterSchedule()` writes the
  global back **whole** with `db.updateGlobal({ data: { ...jobStats, stats: { ...jobStats.stats,
  scheduledRuns: { ...jobStats.stats.scheduledRuns, queues: { ...queues, [queue]: queueConfig } } } } })`,
  merging only its own queue's `lastScheduledRun` over the snapshot it was given, and it
  does so "regardless of the status" (skipped or queued).
- The autoRun crons are independent `Cron` instances (`packages/payload/src/index.ts`,
  `_initializeCrons`), so two entries with the same pattern fire in the same second and
  their `handleSchedules()` calls overlap.

## What happens

With two queues that each carry a scheduled task, both ticking on `* * * * *`, each tick's
`handleSchedules()` reads the global, then writes it back with only its own queue updated.
The write that lands last carries the other queue's **stale** `lastScheduledRun`, so that
queue's value never advances (in our database it stayed at the last time its write won).
On the next tick `checkQueueableTimeConstraints()` computes `nextRun` from the stale value,
which is already in the past, so the task is queued with a `waitUntil` in the past and runs
immediately: a `*/15 * * * *` schedule fired every minute.

## Reproduction (three sentences)

Define two tasks with `schedule: [{ cron: '*/15 * * * *', queue: 'a' }]` and
`schedule: [{ cron: '*/15 * * * *', queue: 'b' }]`, and
`jobs.autoRun: [{ cron: '* * * * *', queue: 'a' }, { cron: '* * * * *', queue: 'b' }]`, with
`deleteJobOnComplete: true`. Start the server and watch the log for a few minutes: one of
the two tasks runs every minute, and `select stats from payload_jobs_stats` shows its
queue's `lastScheduledRun` stuck while the other queue's advances each minute. Move one
autoRun entry to `'30 * * * * *'` (a six-field cron) and both schedules fire every fifteen
minutes as configured.

## Suggested fix

`defaultAfterSchedule()` should update its own key atomically rather than write the whole
global from the tick's snapshot: re-read the global right before the write, or serialise
the writes of concurrent ticks (a lock or a queue), or store `lastScheduledRun` per
queue/task in a way that a partial update can address (a `jsonb_set` on Postgres, a dotted
`$set` on Mongo). Until then the documentation could say that `autoRun` entries whose
queues carry schedules must not share a cron second.
