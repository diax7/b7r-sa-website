import { Gutter } from '@payloadcms/ui';
import type { AdminViewServerProps } from 'payload';
import { healthReport } from '@/lib/cms/health';
import { EngineCard, engineSummary } from '@/modules/ai-content/admin/engine-card';
import { quickActions, recentActivity } from '@/modules/cms/admin/dashboard/data';
import { HealthCard } from '@/modules/cms/admin/dashboard/health-card';
import { QuickActions } from '@/modules/cms/admin/dashboard/quick-actions';
import { RecentActivity } from '@/modules/cms/admin/dashboard/recent-activity';
import { adminStrings } from '@/modules/cms/admin/strings';
import { TrafficCard } from '@/modules/traffic/admin/traffic-card';
import { trafficSummary } from '@/modules/traffic/summary';

const s = adminStrings.dashboard;

/**
 * The admin home (`admin.components.views.dashboard`, ADR-039). Payload's template and
 * header wrap it; this renders three answers to "what do I do now?": quick actions, the
 * system's health (the same report as `/api/health`, no HTTP hop) and the latest saves; for
 * an admin, the week's traffic (ADR-048) and the content engine too.
 */
export async function Dashboard(props: AdminViewServerProps) {
  const { payload, i18n, initPageResult, user } = props;
  const { permissions, req } = initPageResult;
  const adminRoute = payload.config.routes.admin;
  // The engine and traffic cards are for admins (the settings global and the count are theirs alone).
  const engineAllowed = permissions?.globals?.['ai-settings']?.read === true;
  const trafficAllowed = permissions?.collections?.['traffic']?.read === true;
  const [health, recent, engine, traffic] = await Promise.all([
    healthReport(),
    recentActivity({ payload, req, user, permissions, i18n }),
    engineAllowed ? engineSummary(payload) : Promise.resolve(null),
    trafficAllowed ? trafficSummary(payload, { days: 7 }) : Promise.resolve(null),
  ]);
  const name = String(user?.['name'] ?? user?.email ?? '');
  const [before, after] = s.greeting.split('{name}');
  return (
    <Gutter>
      <div className="flex flex-col gap-8 pb-2" data-admin-ui="" data-admin-dashboard="">
        <header className="flex flex-col gap-1">
          <h1 className="text-h2 text-text">
            {before}
            <span className="text-accent">{name}</span>
            {after}
          </h1>
          <p className="text-small text-text-muted">{s.intro}</p>
        </header>
        <QuickActions actions={quickActions({ permissions, adminRoute })} />
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentActivity items={recent} />
          <HealthCard report={health} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {traffic && <TrafficCard summary={traffic} href={`${adminRoute}/traffic`} />}
          {engine && <EngineCard summary={engine} adminRoute={adminRoute} />}
        </div>
      </div>
    </Gutter>
  );
}
