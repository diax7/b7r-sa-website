'use client';

import { useFormFields } from '@payloadcms/ui';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import type { ArrayFieldClientComponent } from 'payload';
import { useId } from 'react';
import { Icon } from '@/components/shared/icon';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.warnings;

/**
 * The editorial warnings of a post (BRD 10.1, the soft rules) as a list in the sidebar,
 * recomputed on every save by the collection hook; nothing to edit here.
 */
export const WarningsField: ArrayFieldClientComponent = ({ field, path }) => {
  const id = useId();
  const rows = useFormFields(([fields]) => fields[path]?.rows ?? []);
  const texts = useFormFields(([fields]) =>
    rows.map((_, index) => fields[`${path}.${index}.text`]?.value),
  );
  const warnings = texts.filter((t): t is string => typeof t === 'string' && t.length > 0);
  return (
    <FieldShell field={field} labelId={`${id}-label`} descriptionId={`${id}-desc`}>
      {warnings.length === 0 ? (
        <span
          className="flex items-center gap-2 text-small text-text-muted"
          data-admin-warnings="0"
        >
          <Icon icon={CircleCheck} size={16} className="shrink-0 text-success" />
          {s.none}
        </span>
      ) : (
        <ul className="flex flex-col gap-1.5" data-admin-warnings={String(warnings.length)}>
          {warnings.map((text) => (
            <li key={text} className="flex items-start gap-2 text-small text-text">
              <Icon icon={TriangleAlert} size={16} className="mt-0.5 shrink-0 text-warning" />
              {text}
            </li>
          ))}
        </ul>
      )}
    </FieldShell>
  );
};
