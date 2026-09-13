'use client';

import { getTranslation } from '@payloadcms/translations';
import { useTranslation } from '@payloadcms/ui';
import type { LabelFunction, StaticLabel } from 'payload';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** What the shell reads from a client field config; static descriptions do reach the client
 *  (payload/fields/config/client.js keeps every non-function `admin.description`). */
export interface ShellField {
  name?: string;
  label?: false | LabelFunction | StaticLabel;
  required?: boolean;
  admin?: { description?: unknown };
}

/** Label, control, description and error laid out the same way in every widget. */
export function FieldShell({
  field,
  labelId,
  descriptionId,
  error,
  inline,
  children,
}: {
  field: ShellField;
  labelId: string;
  descriptionId: string;
  error?: string | undefined;
  /** Control beside the label (a switch) instead of under it (a picker). */
  inline?: boolean;
  children: ReactNode;
}) {
  const { i18n } = useTranslation();
  const label = field.label ? getTranslation(field.label as StaticLabel, i18n) : '';
  const description = field.admin?.description
    ? getTranslation(field.admin.description as StaticLabel, i18n)
    : '';
  const required = Boolean(field.required);
  return (
    <div
      className={cn('mb-6 flex gap-3', inline ? 'items-start justify-between' : 'flex-col')}
      data-admin-ui=""
      data-admin-field={field.name}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span id={labelId} className="text-small font-medium text-text">
          {label}
          {required && (
            <span aria-hidden="true" className="ms-1 text-error">
              *
            </span>
          )}
        </span>
        {description && (
          <span id={descriptionId} className="text-caption text-text-muted">
            {description}
          </span>
        )}
        {error && (
          <span role="alert" className="text-caption text-error">
            {error}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
