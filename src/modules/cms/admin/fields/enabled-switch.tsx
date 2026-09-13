'use client';

import { useField } from '@payloadcms/ui';
import type { CheckboxFieldClientComponent } from 'payload';
import { useId } from 'react';
import { Switch } from '@/components/ui/switch';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';

/**
 * A section's `enabled` checkbox as a switch with the consequence beside it (design system
 * §1.5): the field's own `admin.description` names what disappears from the site.
 */
export const EnabledSwitch: CheckboxFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError, errorMessage, disabled } = useField<boolean>({ path });
  const id = useId();
  return (
    <FieldShell
      field={field}
      labelId={`${id}-label`}
      descriptionId={`${id}-desc`}
      error={showError ? errorMessage : undefined}
      inline
    >
      <Switch
        checked={Boolean(value)}
        onCheckedChange={(next) => setValue(next)}
        disabled={disabled || readOnly}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        data-admin-switch={path}
        className="mt-0.5"
      />
    </FieldShell>
  );
};
