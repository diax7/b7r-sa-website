import type { EntityRef } from '@/modules/cms/admin/icons';

/**
 * The components a config registers on its document views (ADR-044, ADR-046). Payload 3 puts
 * a global's document components under `admin.components.elements` and a collection's under
 * `admin.components.edit`, with the description slot at `admin.components.Description` for
 * collections (shared by the list and edit views) and under `elements` for globals;
 * `tests/admin-config.test.ts` checks every config. A fresh object per config: Payload's
 * types want mutable arrays, and nineteen configs must not share one.
 */
const LOCALE_NOTE = '@/modules/cms/admin/document/locale-note#LocaleNote';
const ENTITY_HEADER = '@/modules/cms/admin/document/entity-header#EntityHeader';

function header(entity: EntityRef) {
  return { path: ENTITY_HEADER, serverProps: { entity } };
}

/** `admin.components` of a global: its header, and the locale note when it has per-language fields. */
export function globalComponents(slug: EntityRef['slug'], opts: { localized: boolean }) {
  const entity: EntityRef = { type: 'globals', slug };
  return {
    elements: {
      Description: header(entity),
      ...(opts.localized ? { beforeDocumentControls: [LOCALE_NOTE] } : {}),
    },
  };
}

/** `admin.components` of a collection: its header, and the locale note when it has per-language fields. */
export function collectionComponents(slug: EntityRef['slug'], opts: { localized: boolean }) {
  const entity: EntityRef = { type: 'collections', slug };
  return {
    Description: header(entity),
    ...(opts.localized ? { edit: { beforeDocumentControls: [LOCALE_NOTE] } } : {}),
  };
}

export const LOCALE_NOTE_PATH = LOCALE_NOTE;
export const ENTITY_HEADER_PATH = ENTITY_HEADER;
