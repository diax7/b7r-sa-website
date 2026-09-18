import { Link } from '@payloadcms/ui';
import { Check, Link2, X } from 'lucide-react';
import { Badge } from '@/components/shared/badge';
import { Icon } from '@/components/shared/icon';
import type { LexicalState } from '@/lib/lexical';
import { LexicalProse } from '@/modules/core/rich-text/lexical-prose';
import { cn } from '@/lib/cn';
import { type AdminStrings, adminStringsFor } from '@/modules/cms/admin/strings';
import { AnswerDialog } from '@/modules/visibility/admin/answer-dialog';
import { RunLedger } from '@/modules/visibility/admin/run-ledger-action';
import type { CitationRow, LedgerReading } from '@/modules/visibility/ledger/reading';

type Strings = AdminStrings['visibility']['ledger'];

const th = 'py-1 pe-3 text-start text-caption font-medium text-text-muted';
const td = 'py-2 pe-3 align-top text-small text-text';
const pct = (n: number, of: number) => (of > 0 ? `${Math.round((n / of) * 100)}%` : '');

/** One engine's answer to one prompt: the verdict as a coloured badge, the link mark, and the whole answer behind "View answer". */
function Cell({ row, engine, s }: { row: CitationRow | undefined; engine: string; s: Strings }) {
  if (!row) return <span className="text-caption text-text-muted">{s.notRun}</span>;
  return (
    <div className="flex flex-col items-start gap-1" data-admin-cited={row.mentioned}>
      <span className="inline-flex items-center gap-1">
        <Badge tone={row.mentioned ? 'success' : 'error'} className="gap-1">
          <Icon icon={row.mentioned ? Check : X} size={12} />
          {row.mentioned ? s.cited : s.uncited}
        </Badge>
        {row.linked && (
          <Icon icon={Link2} size={14} className="text-success" aria-label={s.linked} />
        )}
      </span>
      {row.answer ? (
        <AnswerDialog
          title={s.answerTitle.replace('{engine}', engine).replace('{date}', row.date)}
          urls={row.urls}
        >
          <LexicalProse data={row.answer as LexicalState} locale="ar" />
        </AnswerDialog>
      ) : (
        <span className="text-caption text-text-muted" dir="auto">
          {row.excerpt}
        </span>
      )}
    </div>
  );
}

/**
 * The citation ledger on the Score page (ADR-049 D5): the cited-rate and linked-rate per
 * engine over four weeks (the non-brand prompts), the per-prompt table with an engine per
 * column, the latest answers as collapsible excerpts, the competitors named most, and for a
 * prompt no engine names B7R on, the page to improve. "Run now" queues a batch.
 */
export function Ledger({
  reading,
  adminRoute,
  language,
}: {
  reading: LedgerReading;
  adminRoute: string;
  language: string;
}) {
  const s = adminStringsFor(language).visibility.ledger;
  const engines = reading.engines;
  const empty = engines.length === 0;
  return (
    <section className="flex flex-col gap-4" data-admin-visibility-ledger="">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-h3 text-text">{s.title}</h2>
          <p className="text-caption text-text-muted">{s.hint}</p>
        </div>
        <RunLedger />
      </div>
      {empty ? (
        <p className="rounded-base border border-border bg-surface p-5 text-small text-text-muted">
          {s.empty}{' '}
          <Link
            href={`${adminRoute}/collections/prompts`}
            className="text-accent underline underline-offset-2"
          >
            {s.prompts}
          </Link>
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {engines.map((e) => (
              <div
                key={e.connection}
                className="flex flex-col gap-1 rounded-base border border-border bg-surface p-4"
                data-admin-ledger-engine={e.connection}
              >
                <span className="text-small font-medium text-text">{e.label}</span>
                <span className="text-h3 text-text tabular-nums">{pct(e.mentioned, e.runs)}</span>
                <span className="text-caption text-text-muted tabular-nums">
                  {s.rateLine
                    .replace('{cited}', String(e.mentioned))
                    .replace('{runs}', String(e.runs))
                    .replace('{linked}', pct(e.linked, e.rows) || '0%')}
                </span>
                {e.monthlyLimitUsd === null && (
                  <Badge tone="warning" className="self-start" data-admin-no-limit="">
                    {s.noLimit}
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-base border border-border bg-surface p-4">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>{s.prompt}</th>
                  {engines.map((e) => (
                    <th key={e.connection} className={cn(th, 'whitespace-nowrap')}>
                      {e.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reading.prompts.map((p) => {
                  return (
                    <tr key={p.id} data-admin-ledger-prompt={p.id}>
                      <td className={td}>
                        <div className="flex flex-col gap-1">
                          <span dir="auto">
                            {p.text}
                            {p.namesBrand && (
                              <span className="ms-2 text-caption text-text-muted">{s.brand}</span>
                            )}
                            {p.everyDays > 1 && (
                              <span className="ms-2 text-caption text-text-muted">
                                {s.every(p.everyDays)}
                              </span>
                            )}
                          </span>
                          {p.fix && (
                            <span className="text-caption text-text-muted" data-admin-ledger-fix="">
                              {s.fix}{' '}
                              <Link
                                href={p.fix.href}
                                className="text-accent underline underline-offset-2"
                                dir="auto"
                              >
                                {p.fix.label}
                              </Link>
                            </span>
                          )}
                        </div>
                      </td>
                      {engines.map((e) => (
                        <td key={e.connection} className={td}>
                          <Cell row={p.latest[e.connection]} engine={e.label} s={s} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {reading.competitors.length > 0 && (
            <p className="text-caption text-text-muted" data-admin-ledger-competitors="">
              {s.competitors} {reading.competitors.map((c) => `${c.host} (${c.count})`).join(', ')}
            </p>
          )}
        </>
      )}
    </section>
  );
}
