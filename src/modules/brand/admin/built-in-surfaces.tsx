'use client';

import { builtInColours } from '@/modules/brand/admin/sample-colours';
import { SurfaceSample } from '@/modules/brand/admin/surface-sample';
import { useAppearanceForm } from '@/modules/brand/admin/use-appearance-form';
import { resolveBrand } from '@/modules/brand/css';
import { BUILT_IN_SURFACES } from '@/modules/brand/surfaces';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/**
 * The three sets built from the brand (spec 010, phase 1c), live from the colours typed in
 * the Colours tab: white, light grey and deep sea. They are not rows of the library: they
 * follow the brand and cannot be deleted, and the Colours tab's contrast check holds their
 * pairs (links on the grey, the accent tint on navy) to AA.
 */
export function BuiltInSurfaces() {
  const s = useAdminStrings().appearance.surfaces;
  const { brand } = useAppearanceForm();
  const { tokens } = resolveBrand(brand);
  return (
    <section
      aria-labelledby="appearance-built-in-surfaces"
      className="mb-6 flex flex-col gap-3"
      data-admin-ui=""
      data-admin-built-in-surfaces=""
    >
      <div className="flex flex-col gap-1">
        <h3 id="appearance-built-in-surfaces" className="text-small font-medium text-text">
          {s.builtInTitle}
        </h3>
        <p className="text-caption text-text-muted">{s.builtInLead}</p>
      </div>
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {BUILT_IN_SURFACES.map((set) => (
          <li key={set} className="flex flex-col gap-2" data-admin-built-in-surface={set}>
            <span className="text-small font-medium text-text">
              {s.builtIn[set]}{' '}
              <bdi dir="ltr" className="text-caption font-normal text-text-muted">
                {set}
              </bdi>
            </span>
            <SurfaceSample colours={builtInColours(set, tokens)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
