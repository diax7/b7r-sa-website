'use client';

import { getTranslation } from '@payloadcms/translations';
import {
  SelectField,
  SelectInput,
  TextareaField,
  TextareaInput,
  TextField,
  TextInput,
  useConfig,
  useDocumentInfo,
  useField,
  useLocale,
  useTranslation,
  withCondition,
} from '@payloadcms/ui';
import type {
  OptionObject,
  SelectFieldClientProps,
  StaticLabel,
  TextareaFieldClientProps,
  TextFieldClientProps,
} from 'payload';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import {
  reconcile,
  readPath,
  textOf,
  TRANSLATIONS,
  type TranslationEntries,
  type Translations,
} from '@/modules/cms/fields/bilingual';
import { useOtherLocale } from '@/modules/cms/admin/fields/bilingual/other-locale';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

type Props = SelectFieldClientProps | TextareaFieldClientProps | TextFieldClientProps;
type ClientField = Props['field'];

interface LocaleInfo {
  code: string;
  rtl?: boolean | undefined;
}

/**
 * A localized text, textarea or select field in both languages at once (ADR-057): Payload's
 * own field for the open locale, and beside it the same input for the other locale, tagged
 * with its code. The other locale's stored text is read once per document
 * (`useOtherLocale`); what the editor types there waits in the hidden `translations` field
 * as `{ value, base }` until a Save or Publish, when the entity's hook writes it in that
 * locale. The root carries no `data-admin-ui`: it hosts Payload's inputs, which the shell's
 * element reset would strip; `data-admin-bilingual` is the hook for the e2e.
 */
function Bilingual(props: Props) {
  const { field, path, readOnly } = props;
  const locale = useLocale();
  const { config } = useConfig();
  const { i18n } = useTranslation();
  const strings = useAdminStrings().bilingual;
  const info = useDocumentInfo();
  const other = otherOf(config.localization, locale.code);
  const pending = useField<Translations | null>({ path: TRANSLATIONS });
  const stored = useOtherLocale({
    apiRoute: config.routes.api,
    collection: info.collectionSlug,
    global: info.globalSlug,
    id: info.id,
    locale: other?.code ?? locale.code,
    lastUpdateTime: info.lastUpdateTime,
  });
  const { value: translations, setValue: setTranslations } = pending;

  // After every read of the other locale (on open, after each save): keep what the editor
  // changed and still applies, drop what was applied or overtaken, and anything left over
  // from a session in the other locale. Idempotent, so every field on the page may run it;
  // it never marks the form modified on its own.
  useEffect(() => {
    if (!other || stored.status !== 'ready' || !translations) return;
    const kept = reconcile(translations[other.code] ?? {}, (at) => readPath(stored.doc, at));
    const next = Object.keys(kept).length > 0 ? { [other.code]: kept } : null;
    if (JSON.stringify(next) !== JSON.stringify(translations)) setTranslations(next, true);
  }, [other, stored, translations, setTranslations]);

  // The last text typed for the other language: after a save applies it the form drops the
  // entry before the fresh read lands, so for that round trip the typed text stands for what
  // is stored (the old text must not show, and a keystroke meanwhile must not lose its base).
  const [remembered, setRemembered] = useState<string | null>(null);
  const mine: TranslationEntries = other ? (translations?.[other.code] ?? {}) : {};
  const entry = mine[path];
  const typed = entry ? textOf(entry.value) : null;
  const stale = stored.status === 'ready' && stored.stale === true;
  if (typed !== null && typed !== remembered) setRemembered(typed);
  if (typed === null && !stale && remembered !== null) setRemembered(null);
  const standIn = typed === null && stale ? remembered : null;
  const current = standIn ?? textOf(readPath(stored.doc, path));
  const shown = typed ?? current;

  if (!other) return <Current {...props} />;
  const setShown = (value: string | null) => {
    const rest = { ...mine };
    if (textOf(value) === current) delete rest[path];
    else rest[path] = { value, base: current === '' ? null : current };
    setTranslations(Object.keys(rest).length > 0 ? { [other.code]: rest } : null);
  };
  const off = Boolean(readOnly) || Boolean(field.admin?.readOnly) || stored.status !== 'ready';
  const otherName = strings.languages[other.code] ?? other.code;
  const otherPath = `${TRANSLATIONS}.${other.code}.${path}`;
  return (
    <div className="@container" data-admin-bilingual={path} style={width(field)}>
      <div className="grid gap-x-6 @lg:grid-cols-2">
        <Current {...props} />
        <Other
          field={field}
          path={otherPath}
          rtl={rtlOf(field, other)}
          value={shown}
          onChange={setShown}
          readOnly={off}
          placeholder={
            stored.status === 'loading' ? strings.loading.replace('{language}', otherName) : ''
          }
          error={stored.status === 'error' ? strings.failed.replace('{language}', otherName) : ''}
          label={
            <label className="field-label" htmlFor={`field-${otherPath.replace(/\./g, '__')}`}>
              {labelOf(field, i18n)}
              {field.required && <span className="required">*</span>}
              <span className="admin-locale-tag" data-admin-locale-tag={other.code}>
                {other.code.toUpperCase()}
              </span>
            </label>
          }
        />
      </div>
    </div>
  );
}

export const BilingualField = withCondition(Bilingual);

/** Payload's own field for the open locale, by type. */
function Current(props: Props) {
  if (props.field.type === 'textarea') {
    return <TextareaField {...(props as TextareaFieldClientProps)} />;
  }
  if (props.field.type === 'select') return <SelectField {...(props as SelectFieldClientProps)} />;
  return <TextField {...(props as TextFieldClientProps)} />;
}

interface OtherProps {
  field: ClientField;
  path: string;
  rtl: boolean;
  value: string;
  onChange: (value: string | null) => void;
  readOnly: boolean;
  placeholder: string;
  error: string;
  label: ReactNode;
}

/** The other locale's input: Payload's input of the same type, under our label and tag. */
function Other({
  field,
  path,
  rtl,
  value,
  onChange,
  readOnly,
  placeholder,
  error,
  label,
}: OtherProps) {
  const shared = {
    path,
    Label: label,
    readOnly,
    rtl,
    required: Boolean(field.required),
    showError: error !== '',
    Error: error ? <span className="text-caption text-error">{error}</span> : undefined,
  };
  if (field.type === 'textarea') {
    return (
      <TextareaInput
        {...shared}
        value={value}
        placeholder={placeholder}
        {...rowsOf(field)}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (field.type === 'select') {
    return (
      <SelectInput
        {...shared}
        name={path}
        value={value}
        options={optionsOf((field as SelectFieldClientProps['field']).options)}
        isClearable={!field.required}
        hasMany={false}
        onChange={(selected) => {
          const one = Array.isArray(selected) ? selected[0] : selected;
          onChange(one && typeof one === 'object' && 'value' in one ? String(one.value) : null);
        }}
      />
    );
  }
  return (
    <TextInput
      {...shared}
      value={value}
      placeholder={placeholder}
      hasMany={false}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** A select has no `rtl` setting; a text or textarea may force it either way. */
function rtlOf(field: ClientField, other: LocaleInfo): boolean {
  const forced = (field.admin as { rtl?: boolean } | undefined)?.rtl;
  return forced === true || (forced !== false && other.rtl === true);
}

function rowsOf(field: ClientField): { rows?: number } {
  const rows = (field.admin as { rows?: number } | undefined)?.rows;
  return typeof rows === 'number' ? { rows } : {};
}

/** The locale that is not open; null with one locale or more than two (nothing to pair). */
function otherOf(
  localization: { locales: LocaleInfo[] } | false | undefined,
  current: string,
): LocaleInfo | null {
  if (!localization) return null;
  const others = localization.locales.filter((l) => l.code !== current);
  return others.length === 1 ? (others[0] ?? null) : null;
}

function labelOf(field: ClientField, i18n: Parameters<typeof getTranslation>[1]): string {
  const label: unknown = field.label;
  if (label === false) return '';
  return getTranslation((label ?? field.name) as StaticLabel, i18n);
}

function optionsOf(options: SelectFieldClientProps['field']['options']): OptionObject[] {
  return options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
}

/** In a row the pair takes the full line unless the config gives the field a width. */
function width(field: ClientField): CSSProperties {
  const w = field.admin?.width;
  return w ? ({ '--field-width': w } as CSSProperties) : { flex: '1 1 100%' };
}
