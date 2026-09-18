'use client';

import { getTranslation } from '@payloadcms/translations';
import { useField, useTranslation } from '@payloadcms/ui';
import type {
  CheckboxFieldClient,
  DateFieldClient,
  EmailFieldClient,
  NumberFieldClient,
  RadioFieldClient,
  SelectFieldClient,
  StaticLabel,
  TextareaFieldClient,
  TextFieldClient,
} from 'payload';
import { useId } from 'react';
import { formatDate } from '@/modules/cms/admin/dashboard/relative-time';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';
import { adminStrings } from '@/modules/cms/admin/strings';

const words = adminStrings.cells;

type Option = string | { value: string; label: StaticLabel | string };
type Translate = (label: StaticLabel | string) => string;

/** The field types a value of which reads as one line (`describeFields` attaches the widget to these). */
export type ScalarField =
  | CheckboxFieldClient
  | DateFieldClient
  | EmailFieldClient
  | NumberFieldClient
  | RadioFieldClient
  | SelectFieldClient
  | TextareaFieldClient
  | TextFieldClient;

/** A date as the panel writes it, with the time when the field shows one. */
function dateText(value: unknown, withTime: boolean): string | null {
  const date = typeof value === 'string' || value instanceof Date ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const day = formatDate(date);
  if (!withTime) return day;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${hh}:${mm}`;
}

/**
 * The text a read-only field's value reads as: a number in Western digits, a date as
 * dd/MM/yyyy (with the time when the picker had one), a checkbox as the list's Yes / No or
 * On / Off words, a select as its option's label, text as it is; nothing for an empty value.
 */
export function readOnlyText(
  field: ScalarField,
  value: unknown,
  translate: Translate,
): string | null {
  if (value === undefined || value === null || value === '') return null;
  switch (field.type) {
    case 'checkbox': {
      const pair = field.name === 'enabled' ? words.onOff : words.yesNo;
      return value === true ? pair[0] : value === false ? pair[1] : null;
    }
    case 'number':
      return typeof value === 'number'
        ? new Intl.NumberFormat('en', { maximumFractionDigits: 4 }).format(value)
        : String(value);
    case 'date':
      return dateText(
        value,
        (field.admin?.date as { pickerAppearance?: string } | undefined)?.pickerAppearance !==
          'dayOnly',
      );
    case 'select':
    case 'radio': {
      const options = (field.options ?? []) as Option[];
      const match = options.find((o) => (typeof o === 'string' ? o : o.value) === String(value));
      return match === undefined
        ? String(value)
        : typeof match === 'string'
          ? match
          : translate(match.label);
    }
    default:
      return String(value);
  }
}

/**
 * A read-only field as one line of text (admin audit 2026-09-18, 2.11, 2.12): the label and
 * the description as on every widget, the value as words, never a disabled input, a date
 * picker with a clear button or a greyed checkbox. `describeFields()` attaches it to every
 * read-only scalar field, so a log row (a run, a citation, a count) reads as a card and the
 * connection's sidebar as a summary.
 */
export function ReadOnlyLine({ field, path }: { field: ScalarField; path: string }) {
  const id = useId();
  const { i18n } = useTranslation();
  const { value } = useField<unknown>({ path });
  const text = readOnlyText(field, value, (label) =>
    typeof label === 'string' ? label : getTranslation(label, i18n),
  );
  return (
    <FieldShell field={field} labelId={`${id}-label`} descriptionId={`${id}-desc`}>
      {text !== null && (
        <span
          dir="auto"
          aria-labelledby={`${id}-label`}
          className="text-small break-words text-text"
          data-admin-read-only={field.name}
        >
          {text}
        </span>
      )}
    </FieldShell>
  );
}
