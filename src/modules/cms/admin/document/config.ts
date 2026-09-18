import type { EntityRef } from '@/modules/cms/admin/icons';

/**
 * The components a config registers on its document views (ADR-044, ADR-046). Payload 3 puts
 * a global's document components under `admin.components.elements` and a collection's under
 * `admin.components.edit`, with the description slot at `admin.components.Description` for
 * collections (shared by the list and edit views) and under `elements` for globals;
 * `tests/admin-config.test.ts` checks every config. A fresh object per config: Payload's
 * types want mutable arrays, and nineteen configs must not share one.
 */
const ENTITY_HEADER = '@/modules/cms/admin/document/entity-header#EntityHeader';

function header(entity: EntityRef) {
  return { path: ENTITY_HEADER, serverProps: { entity } };
}

/** `admin.components` of a global: its header. */
export function globalComponents(slug: EntityRef['slug']) {
  const entity: EntityRef = { type: 'globals', slug };
  return { elements: { Description: header(entity) } };
}

/** `admin.components` of a collection: its header. */
export function collectionComponents(slug: EntityRef['slug']) {
  const entity: EntityRef = { type: 'collections', slug };
  return { Description: header(entity) };
}

export const ENTITY_HEADER_PATH = ENTITY_HEADER;
