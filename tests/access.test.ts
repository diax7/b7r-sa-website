import type { PayloadRequest } from 'payload';
import { describe, expect, it } from 'vitest';
import {
  adminField,
  canDeleteVersioned,
  isAdmin,
  isAdminOrSelf,
  isEditorOrAdmin,
  publishedOrStaff,
  roleOf,
} from '@/modules/cms/access';

type Actor = 'anonymous' | 'editor' | 'admin';

function req(actor: Actor, id = 7): PayloadRequest {
  const user = actor === 'anonymous' ? null : { id, role: actor };
  return { user } as unknown as PayloadRequest;
}

const run = (access: (args: { req: PayloadRequest }) => unknown, actor: Actor) =>
  access({ req: req(actor) });

describe('CMS access (BRD 9.3): admin does everything, editor edits content only', () => {
  it('reads the role from the request user', () => {
    expect(roleOf(req('anonymous'))).toBeNull();
    expect(roleOf(req('editor'))).toBe('editor');
    expect(roleOf(req('admin'))).toBe('admin');
  });

  it.each<[Actor, boolean, boolean]>([
    ['anonymous', false, false],
    ['editor', false, true],
    ['admin', true, true],
  ])('%s: isAdmin=%s isEditorOrAdmin=%s', (actor, admin, staff) => {
    expect(run(isAdmin, actor)).toBe(admin);
    expect(run(isEditorOrAdmin, actor)).toBe(staff);
    expect(run(adminField, actor)).toBe(admin);
  });

  it('lets anonymous readers see published documents only, staff see drafts', () => {
    expect(run(publishedOrStaff, 'anonymous')).toEqual({ _status: { equals: 'published' } });
    expect(run(publishedOrStaff, 'editor')).toBe(true);
    expect(run(publishedOrStaff, 'admin')).toBe(true);
  });

  it('lets editors delete drafts but never a published document', () => {
    expect(run(canDeleteVersioned, 'anonymous')).toBe(false);
    expect(run(canDeleteVersioned, 'editor')).toEqual({ _status: { not_equals: 'published' } });
    expect(run(canDeleteVersioned, 'admin')).toBe(true);
  });

  it('scopes users to themselves unless admin', () => {
    expect(run(isAdminOrSelf, 'anonymous')).toBe(false);
    expect(isAdminOrSelf({ req: req('editor', 42) })).toEqual({ id: { equals: 42 } });
    expect(run(isAdminOrSelf, 'admin')).toBe(true);
  });
});
