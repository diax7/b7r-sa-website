import type { PayloadRequest, ServerProps } from 'payload';
import { navGroups, navPrefs } from '@/modules/cms/admin/nav/groups';
import { NavClient } from '@/modules/cms/admin/nav/nav-client';

/**
 * The sidebar (`admin.components.Nav`, ADR-039). Server side: the entities this user may
 * open, grouped like Payload groups them, plus the remembered group state; the client renders
 * them with an icon per entity. Payload's outer `nav` classes are kept so the template's
 * layout and the mobile slide-in keep working (see nav-client.tsx).
 */
export async function Nav(props: ServerProps & { req?: PayloadRequest }) {
  const { payload, permissions, user, i18n, req } = props;
  const groups = navGroups({ payload, permissions, user, i18n });
  const prefs = await navPrefs(req);
  const account = user
    ? {
        name: String(user['name'] ?? user.email ?? ''),
        email: String(user.email ?? ''),
        role: String(user['role'] ?? ''),
      }
    : null;
  return (
    <NavClient
      groups={groups}
      prefs={prefs}
      account={account}
      adminRoute={payload.config.routes.admin}
    />
  );
}
