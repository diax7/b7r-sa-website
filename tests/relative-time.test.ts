import { describe, expect, it } from 'vitest';
import { formatDate, relativeTime } from '@/modules/cms/admin/dashboard/relative-time';

const now = new Date('2026-09-13T12:00:00Z');
const at = (ms: number) => new Date(now.getTime() - ms);

describe('relative time (dashboard)', () => {
  it('reads as minutes, hours and days ago, singular when one', () => {
    expect(relativeTime(at(10_000), now)).toBe('just now');
    expect(relativeTime(at(60_000), now)).toBe('1 minute ago');
    expect(relativeTime(at(5 * 60_000), now)).toBe('5 minutes ago');
    expect(relativeTime(at(3_600_000), now)).toBe('1 hour ago');
    expect(relativeTime(at(11 * 3_600_000), now)).toBe('11 hours ago');
    expect(relativeTime(at(24 * 3_600_000), now)).toBe('1 day ago');
    expect(relativeTime(at(3 * 24 * 3_600_000), now)).toBe('3 days ago');
  });

  it('falls back to the date after a week, and to nothing for garbage', () => {
    expect(relativeTime(at(8 * 24 * 3_600_000), now)).toBe(formatDate(at(8 * 24 * 3_600_000)));
    expect(relativeTime('not-a-date', now)).toBe('');
  });
});
