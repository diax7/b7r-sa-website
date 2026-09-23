'use client';

import { useFormFields } from '@payloadcms/ui';
import type { UIFieldClientComponent } from 'payload';
import { Badge } from '@/components/shared/badge';
import { formatRatio } from '@/modules/brand/admin/refusal';
import { type SampleColours, SurfaceSample } from '@/modules/brand/admin/surface-sample';
import { useAppearanceForm } from '@/modules/brand/admin/use-appearance-form';
import { resolveBrand } from '@/modules/brand/css';
import { SURFACE } from '@/modules/brand/defaults';
import {
  type SurfaceSet,
  surfaceStyle,
  surfaceVerdict,
  toSurfaceSet,
} from '@/modules/brand/surfaces';
import { useAdminLanguage, useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

const SCALARS = ['kind', 'background', 'text', 'textMuted', 'link', 'button', 'grain'] as const;
const BLOOM_FIELDS = ['colour', 'x', 'y', 'width', 'height'] as const;

/**
 * The row as the form holds it now, as one string (the form context compares a selector's
 * result by value, so typing in another row does not re-render this one).
 */
function useRow(row: string): string {
  return useFormFields(([fields]) => {
    const values: Record<string, unknown> = {};
    for (const name of SCALARS) values[name] = fields[`${row}.${name}`]?.value;
    const count = Number(fields[`${row}.blooms`]?.value ?? 0);
    values['blooms'] = Array.from({ length: Number.isFinite(count) ? count : 0 }, (_, i) =>
      Object.fromEntries(
        BLOOM_FIELDS.map((name) => [name, fields[`${row}.blooms.${i}.${name}`]?.value]),
      ),
    );
    return JSON.stringify(values);
  });
}

/**
 * One library set, live (spec 010, phase 1c): the background as a section would paint it,
 * grain included, with sample text in its colours, and the verdict for each text colour at
 * the weakest point of the field. A save with a failing colour is refused on that colour's
 * own field, in the same words; this shows it while the editor is still choosing.
 */
export const SurfacePreview: UIFieldClientComponent = ({ path }) => {
  const s = useAdminStrings().appearance;
  const { language } = useAdminLanguage();
  const row = path.replace(/\.preview$/, '');
  const set = toSurfaceSet(JSON.parse(useRow(row)) as unknown);
  const { tokens } = resolveBrand(useAppearanceForm().brand);
  if (!set) {
    return (
      <p className="mb-4 text-caption text-text-muted" data-admin-surface-preview="waiting">
        {s.surfaces.waiting}
      </p>
    );
  }
  const primary = tokens['color-primary'] ?? set.link;
  const colours: SampleColours = {
    background: surfaceStyle(set),
    text: set.text,
    textMuted: set.textMuted,
    link: set.link,
    button:
      set.button === 'inverse'
        ? { fill: SURFACE, words: primary }
        : { fill: primary, words: SURFACE },
  };
  return (
    <div className="mb-4 flex flex-col gap-2" data-admin-ui="" data-admin-surface-preview="">
      <SurfaceSample colours={colours} />
      <Verdict set={set} language={language} />
    </div>
  );
};

function Verdict({ set, language }: { set: SurfaceSet; language: string }) {
  const s = useAdminStrings().appearance;
  return (
    <div role="status">
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {surfaceVerdict(set).rows.map(({ role, worst, wanted }) => (
          <li
            key={role}
            className="flex items-center gap-2 text-caption text-text-muted"
            data-admin-surface-role={role}
            data-admin-surface-verdict={worst >= wanted ? 'pass' : 'fail'}
          >
            <span className="text-text">{s.surfaces.roles[role]}</span>
            <span>
              {s.surfaces.weakest.split('{ratio}')[0]}
              <bdi dir="ltr" className="tabular">
                {formatRatio(worst, language)}
              </bdi>
              {s.surfaces.weakest.split('{ratio}')[1]}
            </span>
            <Badge tone={worst >= wanted ? 'success' : 'error'} className="whitespace-nowrap">
              {worst >= wanted ? s.verdict.passes : s.verdict.short}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
