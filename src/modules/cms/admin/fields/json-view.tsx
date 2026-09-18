'use client';

import { useField } from '@payloadcms/ui';
import { Check, Copy } from 'lucide-react';
import type { DefaultCellComponentProps, JSONFieldClientComponent } from 'payload';
import { useEffect, useId, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

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

/** "Copy" that reads "Copied" for two seconds after a click. */
function CopyButton({ text }: { text: string }) {
  const s = useAdminStrings().jsonView;
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => setCopied(true));
      }}
      className="inline-flex h-7 items-center gap-1 self-start rounded-inner border border-border bg-surface px-2 text-caption text-text-muted transition-colors duration-(--duration-fast) hover:border-accent hover:text-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
      data-admin-json-copy={copied ? 'copied' : 'idle'}
    >
      <Icon icon={copied ? Check : Copy} size={12} />
      {copied ? s.copied : s.copy}
    </button>
  );
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
        <div className="flex flex-col gap-2">
          <pre
            dir="ltr"
            aria-labelledby={`${id}-label`}
            className="max-h-96 overflow-auto rounded-inner border border-border bg-ground p-3 text-start font-mono text-caption leading-relaxed whitespace-pre text-text"
            data-admin-json-view={field.name}
          >
            {text}
          </pre>
          <CopyButton text={text} />
        </div>
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
