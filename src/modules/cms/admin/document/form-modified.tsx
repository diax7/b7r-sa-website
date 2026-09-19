'use client';

import { useFormModified } from '@payloadcms/ui';
import { useEffect, useId } from 'react';

/** On `<body>` while any document form on the page holds unsaved changes. */
export const FORM_MODIFIED_ATTR = 'data-admin-form-modified';

/** The forms that are modified right now: one page can hold two (a document drawer over an edit view). */
const modifiedForms = new Set<string>();

function reflect() {
  document.body.toggleAttribute(FORM_MODIFIED_ATTR, modifiedForms.size > 0);
}

/**
 * Inside a document's form (the `beforeDocumentControls` slot every config registers
 * through `admin/document/config.ts`), mirrors Payload's `useFormModified` onto `<body>`
 * as `data-admin-form-modified`, so a control outside the form (the header's language
 * switch, ADR-056) can ask before a refresh that would drop the unsaved changes: Payload's
 * form takes the server's state again on every `router.refresh()`. Nothing is rendered;
 * an unmount (leaving the edit view) takes its form off the count, so no stale flag stays.
 */
export function FormModifiedSentinel() {
  const id = useId();
  const modified = useFormModified();
  useEffect(() => {
    if (modified) modifiedForms.add(id);
    else modifiedForms.delete(id);
    reflect();
    return () => {
      modifiedForms.delete(id);
      reflect();
    };
  }, [id, modified]);
  return null;
}
