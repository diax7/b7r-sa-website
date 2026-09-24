'use client';

import { getTranslation } from '@payloadcms/translations';
import { useField, useTranslation } from '@payloadcms/ui';
import type { StaticLabel, TextFieldClientComponent } from 'payload';
import { useId } from 'react';
import { Input } from '@/components/shared/input';
import { HERO_OVERLAY_DEFAULT, HEX_COLOR } from '@/content/schema';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/**
 * A colour as a text field (`#rrggbb`) with the browser's colour picker beside it (ADR-044:
 * the hero overlay's colour; the Appearance screen's five brand colours, spec 010). The text
 * is the value; the picker writes into it. The picker's name carries the field's label, so a
 * screen of several pickers never reads "Pick a colour" five times.
 */
export const ColorField: TextFieldClientComponent = ({ field, path, readOnly }) => {
  const s = useAdminStrings().fields;
  const { i18n } = useTranslation();
  const label = field.label ? getTranslation(field.label as StaticLabel, i18n) : '';
  const { value, setValue, showError, errorMessage, disabled } = useField<string>({ path });
  const id = useId();
  const text = value ?? '';
  const off = disabled || readOnly;
  return (
    <FieldShell
      field={field}
      labelId={`${id}-label`}
      descriptionId={`${id}-desc`}
      error={showError ? errorMessage : undefined}
    >
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={HEX_COLOR.test(text) ? text.toLowerCase() : HERO_OVERLAY_DEFAULT}
          onChange={(e) => setValue(e.target.value)}
          disabled={off}
          aria-label={label ? `${label}: ${s.pickColor}` : s.pickColor}
          className="size-11 shrink-0 cursor-pointer rounded-inner border border-border bg-surface p-1 disabled:cursor-default"
          data-admin-color-picker={path}
        />
        <Input
          dir="ltr"
          value={text}
          onChange={(e) => setValue(e.target.value)}
          disabled={off}
          invalid={showError}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-desc`}
          spellCheck={false}
          className="max-w-40 tabular"
          data-admin-color-text={path}
        />
      </div>
    </FieldShell>
  );
};
