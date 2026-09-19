import { describe, expect, it } from 'vitest';
import { AUTO_RUN, scheduledQueues, TASKS, tickSecond } from '@/modules/cms/jobs/runner';

/**
 * The runner's one rule (ADR-062): two queues whose tasks carry a schedule never tick in
 * the same second, since Payload's scheduler writes the `payload-jobs-stats` global whole
 * from each tick's snapshot and the later write clobbers the earlier one's
 * `lastScheduledRun`, which makes the loser's schedule fire on every tick.
 */
describe('the jobs runner (ADR-033, ADR-062)', () => {
  it('reads the second a tick fires at: a six-field cron names it, five fields tick at 0', () => {
    expect(tickSecond('* * * * *')).toBe(0);
    expect(tickSecond('*/15 * * * *')).toBe(0);
    expect(tickSecond('30 * * * * *')).toBe(30);
    expect(tickSecond(' 5  * * * * * ')).toBe(5);
    expect(() => tickSecond('*/10 * * * * *')).toThrow(/seconds field/);
    expect(() => tickSecond('60 * * * * *')).toThrow(/seconds field/);
  });

  it('names the queues with scheduled tasks from the tasks themselves', () => {
    expect(scheduledQueues()).toEqual(['ai', 'bookings']);
    expect(scheduledQueues([])).toEqual([]);
    expect(TASKS.map((t) => t.slug)).toContain('bookings-sweep');
  });

  it('gives every scheduled queue one tick, and no two scheduled queues the same second', () => {
    const ticks = new Map<string, number>();
    for (const queue of scheduledQueues()) {
      const own = AUTO_RUN.filter((t) => t.queue === queue);
      expect(own, `one tick for the ${queue} queue`).toHaveLength(1);
      ticks.set(queue, tickSecond(own[0]!.cron));
    }
    const seconds = [...ticks.values()];
    expect(new Set(seconds).size, `ticks: ${JSON.stringify([...ticks])}`).toBe(seconds.length);
    // The bookings tick sits at second 30, the engine's at 0 (ADR-062).
    expect(ticks.get('bookings')).toBe(30);
    expect(ticks.get('ai')).toBe(0);
    // A tick over every queue at once would run the scheduler for all of them from one
    // snapshot, which the rule above cannot see: none is declared.
    for (const tick of AUTO_RUN) expect('allQueues' in tick).toBe(false);
  });
});
