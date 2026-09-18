'use client';

import { getTranslation } from '@payloadcms/translations';
import { useField, useLocale, useTranslation } from '@payloadcms/ui';
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
import { type ReactNode, useId } from 'react';
import { formatDate, formatDateTime, formatNumber } from '@/modules/cms/admin/format';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';
import { LocaleTag } from '@/modules/cms/admin/fields/bilingual/locale-tag';
import { OtherValue } from '@/modules/cms/admin/fields/bilingual/other-value';
import { useOtherLanguage } from '@/modules/cms/admin/fields/bilingual/use-other-language';
import { type AdminStrings, adminStringsFor } from '@/modules/cms/admin/strings';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';
import { readKey } from '@/modules/cms/fields/bilingual';

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

/** A date as the panel writes it (Riyadh, Western digits), with the time when the field shows one. */
function dateText(value: unknown, withTime: boolean, language: string): string | null {
  const date = typeof value === 'string' || value instanceof Date ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return withTime ? formatDateTime(date, language) : formatDate(date, language);
}

/**
 * What an empty read-only value reads as: the field's own sentence when its config carries
 * one (`admin.custom.emptyText`, both languages), else "Not yet" for a date, else nothing.
 */
function emptyText(field: ScalarField, strings: AdminStrings, translate: Translate): string | null {
  const own = (field.admin?.custom as { emptyText?: StaticLabel } | undefined)?.emptyText;
  if (own) return translate(own);
  return field.type === 'date' ? strings.readOnly.noDate : null;
}

/**
 * The text a read-only field's value reads as, in the UI language: a number in Western
 * digits, a date as dd/MM/yyyy in Riyadh (with the time when the picker had one), a checkbox
 * as the list's Yes / No or On / Off words, a select as its option's label, text as it is.
 */
export function readOnlyText(
  field: ScalarField,
  value: unknown,
  language: string,
  translate: Translate,
): string | null {
  const strings = adminStringsFor(language);
  if (value === undefined || value === null || value === '') {
    return emptyText(field, strings, translate);
  }
  switch (field.type) {
    case 'checkbox': {
      const pair = field.name === 'enabled' ? strings.cells.onOff : strings.cells.yesNo;
      return value === true ? pair[0] : value === false ? pair[1] : null;
    }
    case 'number':
      return typeof value === 'number'
        ? formatNumber(value, language, { maximumFractionDigits: 4 })
        : String(value);
    case 'date':
      return dateText(
        value,
        (field.admin?.date as { pickerAppearance?: string } | undefined)?.pickerAppearance !==
          'dayOnly',
        language,
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
 * the description as on every widget, the value as words in the UI language (ADR-056), never
 * a disabled input, a date picker with a clear button or a greyed checkbox.
 * `describeFields()` attaches it to every read-only scalar field, so a log row (a run, a
 * citation, a count) reads as a card and the connection's sidebar as a summary. A localized
 * one (the post's reading time, a computed fact) shows both languages (ADR-057): the open
 * language's line under its pill, the other language's under its own from the shared read
 * every bilingual widget uses; a field that is not localized pays no read.
 */
export function ReadOnlyLine({ field, path }: { field: ScalarField; path: string }) {
  const id = useId();
  const { i18n } = useTranslation();
  const { value } = useField<unknown>({ path });
  const text = readOnlyText(field, value, i18n.language, (label) =>
    typeof label === 'string' ? label : getTranslation(label, i18n),
  );
  const line = text !== null && (
    <span
      dir="auto"
      aria-labelledby={`${id}-label`}
      className="text-small break-words text-text"
      data-admin-read-only={field.name}
    >
      {text}
    </span>
  );
  return (
    <FieldShell field={field} labelId={`${id}-label`} descriptionId={`${id}-desc`}>
      {field.localized ? <BothLanguages field={field} path={path} line={line} /> : line}
    </FieldShell>
  );
}

/**
 * The open language's line under its pill, then the other language's from the shared read;
 * a language with no value yet (a post without its English body) reads "Empty".
 */
function BothLanguages({
  field,
  path,
  line,
}: {
  field: ScalarField;
  path: string;
  line: ReactNode;
}) {
  const { i18n } = useTranslation();
  const { code } = useLocale();
  const { other, stored } = useOtherLanguage();
  const empty = (
    <span className="text-small text-text-muted">{useAdminStrings().bilingual.empty}</span>
  );
  if (!other) return line;
  const translate = (label: StaticLabel | string) =>
    typeof label === 'string' ? label : getTranslation(label, i18n);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <LocaleTag code={code} />
        {line || empty}
      </div>
      <OtherValue other={other} stored={stored} hook={field.name}>
        {(doc) => {
          const text = readOnlyText(field, readKey(doc, path), i18n.language, translate);
          return text === null ? (
            empty
          ) : (
            <span dir="auto" className="text-small break-words text-text">
              {text}
            </span>
          );
        }}
      </OtherValue>
    </div>
  );
}
