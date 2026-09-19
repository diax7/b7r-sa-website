import type { Field } from 'payload';

/** The list cell that draws a status as a pill with its word (ADR-060). */
export const STATUS_CELL = '@/modules/cms/admin/fields/status-cell#StatusCell';

/**
 * The `_status` column of a drafted collection with our cell (ADR-060). Payload adds the
 * `_status` select itself when `versions.drafts` is on and deep-merges a same-named field
 * of the config over its base (`fields/mergeBaseFields.js`), so this carries the cell and
 * nothing of its own: the options and `Field: false` (out of the form) stay Payload's.
 * Two keys are Payload's own, re-stated because `sanitizeFields` runs before the merge
 * (`collections/config/sanitize.js`): it throws on a field without a `type`, and it stamps
 * a `label` from the name («_status») onto a field without one, which would then win the
 * merge; the label is therefore the base's own `version:status`. The cast is for the
 * options the base supplies. The list then reads Published, Draft or Changed in its
 * colour, the third from Payload's `_displayStatus` (a draft over a published version,
 * `enrichDocsWithVersionStatus`).
 */
export function statusColumn(): Field {
  return {
    name: '_status',
    type: 'select',
    label: ({ t }) => t('version:status'),
    admin: { components: { Cell: STATUS_CELL } },
  } as Field;
}

/** Whether a field is the status column (Payload's own, merged): the census leaves it out. */
export const isStatusColumn = (field: Field): boolean =>
  'name' in field && field.name === '_status';
