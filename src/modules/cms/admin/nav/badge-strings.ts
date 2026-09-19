import type { NavBadgeKind } from '@/modules/cms/admin/nav/badges';
import type { AdminStrings } from '@/modules/cms/admin/strings';

/** The sentence a badge reads out, per kind, in the language of the render. */
export type BadgeStrings = Record<NavBadgeKind, (n: number) => string>;

/**
 * The runs', the drafts' and the inbox's sentences are the dashboard's own
 * (`hand.failedRuns`, `tiles.drafts`, `inbox.newMessages`), as their numbers are its
 * readers (ADR-058, ADR-059, ADR-061): one number, one sentence, in the sidebar and on the
 * dashboard alike.
 */
export function badgeStrings(s: AdminStrings): BadgeStrings {
  return {
    failedRuns: s.dashboard.hand.failedRuns,
    drafts: s.dashboard.tiles.drafts,
    overLimit: s.nav.badges.overLimit,
    inbox: s.dashboard.inbox.newMessages,
  };
}
