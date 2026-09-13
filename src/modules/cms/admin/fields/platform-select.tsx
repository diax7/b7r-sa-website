'use client';

/* eslint-disable @next/next/no-img-element -- the brand SVGs are static files */
import { useField } from '@payloadcms/ui';
import type { SelectFieldClientComponent } from 'payload';
import { useId } from 'react';
import { ChoiceGrid } from '@/modules/cms/admin/fields/choice-grid';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';

const NAMES: Record<string, string> = { salla: 'سلة', zid: 'زد', shopify: 'Shopify' };
const optionValue = (o: { value: string } | string) => (typeof o === 'string' ? o : o.value);

/** The platform select as logo tiles: the value picks the SVG that ships with the site. */
export const PlatformSelect: SelectFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError, errorMessage, disabled } = useField<string>({ path });
  const id = useId();
  const choices = field.options.map((o) => {
    const platform = optionValue(o);
    return {
      value: platform,
      label: NAMES[platform] ?? platform,
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
