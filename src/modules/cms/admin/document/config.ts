import type { EntityRef } from '@/modules/cms/admin/icons';

/**
 * The components a config registers on its document views (ADR-044, ADR-046). Payload 3 puts
 * a global's document components under `admin.components.elements` and a collection's under
 * `admin.components.edit`, with the description slot at `admin.components.Description` for
 * collections (shared by the list and edit views) and under `elements` for globals;
 * `tests/admin-config.test.ts` checks every config. A fresh object per config: Payload's
 * types want mutable arrays, and nineteen configs must not share one.
 *
 * Before the document controls, first, the form-modified sentinel (ADR-056, amended
 * 2026-09-19): it tells the header's language switch to ask before a refresh that would
 * drop unsaved changes. An entity's own action there (Generate now, Test connection) comes
 * after it, passed in as `beforeDocumentControls`.
 */
const ENTITY_HEADER = '@/modules/cms/admin/document/entity-header#EntityHeader';
const FORM_MODIFIED = '@/modules/cms/admin/document/form-modified#FormModifiedSentinel';

type Extras = { beforeDocumentControls?: string[] };

function header(entity: EntityRef) {
  return { path: ENTITY_HEADER, serverProps: { entity } };
}

function beforeControls(extras: Extras) {
  return [FORM_MODIFIED, ...(extras.beforeDocumentControls ?? [])];
}

/** `admin.components` of a global: its header, the sentinel and its own actions before the controls. */
export function globalComponents(slug: EntityRef['slug'], extras: Extras = {}) {
  const entity: EntityRef = { type: 'globals', slug };
  return {
    elements: { Description: header(entity), beforeDocumentControls: beforeControls(extras) },
  };
}

/** `admin.components` of a collection: its header, the sentinel and its own actions before the controls. */
export function collectionComponents(slug: EntityRef['slug'], extras: Extras = {}) {
  const entity: EntityRef = { type: 'collections', slug };
  return {
    Description: header(entity),
    edit: { beforeDocumentControls: beforeControls(extras) },
  };
}

export const ENTITY_HEADER_PATH = ENTITY_HEADER;
export const FORM_MODIFIED_PATH = FORM_MODIFIED;
