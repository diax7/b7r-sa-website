import type { PayloadRequest, ServerProps } from 'payload';
import { navGroups, navPrefs } from '@/modules/cms/admin/nav/groups';
import { NavClient } from '@/modules/cms/admin/nav/nav-client';

/**
 * The sidebar (`admin.components.Nav`, ADR-039, ADR-058). Server side: the entities this
 * user may open in the five task groups, the action badges, and the remembered state of the
 * sidebar and its groups; the client renders one tree (open, or the drawer), the rail of
 * groups when collapsed, and the keyboard model. Payload's outer `nav` classes are kept so
 * the template's grid and the open/closed state stay Payload's (see nav-client.tsx).
 */
export async function Nav(props: ServerProps & { req?: PayloadRequest }) {
  const { payload, permissions, user, i18n, req } = props;
  const groups = await navGroups({ payload, permissions, user, i18n, badges: true });
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
