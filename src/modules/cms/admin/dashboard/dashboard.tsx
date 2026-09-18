import { Gutter } from '@payloadcms/ui';
import type { AdminViewServerProps } from 'payload';
import { healthReport } from '@/lib/cms/health';
import { EngineCard, engineSummary } from '@/modules/ai-content/admin/engine-card';
import { quickActions, recentActivity } from '@/modules/cms/admin/dashboard/data';
import { HealthCard } from '@/modules/cms/admin/dashboard/health-card';
import { QuickActions } from '@/modules/cms/admin/dashboard/quick-actions';
import { RecentActivity } from '@/modules/cms/admin/dashboard/recent-activity';
import { adminStringsFor } from '@/modules/cms/admin/strings';
import { TrafficCard } from '@/modules/traffic/admin/traffic-card';
import { trafficSummary } from '@/modules/traffic/summary';
import { VisibilityCard } from '@/modules/visibility/admin/visibility-card';
import { reading } from '@/modules/visibility/reading';

/**
 * The admin home (`admin.components.views.dashboard`, ADR-039). Payload's template and
 * header wrap it; this renders three answers to "what do I do now?": quick actions, the
 * system's health (the same report as `/api/health`, no HTTP hop) and the latest saves; for
 * an admin, the week's traffic (ADR-048) and the content engine too. Everything reads in
 * the UI language of the request (ADR-056), handed down as `language`.
 */
export async function Dashboard(props: AdminViewServerProps) {
  const { payload, i18n, initPageResult, user } = props;
  const { permissions, req } = initPageResult;
  const language = i18n.language;
  const s = adminStringsFor(language).dashboard;
  const adminRoute = payload.config.routes.admin;
  // The engine and traffic cards are for admins (the settings global and the count are theirs alone).
  const engineAllowed = permissions?.globals?.['ai-settings']?.read === true;
  const trafficAllowed = permissions?.collections?.['traffic']?.read === true;
  const scoreAllowed = permissions?.globals?.['visibility-checklist']?.read === true;
  const [health, recent, engine, traffic, score] = await Promise.all([
    healthReport(),
    recentActivity({ payload, req, user, permissions, i18n }),
    engineAllowed ? engineSummary(payload) : Promise.resolve(null),
    trafficAllowed ? trafficSummary(payload, { days: 7 }) : Promise.resolve(null),
    scoreAllowed ? reading(payload, { user: user ?? null }) : Promise.resolve(null),
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
        <QuickActions
          actions={quickActions({ permissions, adminRoute, language })}
          title={s.quick}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentActivity items={recent} language={language} />
          <HealthCard report={health} language={language} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {score && (
            <VisibilityCard
              score={score.score}
              href={`${adminRoute}/visibility`}
              language={language}
            />
          )}
          {traffic && (
            <TrafficCard summary={traffic} href={`${adminRoute}/traffic`} language={language} />
          )}
          {engine && <EngineCard summary={engine} adminRoute={adminRoute} language={language} />}
        </div>
      </div>
    </Gutter>
  );
}
