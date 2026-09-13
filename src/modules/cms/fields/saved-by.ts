import type {
  CollectionBeforeChangeHook,
  Field,
  GlobalBeforeChangeHook,
  PayloadRequest,
} from 'payload';

/**
 * Who last saved the live row, as a snapshot (ADR-039): a name and a time, never a
 * relationship, `users.read` is admin-or-self, so an editor would see a bare id for a
 * colleague, and a deleted user would dangle. On versioned collections a draft save never
 * writes the main row, so the field reads as "last published by"; the label says "saved".
 * System writes without a user (the seed, jobs) leave it untouched.
 */
export const SAVED_BY = 'lastSavedBy';

export const savedByField: Field = {
  name: SAVED_BY,
  type: 'group',
  label: { ar: 'آخر حفظ', en: 'Last saved' },
  admin: {
    position: 'sidebar',
    readOnly: true,
    description: {
      ar: 'من حفظ النسخة الحالية ومتى. المسودات لا تغيّره.',
      en: 'Who saved the current version and when. Drafts do not change it.',
    },
  },
  fields: [
    { name: 'name', type: 'text', label: { ar: 'بواسطة', en: 'By' } },
    { name: 'at', type: 'date', label: { ar: 'في', en: 'At' } },
  ],
};

export interface SavedBy {
  name: string;
  at: string;
}

/** The snapshot for this request, or null when no person is behind it. */
export function savedBy(req: PayloadRequest, now = new Date()): SavedBy | null {
  const user = req.user as { name?: unknown; email?: unknown } | null | undefined;
  if (!user) return null;
  const name = typeof user.name === 'string' && user.name.trim() ? user.name : user.email;
  return typeof name === 'string' ? { name, at: now.toISOString() } : null;
}

function stamp(data: Record<string, unknown> | undefined, req: PayloadRequest) {
  const who = savedBy(req);
  if (!data || !who) return data;
  if (data['_status'] === 'draft') return data;
  return { ...data, [SAVED_BY]: who };
}

export const stampSavedBy: CollectionBeforeChangeHook = ({ data, req }) => stamp(data, req);
export const stampSavedByGlobal: GlobalBeforeChangeHook = ({ data, req }) => stamp(data, req);
