'use client';

import { useDocumentInfo, useFormFields } from '@payloadcms/ui';
import { History } from 'lucide-react';
import type { GroupFieldClientComponent } from 'payload';
import { useId } from 'react';
import { Icon } from '@/components/shared/icon';
import { relativeTime } from '@/modules/cms/admin/dashboard/relative-time';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.savedBy;

/**
 * The `lastSavedBy` snapshot as one line ("by Dhia · 2 hours ago") instead of two read-only
 * inputs. The label and the description come from the field config like every widget; a
 * document saved before the field existed says so, and the create form (no id yet, not a
 * global) shows nothing.
 */
export const SavedByField: GroupFieldClientComponent = ({ field, path }) => {
  const id = useId();
  const { id: docId, globalSlug } = useDocumentInfo();
  const name = useFormFields(([fields]) => fields[`${path}.name`]?.value);
  const at = useFormFields(([fields]) => fields[`${path}.at`]?.value);
  const savedBy = typeof name === 'string' && name ? name : null;
  const savedAt = typeof at === 'string' && at ? at : null;
  if (docId === undefined && !globalSlug) return null;
  return (
    <FieldShell field={field} labelId={`${id}-label`} descriptionId={`${id}-desc`}>
      <span
        className="flex items-center gap-2 text-small text-text-muted"
        aria-labelledby={`${id}-label`}
        data-admin-saved-by=""
      >
        <Icon icon={History} size={16} className="shrink-0 text-accent" />
        {savedBy ? (
          <span className="min-w-0 truncate">
            {s.by} <span className="text-text">{savedBy}</span>
            {savedAt && (
              <>
                {' · '}
                <time dateTime={savedAt}>{relativeTime(savedAt)}</time>
              </>
            )}
          </span>
        ) : (
          <span>{s.never}</span>
        )}
      </span>
    </FieldShell>
  );
};
