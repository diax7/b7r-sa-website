import { type FieldRef, type Refusal, refusalsFor } from '@/modules/brand/appearance';
import { contrastRatio } from '@/modules/brand/contrast';
import type { Brand } from '@/modules/brand/css';
import { type SurfaceRole, type SurfaceSet, surfaceVerdict } from '@/modules/brand/surfaces';
import { formatNumber } from '@/modules/cms/admin/format';
import { adminStringsFor } from '@/modules/cms/admin/strings';

/**
 * A contrast ratio as the editor reads it, `4.49:1`, in the panel's digits (design system §5).
 * Floored, never rounded: a pair at 4.496 must not read "4.5:1, needs 4.5:1" while it is
 * being refused.
 */
export function formatRatio(ratio: number, language: string): string {
  const floored = Math.floor(ratio * 100) / 100;
  return `${formatNumber(floored, language, { maximumFractionDigits: 2 })}:1`;
}

const sameField = (a: FieldRef, b: FieldRef) => a.kind === b.kind && a.key === b.key;

/**
 * The sentence for one refusal on one field (spec 010, decision 4): the pair as the site
 * shows it, the ratio it reads, the ratio it needs, and the one change on this field that
 * fixes it. A colour set by hand is also told it can go back to being computed.
 */
export function refusalSentence(refusal: Refusal, field: FieldRef, language: string): string {
  const s = adminStringsFor(language).appearance;
  const direction = refusal.fields.find((f) => sameField(f.field, field))?.direction ?? 'darker';
  const template = (field.kind === 'pin' ? s.pinRefusal : s.refusal)[direction];
  const colour = field.kind === 'pin' ? s.derivedInSentence[field.key] : s.colours[field.key];
  return template
    .replace('{pair}', s.pairs[refusal.pair])
    .replace('{got}', formatRatio(refusal.got, language))
    .replace('{wanted}', formatRatio(refusal.wanted, language))
    .replace('{colour}', colour);
}

/**
 * What a field's validator returns: `true`, or its first refusal, pointing at the contrast
 * check when there are more (the check lists every pair beside the fields).
 */
export function fieldVerdict(brand: Brand, field: FieldRef, language: string): true | string {
  const [first, ...rest] = refusalsFor(brand, field);
  if (!first) return true;
  const sentence = refusalSentence(first, field, language);
  return rest.length > 0 ? `${sentence} ${adminStringsFor(language).appearance.more}` : sentence;
}

/**
 * A text colour of a background set that does not read everywhere on it (phase 1c): the
 * role, the weakest ratio over the whole field with the grain counted, what it needs, and
 * which way to move. Dark text on a light field asks for darker text or a lighter field.
 */
export function surfaceRoleVerdict(
  set: SurfaceSet | null,
  role: SurfaceRole,
  language: string,
): true | string {
  if (!set) return true;
  const failure = surfaceVerdict(set).failures.find((f) => f.role === role);
  if (!failure) return true;
  const s = adminStringsFor(language).appearance.surfaces;
  const darkText = contrastRatio(set[role], '#000000') < contrastRatio(set.background, '#000000');
  return s.refusal[darkText ? 'darker' : 'lighter']
    .replace('{role}', s.roles[role])
    .replace('{got}', formatRatio(failure.worst, language))
    .replace('{wanted}', formatRatio(failure.wanted, language));
}
