import type { ViewSlug } from '@/modules/cms/admin/icons';

/**
 * The Payload side of `ADMIN_VIEWS` (ADR-048): each view's component and path, spread into
 * `admin.components.views` by the config. `tests/admin-config.test.ts` holds the two keyed
 * alike. A component gates itself with `adminView()` (`views/gate.tsx`): Payload renders a
 * custom view with a `path` for anyone.
 */
export const ADMIN_VIEW_COMPONENTS: Record<
  ViewSlug,
  { Component: string; path: `/${string}`; exact: true }
> = {
  traffic: {
    Component: '@/modules/traffic/admin/traffic-view#TrafficView',
    path: '/traffic',
    exact: true,
  },
  visibility: {
    Component: '@/modules/visibility/admin/visibility-view#VisibilityView',
    path: '/visibility',
    exact: true,
  },
};
