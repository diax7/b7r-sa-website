import { getTranslation } from '@payloadcms/translations';
import type { I18nClient } from '@payloadcms/translations';
import { Gutter } from '@payloadcms/ui';
import type { AdminViewServerProps, Payload } from 'payload';
import { cn } from '@/lib/cn';
import { riyadh } from '@/lib/riyadh';
import { EngineCard } from '@/modules/ai-content/admin/engine-card';
import { ContentCard, type ContentRow } from '@/modules/cms/admin/dashboard/content-card';
import { contentActions } from '@/modules/cms/admin/dashboard/data';
import { DashboardHeader } from '@/modules/cms/admin/dashboard/header';
import { type DashboardData, readDashboard } from '@/modules/cms/admin/dashboard/read';
import type { ContentSlug } from '@/modules/cms/admin/dashboard/readers';
import { daypartOf, type HandItem, needsAHand, rangeOf } from '@/modules/cms/admin/dashboard/rules';
import { nextLedgerMorning } from '@/modules/cms/admin/dashboard/schedule';
import { EmptySection } from '@/modules/cms/admin/dashboard/section';
import { ServerCard } from '@/modules/cms/admin/dashboard/server-card';
import { dashboardTiles } from '@/modules/cms/admin/dashboard/tile-data';
import { Tiles } from '@/modules/cms/admin/dashboard/tiles';
import { ADMIN_VIEWS } from '@/modules/cms/admin/icons';
import { type AdminStrings, adminStringsFor } from '@/modules/cms/admin/strings';
import { InboxCard } from '@/modules/inbox/admin/inbox-card';
import { TrafficCard } from '@/modules/traffic/admin/traffic-card';
import { AssistantsCard } from '@/modules/visibility/admin/assistants-card';

/** The collection's plural label in the UI language, for the content table and the hand line. */
function labelOf(payload: Payload, i18n: I18nClient, slug: ContentSlug): string {
  const collection = payload.config.collections.find((c) => c.slug === slug);
  return collection ? getTranslation(collection.labels.plural, i18n) : slug;
}

/** The content section's rows and the "needs a hand" items, from what was read. */
function shapeContent(
  data: DashboardData,
  args: { payload: Payload; i18n: I18nClient; adminRoute: string; s: AdminStrings },
): { rows: ContentRow[]; hand: HandItem[] } {
  const { payload, i18n, adminRoute, s } = args;
  const label = (slug: ContentSlug) => labelOf(payload, i18n, slug);
  const rows = data.contentCollections.map((collection) => ({
    collection,
    label: label(collection),
    published: data.published?.find((p) => p.collection === collection)?.count ?? null,
    drafts: data.drafts?.find((d) => d.collection === collection)?.waiting ?? null,
    missingEnglish: data.missingEnglish?.find((m) => m.collection === collection) ?? null,
  }));
  const hand = needsAHand(
    {
      failedRuns: data.failedRuns ?? null,
      connections: data.connections ?? null,
      missingEnglish: data.missingEnglish ?? null,
      drafts: data.drafts?.map((d) => ({ ...d, label: label(d.collection) })) ?? null,
    },
    s.dashboard.hand,
    adminRoute,
  );
  return { rows, hand };
}

/**
 * The admin home (`admin.components.views.dashboard`, ADR-039, ADR-059): eight sections, top
 * to bottom, answering "how is the site doing and what needs me": the greeting with the range
 * and the "needs a hand" line; four numbers at a glance; where visits come from; what the
 * assistants say; the inbox beside the content (ADR-061); the engine and the spend; the
 * server (collapsed). One server render, the reads in parallel (`read.ts`), each guarded: a
 * failed reader shows its section with the "not available" word, a reader the user may not
 * run leaves no section behind.
 */
export async function Dashboard(props: AdminViewServerProps) {
  const { payload, i18n, initPageResult, user, searchParams } = props;
  const { permissions, req } = initPageResult;
  const language = i18n.language;
  const s = adminStringsFor(language);
  const adminRoute = payload.config.routes.admin;
  const now = new Date();
  const days = rangeOf(searchParams?.['days']);
  const data = await readDashboard({ payload, req, user, permissions, i18n, days, now });
  const { rows, hand } = shapeContent(data, { payload, i18n, adminRoute, s });
  const actions = contentActions({ permissions, adminRoute, language });
  const saves = (data.recent ?? []).filter((i) => i.savedBy !== null || i.status === 'draft');
  const home = actions.home
    ? { action: actions.home, item: data.recent?.find((i) => i.key === 'g-home') ?? null }
    : null;
  const tiles = dashboardTiles({ days, adminRoute, language, ...data });
  const nextRun =
    data.ledger && data.connections
      ? nextLedgerMorning({
          prompts: data.ledger.prompts,
          connections: data.connections.filter((c) => c.enabled).map((c) => c.id),
          now,
        })
      : null;
  const name = String(user?.['name'] ?? user?.email ?? '');
  const { traffic, ledger, engine, health, inbox } = data;
  return (
    <Gutter>
      <div
        className="flex flex-col gap-8 pb-2"
        data-admin-ui=""
        data-admin-dashboard=""
        data-admin-dashboard-days={days}
      >
        <DashboardHeader
          name={name}
          daypart={daypartOf(riyadh(now).hour)}
          days={days}
          adminRoute={adminRoute}
          hand={hand}
          language={language}
        />
        {tiles.length > 0 && <Tiles tiles={tiles} />}
        {(traffic !== undefined || ledger !== undefined) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {traffic === null && (
              <EmptySection
                hook="visits"
                title={s.traffic.card.title}
                hue="pink"
                language={language}
              />
            )}
            {traffic && (
              <TrafficCard
                summary={traffic.current}
                href={`${adminRoute}${ADMIN_VIEWS.traffic.path}?days=${days}`}
                language={language}
              />
            )}
            {ledger === null && (
              <EmptySection
                hook="assistants"
                title={s.dashboard.assistants.title}
                hue="pink"
                language={language}
              />
            )}
            {ledger && (
              <AssistantsCard
                reading={ledger}
                nextRun={nextRun}
                href={`${adminRoute}${ADMIN_VIEWS.visibility.path}`}
                adminRoute={adminRoute}
                language={language}
                now={now}
              />
            )}
          </div>
        )}
        {/* The inbox before the content (ADR-061): a third of the row beside it on a desktop,
            above it when stacked; the row is the content alone for a user without the inbox.
            The tracks are `minmax(0, …)`: an `auto` track would grow to a truncated title's
            full width and push a phone sideways. */}
        <div
          className={cn(
            'grid grid-cols-1 gap-6',
            inbox !== undefined && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]',
          )}
        >
          {inbox === null && (
            <EmptySection
              hook="inbox"
              title={s.dashboard.inbox.title}
              hue="blue"
              language={language}
            />
          )}
          {inbox && (
            <InboxCard reading={inbox} adminRoute={adminRoute} language={language} now={now} />
          )}
          <ContentCard
            rows={rows}
            home={home}
            saves={saves}
            actions={actions.buttons}
            adminRoute={adminRoute}
            language={language}
            now={now}
          />
        </div>
        {engine === null && (
          <EmptySection
            hook="engine"
            title={s.engine.card.title}
            hue="violet"
            language={language}
          />
        )}
        {engine && (
          <EngineCard
            summary={engine}
            connections={data.connections ?? null}
            adminRoute={adminRoute}
            language={language}
            now={now}
          />
        )}
        {health === null && (
          <EmptySection
            hook="server"
            title={s.dashboard.health.title}
            hue="slate"
            language={language}
          />
        )}
        {health && <ServerCard report={health} language={language} now={now} />}
      </div>
    </Gutter>
  );
}
