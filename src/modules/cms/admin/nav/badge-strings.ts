import type { NavBadgeKind } from '@/modules/cms/admin/nav/badges';
import type { AdminStrings } from '@/modules/cms/admin/strings';

/** The sentence a badge reads out, per kind, in the language of the render. */
export type BadgeStrings = Record<NavBadgeKind, (n: number) => string>;

/**
 * The runs', the drafts', the messages' and the bookings' sentences are the dashboard's
 * own (`hand.failedRuns`, `tiles.drafts`, `inbox.newMessages`, `inbox.todayBookings`), as
 * their numbers are its readers (ADR-058, ADR-059, ADR-061, ADR-062 amended): one number,
 * one sentence, in the sidebar and on the dashboard alike.
 */
export function badgeStrings(s: AdminStrings): BadgeStrings {
  return {
    failedRuns: s.dashboard.hand.failedRuns,
    drafts: s.dashboard.tiles.drafts,
    overLimit: s.nav.badges.overLimit,
    newMessages: s.dashboard.inbox.newMessages,
    todayBookings: s.dashboard.inbox.todayBookings,
  };
}
