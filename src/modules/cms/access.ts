import type { Access, FieldAccess, PayloadRequest } from 'payload';

/** BRD 9.3 roles: admin does everything; editor edits content, never users/settings. */
export type Role = 'admin' | 'editor';

export interface CmsUser {
  id: number | string;
  role?: Role;
}

/** The signed-in user's role; the sidebar hands only the user, so a request's user is enough. */
export function roleOf(req: Pick<PayloadRequest, 'user'>): Role | null {
  const user = req.user as CmsUser | null | undefined;
  return user?.role ?? null;
}

export const isAdmin: Access = ({ req }) => roleOf(req) === 'admin';

export const isEditorOrAdmin: Access = ({ req }) => {
  const role = roleOf(req);
  return role === 'admin' || role === 'editor';
};

/** Admins see every user; anyone else only their own document. */
export const isAdminOrSelf: Access = ({ req }) => {
  if (roleOf(req) === 'admin') return true;
  const user = req.user as CmsUser | null | undefined;
  return user ? { id: { equals: user.id } } : false;
};

/** Public reads see published documents only; signed-in staff see drafts too. */
export const publishedOrStaff: Access = ({ req }) =>
  roleOf(req) ? true : { _status: { equals: 'published' } };

/**
 * Editors may delete drafts but never a published document (BRD 9.3). Returned as a query
 * constraint so the REST API answers 403 instead of silently deleting nothing.
 */
export const canDeleteVersioned: Access = ({ req }) => {
  const role = roleOf(req);
  if (role === 'admin') return true;
  if (role === 'editor') return { _status: { not_equals: 'published' } };
  return false;
};

/** Field-level: only admins read or change (verification tokens, roles). */
export const adminField: FieldAccess = ({ req }) => roleOf(req) === 'admin';

/** `admin.hidden` for the settings globals: editors do not see them in the panel (BRD 9.3). */
export const hiddenUnlessAdmin = ({ user }: { user: CmsUser | null | undefined }): boolean =>
  user?.role !== 'admin';
