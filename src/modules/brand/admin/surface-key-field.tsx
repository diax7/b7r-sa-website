'use client';

import { useDocumentInfo, useField, useFormFields } from '@payloadcms/ui';
import type { TextFieldClientComponent } from 'payload';
import { useId } from 'react';
import { Input } from '@/components/shared/input';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';

/** Whether the saved document holds a library row with this id. */
function savedRow(saved: unknown, id: unknown): boolean {
  const rows = (saved as { surfaces?: unknown } | undefined)?.surfaces;
  return Array.isArray(rows) && rows.some((row: { id?: unknown }) => row.id === id);
}

/**
 * A background's key (spec 010, phase 2): typed when the row is new, read-only once saved,
 * since the sections that use the set name it by its key (the save refuses a change too). The
 * row's name stays editable.
 */
export const SurfaceKeyField: TextFieldClientComponent = ({ field, path, readOnly }) => {
  const row = path.replace(/\.key$/, '');
  const rowId = useFormFields(([fields]) => fields[`${row}.id`]?.value);
  const { savedDocumentData } = useDocumentInfo();
  const fixed = savedRow(savedDocumentData, rowId);
  const { value, setValue, showError, errorMessage, disabled } = useField<string>({ path });
  const id = useId();
  return (
    <FieldShell
      field={field}
      labelId={`${id}-label`}
      descriptionId={`${id}-desc`}
      error={showError ? errorMessage : undefined}
    >
      <Input
        dir="ltr"
        value={value ?? ''}
        onChange={(e) => setValue(e.target.value)}
        readOnly={fixed || readOnly}
        disabled={disabled}
        invalid={showError}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        spellCheck={false}
        className="max-w-60"
        data-admin-surface-key={fixed ? 'fixed' : 'open'}
      />
    </FieldShell>
  );
};
