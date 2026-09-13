import type { PayloadRequest } from 'payload';
import { describe, expect, it } from 'vitest';
import { SAVED_BY, savedBy, stampSavedBy } from '@/modules/cms/fields/saved-by';

const req = (user: unknown) => ({ user }) as unknown as PayloadRequest;
const now = new Date('2026-09-13T12:00:00Z');

describe('lastSavedBy snapshot (ADR-039)', () => {
  it('records the name, or the e-mail when the name is blank; nothing without a person', () => {
    expect(savedBy(req({ name: 'ضياء', email: 'd@b7r.sa' }), now)).toEqual({
      name: 'ضياء',
      at: '2026-09-13T12:00:00.000Z',
    });
    expect(savedBy(req({ name: '  ', email: 'd@b7r.sa' }), now)?.name).toBe('d@b7r.sa');
    expect(savedBy(req(null), now)).toBeNull();
    expect(savedBy(req(undefined), now)).toBeNull();
  });

  it('stamps a publish and a plain save, leaves drafts and system writes untouched', () => {
    const hook = stampSavedBy as unknown as (args: {
      data: Record<string, unknown>;
      req: PayloadRequest;
    }) => Record<string, unknown>;
    const person = req({ name: 'محرر', email: 'e@b7r.sa' });
    expect(
      hook({ data: { title: 'x', _status: 'published' }, req: person })[SAVED_BY],
    ).toMatchObject({ name: 'محرر' });
    expect(hook({ data: { question: 'q' }, req: person })[SAVED_BY]).toMatchObject({
      name: 'محرر',
    });
    expect(hook({ data: { title: 'x', _status: 'draft' }, req: person })[SAVED_BY]).toBeUndefined();
    expect(hook({ data: { title: 'x' }, req: req(null) })[SAVED_BY]).toBeUndefined();
  });
});
