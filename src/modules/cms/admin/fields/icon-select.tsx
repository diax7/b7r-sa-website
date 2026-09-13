'use client';

import { useField } from '@payloadcms/ui';
import type { SelectFieldClientComponent } from 'payload';
import { useId } from 'react';
import { Icon } from '@/components/shared/icon';
import { ChoiceGrid } from '@/modules/cms/admin/fields/choice-grid';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';
import { WIDGET_ICONS } from '@/modules/cms/admin/icons';

const optionValue = (o: { value: string } | string) => (typeof o === 'string' ? o : o.value);

/** A select of lucide icon names shown as the icons themselves. */
export const IconSelect: SelectFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError, errorMessage, disabled } = useField<string>({ path });
  const id = useId();
  const choices = field.options.map((o) => {
    const name = optionValue(o);
    const Glyph = WIDGET_ICONS[name];
    return { value: name, label: name, art: Glyph ? <Icon icon={Glyph} size={22} /> : null };
  });
  return (
    <FieldShell
      field={field}
      labelId={`${id}-label`}
      descriptionId={`${id}-desc`}
      error={showError ? errorMessage : undefined}
    >
      <ChoiceGrid
        choices={choices}
        value={value}
        onChange={(next) => setValue(next)}
        disabled={disabled || readOnly}
        labelId={`${id}-label`}
        describedBy={`${id}-desc`}
      />
    </FieldShell>
  );
};
