'use client';

import { useFormFields, useLocale } from '@payloadcms/ui';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import type { ArrayFieldClientComponent } from 'payload';
import { useId } from 'react';
import { Icon } from '@/components/shared/icon';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';
import { LocaleTag } from '@/modules/cms/admin/fields/bilingual/locale-tag';
import { OtherValue } from '@/modules/cms/admin/fields/bilingual/other-value';
import { useOtherLanguage } from '@/modules/cms/admin/fields/bilingual/use-other-language';
import { readKey } from '@/modules/cms/fields/bilingual';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/** The rows' texts, from the form (the open language) or from the other language's read. */
function textsOf(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row: unknown) => (row as { text?: unknown } | null)?.text)
    .filter((t): t is string => typeof t === 'string' && t.length > 0);
}

/** The list, or the "nothing to flag" line, for one language; `data-admin-warnings` is its count. */
function WarningsList({ warnings, none }: { warnings: string[]; none: string }) {
  if (warnings.length === 0) {
    return (
      <span className="flex items-center gap-2 text-small text-text-muted" data-admin-warnings="0">
        <Icon icon={CircleCheck} size={16} className="shrink-0 text-success" />
        {none}
      </span>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5" data-admin-warnings={String(warnings.length)}>
      {warnings.map((text) => (
        <li key={text} className="flex items-start gap-2 text-small text-text">
          <Icon icon={TriangleAlert} size={16} className="mt-0.5 shrink-0 text-warning" />
          {text}
        </li>
      ))}
    </ul>
  );
}

/**
 * The editorial warnings of a post (BRD 10.1, the soft rules) as a list in the sidebar,
 * recomputed on every save by the collection hook for the language of each write; nothing
 * to edit here. The list is per language (the one field localized as a whole: a computed
 * fact), so both show (ADR-057): the open language's from the form under its pill, the
 * other language's under its own from the shared read every bilingual widget uses, which
 * runs again after each save, so the English warnings follow the English body.
 */
export const WarningsField: ArrayFieldClientComponent = ({ field, path }) => {
  const s = useAdminStrings().warnings;
  const id = useId();
  const { code } = useLocale();
  const { other, stored } = useOtherLanguage();
  const rows = useFormFields(([fields]) => fields[path]?.rows ?? []);
  const texts = useFormFields(([fields]) =>
    rows.map((_, index) => fields[`${path}.${index}.text`]?.value),
  );
  const warnings = texts.filter((t): t is string => typeof t === 'string' && t.length > 0);
  return (
    <FieldShell field={field} labelId={`${id}-label`} descriptionId={`${id}-desc`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          {other && <LocaleTag code={code} />}
          <WarningsList warnings={warnings} none={s.none} />
        </div>
        {other && (
          <OtherValue other={other} stored={stored} hook={path}>
            {(doc) => <WarningsList warnings={textsOf(readKey(doc, path))} none={s.none} />}
          </OtherValue>
        )}
      </div>
    </FieldShell>
  );
};
