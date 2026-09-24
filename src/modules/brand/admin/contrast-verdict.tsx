'use client';

import { useId } from 'react';
import { Badge } from '@/components/shared/badge';
import { formatRatio } from '@/modules/brand/admin/refusal';
import { useAppearanceForm } from '@/modules/brand/admin/use-appearance-form';
import { resolveBrand } from '@/modules/brand/css';
import { useAdminLanguage, useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/**
 * The contrast check (spec 010, decision 4), live: every pair of colours the site puts
 * together, drawn in its own two colours, with the ratio it reads, the ratio it needs and
 * the verdict in words. A save that leaves any pair short is refused by the fields' own
 * validators, which name the change that fixes it; this is where the editor sees all of
 * them at once, before saving. The summary is a live region, so a screen reader hears the
 * verdict change as a colour is typed.
 */
export function ContrastVerdict() {
  const s = useAdminStrings().appearance;
  const { language } = useAdminLanguage();
  const { brand } = useAppearanceForm();
  const id = useId();
  const { rows } = resolveBrand(brand);
  const failing = rows.filter((row) => !row.passes).length;

  return (
    <section
      className="mb-6 flex flex-col gap-3"
      aria-labelledby={`${id}-title`}
      data-admin-ui=""
      data-admin-contrast-check=""
    >
      <div className="flex flex-col gap-1">
        <h3 id={`${id}-title`} className="text-small font-medium text-text">
          {s.verdict.title}
        </h3>
        <span className="text-caption text-text-muted">{s.verdict.lead}</span>
      </div>
      <p
        role="status"
        className={failing === 0 ? 'text-small text-success' : 'text-small text-error'}
        data-admin-contrast-summary={failing === 0 ? 'pass' : 'fail'}
      >
        {failing === 0 ? s.verdict.allPass : s.verdict.failing(failing)}
      </p>
      <ul className="flex flex-col divide-y divide-border rounded-base border border-border">
        {rows.map(({ pair, fg, bg, ratio, passes }) => (
          <li
            key={pair.key}
            className="flex flex-wrap items-center gap-3 px-3 py-2"
            data-admin-contrast-pair={pair.key}
            data-admin-contrast-verdict={passes ? 'pass' : 'fail'}
          >
            <span
              aria-hidden="true"
              className="grid h-8 w-12 shrink-0 place-items-center rounded-inner border border-border text-small font-bold"
              style={{ color: fg, backgroundColor: bg }}
            >
              Aa
            </span>
            <span className="min-w-0 flex-1 basis-48 text-small text-text">
              {s.pairs[pair.key]}
            </span>
            <span className="flex items-center gap-2 text-caption text-text-muted">
              <bdi dir="ltr" className="tabular text-text">
                {formatRatio(ratio, language)}
              </bdi>
              <span>{s.verdict.needs.replace('{ratio}', formatRatio(pair.min, language))}</span>
            </span>
            <Badge tone={passes ? 'success' : 'error'} className="whitespace-nowrap">
              {passes ? s.verdict.passes : s.verdict.short}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
