import { Gutter } from '@payloadcms/ui';
import type { AdminViewServerProps } from 'payload';
import { healthReport } from '@/lib/cms/health';
import { quickActions, recentActivity } from '@/modules/cms/admin/dashboard/data';
import { HealthCard } from '@/modules/cms/admin/dashboard/health-card';
import { QuickActions } from '@/modules/cms/admin/dashboard/quick-actions';
import { RecentActivity } from '@/modules/cms/admin/dashboard/recent-activity';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.dashboard;

/**
 * The admin home (`admin.components.views.dashboard`, ADR-039). Payload's template and
 * header wrap it; this renders three answers to "what do I do now?": quick actions, the
 * system's health (the same report as `/api/health`, no HTTP hop) and the latest saves.
 */
export async function Dashboard(props: AdminViewServerProps) {
  const { payload, i18n, initPageResult, user } = props;
  const { permissions, req } = initPageResult;
  const adminRoute = payload.config.routes.admin;
  const [health, recent] = await Promise.all([
    healthReport(),
    recentActivity({ payload, req, user, permissions, i18n }),
  ]);
  const name = String(user?.['name'] ?? user?.email ?? '');
  return (
    <Gutter>
      <div className="flex flex-col gap-8 py-2" data-admin-ui="" data-admin-dashboard="">
        <header className="flex flex-col gap-1">
          <h1 className="text-h2 text-text">{s.greeting.replace('{name}', name)}</h1>
          <p className="text-small text-text-muted">{s.intro}</p>
        </header>
        <QuickActions actions={quickActions({ permissions, adminRoute })} />
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentActivity items={recent} />
          <HealthCard report={health} />
        </div>
      </div>
    </Gutter>
  );
}
