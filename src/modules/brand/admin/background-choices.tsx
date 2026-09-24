'use client';

import { useField } from '@payloadcms/ui';
import { useId } from 'react';
import type { BackgroundChoicesData } from '@/modules/brand/admin/background-options';
import type { SampleColours } from '@/modules/brand/admin/sample-colours';
import { type Choice, ChoiceGrid } from '@/modules/cms/admin/fields/choice-grid';
import { FieldShell, type ShellField } from '@/modules/cms/admin/fields/field-shell';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/** A line of text and a link, drawn in a set's own colours on its background. */
function Swatch({ colours }: { colours: SampleColours }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-12 flex-col items-start justify-center gap-1 rounded-inner border border-border px-2"
      style={colours.background}
    >
      <span className="h-1 w-7 rounded-pill" style={{ backgroundColor: colours.text }} />
      <span className="h-1 w-4 rounded-pill" style={{ backgroundColor: colours.link }} />
    </span>
  );
}

/** The section's own: half white, half light grey, since it is one of the two. */
function OwnSwatch({ halves }: { halves: BackgroundChoicesData['own'] }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-12 overflow-hidden rounded-inner border border-border"
    >
      <span className="h-full flex-1" style={halves[0]} />
      <span className="h-full flex-1" style={halves[1]} />
    </span>
  );
}

/**
 * A section's background (spec 010, phase 2): the section's own first, then every set as a
 * swatch in its own colours. A key whose set was deleted under Appearance is named under the
 * choices, with what the section shows meanwhile (its own background).
 */
export function BackgroundChoices({
  field,
  path,
  readOnly,
  own,
  options,
}: BackgroundChoicesData & {
  field: ShellField;
  path: string;
  readOnly?: boolean | undefined;
}) {
  const s = useAdminStrings().appearance.background;
  const { value, setValue, showError, errorMessage, disabled } = useField<string | null>({ path });
  const id = useId();
  const current = value ?? '';
  const known = current === '' || options.some((option) => option.key === current);
  const choices: Choice[] = [
    { value: '', label: s.own, art: <OwnSwatch halves={own} /> },
    ...options.map((option) => ({
      value: option.key,
      label: option.name,
      art: <Swatch colours={option.colours} />,
    })),
  ];
  return (
    <FieldShell
      field={field}
      labelId={`${id}-label`}
      descriptionId={`${id}-desc`}
      error={showError ? errorMessage : undefined}
    >
      <ChoiceGrid
        choices={choices}
        value={current}
        onChange={(next) => setValue(next === '' ? null : next)}
        disabled={disabled || readOnly}
        labelId={`${id}-label`}
        describedBy={`${id}-desc`}
      />
      {!known && (
        <p className="text-caption text-warning" data-admin-background-gone="">
          {s.gone.replace('{key}', current)}
        </p>
      )}
    </FieldShell>
  );
}
