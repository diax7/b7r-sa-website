'use client';

/* eslint-disable @next/next/no-img-element -- the brand SVGs are static files */
import { getTranslation } from '@payloadcms/translations';
import { useField, useTranslation } from '@payloadcms/ui';
import type { SelectFieldClientComponent, StaticLabel } from 'payload';
import { useId } from 'react';
import { ChoiceGrid } from '@/modules/cms/admin/fields/choice-grid';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';

/**
 * The platform select as logo tiles: the value picks the SVG that ships with the site, the
 * option's label names it («سلة», Salla).
 */
export const PlatformSelect: SelectFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError, errorMessage, disabled } = useField<string>({ path });
  const { i18n } = useTranslation();
  const id = useId();
  const choices = field.options.map((o) => {
    const platform = typeof o === 'string' ? o : o.value;
    return {
      value: platform,
      label: typeof o === 'string' ? o : getTranslation(o.label as StaticLabel, i18n),
      art: (
        <img
          src={`/images/integrations/${platform}.svg`}
          alt=""
          width={72}
          height={28}
          className="h-7 w-auto rounded-inner bg-white px-1"
        />
      ),
    };
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
