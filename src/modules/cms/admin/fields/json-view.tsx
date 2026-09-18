'use client';

import { useField } from '@payloadcms/ui';
import type { DefaultCellComponentProps, JSONFieldClientComponent } from 'payload';
import { useId } from 'react';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';

/** The value as an editor reads it: pretty-printed, or nothing for an empty field. */
export function prettyJson(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

/** One line of the value for a list cell, cut at `max` characters. */
export function jsonPreview(value: unknown, max = 80): string | null {
  const text = prettyJson(value);
  if (text === null) return null;
  const line = text.replace(/\s+/g, ' ').trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/**
 * A read-only JSON field as a pretty-printed block (admin audit 2026-09-18, 2.1): Payload's
 * own JSON field loads the Monaco editor from a CDN the admin CSP refuses, so the runs'
 * rubric, steps and outline, the snapshots' data and the citations' links rendered empty.
 * Nothing here edits: the log rows are written by the jobs. `describeFields()` attaches it to
 * every read-only JSON field. JSON is Latin-script data, hence `dir="ltr"` on the block.
 */
export const JsonView: JSONFieldClientComponent = ({ field, path }) => {
  const id = useId();
  const { value } = useField<unknown>({ path });
  const text = prettyJson(value);
  return (
    <FieldShell field={field} labelId={`${id}-label`} descriptionId={`${id}-desc`}>
      {text !== null && (
        <pre
          dir="ltr"
          aria-labelledby={`${id}-label`}
          className="max-h-96 overflow-auto rounded-inner border border-border bg-ground p-3 text-start font-mono text-caption leading-relaxed whitespace-pre text-text"
          data-admin-json-view={field.name}
        >
          {text}
        </pre>
      )}
    </FieldShell>
  );
};

/** The same value in a list: one line, cut short, never an editor. */
export function JsonViewCell({ cellData }: DefaultCellComponentProps) {
  const line = jsonPreview(cellData);
  if (line === null) return null;
  return (
    <code dir="ltr" className="font-mono text-caption text-text-muted" data-admin-json-cell="">
      {line}
    </code>
  );
}
