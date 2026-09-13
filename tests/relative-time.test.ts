import { describe, expect, it } from 'vitest';
import { formatDate, relativeTime } from '@/modules/cms/admin/dashboard/relative-time';

const now = new Date('2026-09-13T12:00:00Z');
const at = (ms: number) => new Date(now.getTime() - ms);

describe('Arabic relative time (dashboard)', () => {
  it('uses the singular, the dual, the 3–10 plural and the 11+ singular', () => {
    expect(relativeTime(at(10_000), now)).toBe('قبل قليل');
    expect(relativeTime(at(60_000), now)).toBe('قبل دقيقة');
    expect(relativeTime(at(2 * 60_000), now)).toBe('قبل دقيقتين');
    expect(relativeTime(at(5 * 60_000), now)).toBe('قبل 5 دقائق');
    expect(relativeTime(at(15 * 60_000), now)).toBe('قبل 15 دقيقة');
    expect(relativeTime(at(3_600_000), now)).toBe('قبل ساعة');
    expect(relativeTime(at(2 * 3_600_000), now)).toBe('قبل ساعتين');
    expect(relativeTime(at(11 * 3_600_000), now)).toBe('قبل 11 ساعة');
    expect(relativeTime(at(24 * 3_600_000), now)).toBe('قبل يوم');
    expect(relativeTime(at(3 * 24 * 3_600_000), now)).toBe('قبل 3 أيام');
  });

  it('falls back to the date after a week, and to nothing for garbage', () => {
    expect(relativeTime(at(8 * 24 * 3_600_000), now)).toBe(formatDate(at(8 * 24 * 3_600_000)));
    expect(relativeTime('not-a-date', now)).toBe('');
  });
});
