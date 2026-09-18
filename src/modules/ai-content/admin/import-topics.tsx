'use client';

import { Gutter } from '@payloadcms/ui';
import { Upload } from 'lucide-react';
import { useId, useState } from 'react';
import { Icon } from '@/components/shared/icon';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

type Outcome = { created: string[]; skipped: string[]; errors: string[] } | null;

/** Bulk add topics from CSV above the topics list (BRD 10.2.7). */
export function ImportTopics() {
  const strings = useAdminStrings();
  const s = strings.engine;
  const id = useId();
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/topics/import', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      });
      const json = (await res.json()) as {
        error?: string;
        created?: string[];
        skipped?: string[];
        errors?: string[];
      };
      if (!res.ok) {
        setError(
          json.error ?? strings.common.serverAnswered.replace('{status}', String(res.status)),
        );
        return;
      }
      setOutcome({
        created: json.created ?? [],
        skipped: json.skipped ?? [],
        errors: json.errors ?? [],
      });
      if ((json.created ?? []).length > 0) window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Gutter>
      <div className="mb-4 flex flex-col gap-3" data-admin-ui="" data-admin-import-topics="">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-base border border-border bg-surface px-4 text-small font-medium text-text transition-colors duration-(--duration-fast) hover:border-accent hover:text-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Icon icon={Upload} size={16} />
          {s.importTitle}
        </button>
        {open && (
          <div
            id={`${id}-panel`}
            className="flex flex-col gap-3 rounded-base border border-border bg-surface p-4"
          >
            <label htmlFor={`${id}-csv`} className="text-small text-text-muted">
              {s.importHint}
            </label>
            <textarea
              id={`${id}-csv`}
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={6}
              dir="auto"
              className="w-full rounded-inner border border-border bg-ground p-3 text-small text-text focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
              placeholder={s.importPlaceholder}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={busy || !csv.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-base bg-primary px-4 text-small font-medium text-white hover:bg-primary-hover disabled:opacity-60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40"
                data-admin-action="import-topics"
              >
                {busy ? s.importing : s.importButton}
              </button>
              {outcome && (
                <span className="text-small text-text-muted" role="status">
                  {s.importResult
                    .replace('{created}', String(outcome.created.length))
                    .replace('{skipped}', String(outcome.skipped.length))}
                </span>
              )}
              {error && (
                <span className="text-small text-error" role="alert">
                  {error}
                </span>
              )}
            </div>
            {outcome && outcome.errors.length > 0 && (
              <ul className="list-disc ps-5 text-caption text-warning">
                {outcome.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Gutter>
  );
}
