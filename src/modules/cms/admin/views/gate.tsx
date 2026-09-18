import type { AdminViewServerProps, TypedUser } from 'payload';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { formatAdminURL } from 'payload/shared';
import { roleOf } from '@/modules/cms/access';
import { adminStringsFor } from '@/modules/cms/admin/strings';
import { AdminShell } from '@/modules/cms/admin/views/shell';

/**
 * The gate every custom view of ours passes first (ADR-048). Payload 3 renders a custom view
 * with a `path` for anyone, signed in or not, and hands it no `user` prop; the request
 * carries the signed-in one. So: nobody signed in → the login page with the way back; a user
 * who is not an admin → the "Admins only" sentence inside the shell, returned for the view to
 * render; an admin → null, the view goes on. One call, so a view cannot forget the second
 * half. Reads inside the view run with the user's access, never `overrideAccess`. The view
 * itself renders inside `AdminShell` (the sidebar, the header, the step nav): a custom view
 * that skips it stands outside the admin.
 */
export function adminView(
  props: AdminViewServerProps,
  path: `/${string}`,
  title: string,
): ReactNode | null {
  const adminRoute = props.payload.config.routes.admin;
  if (!viewUser(props)) {
    const back = encodeURIComponent(formatAdminURL({ adminRoute, path }));
    redirect(`${formatAdminURL({ adminRoute, path: '/login' })}?redirect=${back}`);
  }
  return roleOf(props.initPageResult.req) === 'admin' ? null : (
    <AdminShell props={props} title={title}>
      <AdminsOnly language={viewLanguage(props)} />
    </AdminShell>
  );
}

/** The signed-in user behind a custom view, or null. */
export function viewUser(props: AdminViewServerProps): TypedUser | null {
  return props.initPageResult.req.user ?? null;
}

/** The UI language Payload resolved for the request behind a custom view (ADR-056). */
export function viewLanguage(props: AdminViewServerProps): string {
  return props.initPageResult.req.i18n.language;
}

/** What a signed-in editor sees on an admins-only page. */
function AdminsOnly({ language }: { language: string }) {
  const s = adminStringsFor(language).views;
  return (
    <div className="flex flex-col gap-2 py-8" data-admin-ui="" data-admin-view-refused="">
      <h1 className="text-h3 text-text">{s.adminsOnlyTitle}</h1>
      <p className="text-small text-text-muted">{s.adminsOnly}</p>
    </div>
  );
}
