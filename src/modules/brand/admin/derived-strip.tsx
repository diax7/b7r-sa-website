'use client';

import { useField } from '@payloadcms/ui';
import type { JSONFieldClientComponent } from 'payload';
import { useEffect, useId, useState } from 'react';
import { Badge } from '@/components/shared/badge';
import { Input } from '@/components/shared/input';
import {
  DERIVED_KEYS,
  type DerivedKey,
  type Pins,
  releaseFactoryPins,
} from '@/modules/brand/appearance';
import { DERIVED_FROM, resolveBrand } from '@/modules/brand/css';
import { toHex } from '@/modules/brand/types';
import {
  editorPin,
  useAppearanceForm,
  withoutPin,
} from '@/modules/brand/admin/use-appearance-form';
import { FieldShell } from '@/modules/cms/admin/fields/field-shell';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/** The palette token each derived colour is emitted as. */
const TOKEN: Record<DerivedKey, string> = {
  primaryHover: 'color-primary-hover',
  accentTint: 'color-accent-tint',
  accentOnTint: 'color-accent-on-tint',
  ground: 'color-ground',
  border: 'color-border',
  textMuted: 'color-text-muted',
};

/**
 * The derived colours, live (spec 010, phase 1b): each one's swatch as the site would paint
 * it with the brand colours typed above, its state in words (computed, a designed value, set
 * by hand), where it comes from, and the one action that changes that state. A designed value
 * is released the moment one of its own brand colours moves, exactly as the save does, so
 * the strip never shows a colour the save would not keep. The field's refusal (a colour set
 * by hand that breaks a pair) shows above the strip.
 */
export const DerivedStrip: JSONFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError, errorMessage, disabled } = useField<Pins>({ path });
  const form = useAppearanceForm(value);
  const id = useId();
  const off = Boolean(disabled || readOnly);
  const pins: Pins = form.brand.pinned;

  // A brand colour moved: release the designed values that follow it, as the save would.
  useEffect(() => {
    if (!form.valid) return;
    const released = releaseFactoryPins(form.saved, form.typed, pins);
    if (Object.keys(released).length !== Object.keys(pins).length) setValue(released);
  }, [form, pins, setValue]);

  const { tokens } = resolveBrand(form.brand);

  return (
    <FieldShell
      field={field}
      labelId={`${id}-label`}
      descriptionId={`${id}-desc`}
      error={showError ? errorMessage : undefined}
    >
      <ul
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
        aria-labelledby={`${id}-label`}
        data-admin-derived-strip=""
      >
        {DERIVED_KEYS.map((key) => (
          <DerivedRow
            key={key}
            token={key}
            colour={tokens[TOKEN[key]] ?? ''}
            waiting={!form.valid && DERIVED_FROM[key].some((source) => !toHex(form.typed[source]))}
            pins={pins}
            off={off}
            onChange={setValue}
          />
        ))}
      </ul>
    </FieldShell>
  );
};

function DerivedRow({
  token,
  colour,
  waiting,
  pins,
  off,
  onChange,
}: {
  token: DerivedKey;
  colour: string;
  waiting: boolean;
  pins: Pins;
  off: boolean;
  onChange: (pins: Pins) => void;
}) {
  const s = useAdminStrings().appearance;
  const pin = pins[token];
  const sourceName = DERIVED_FROM[token].map((source) => s.colours[source]).join(', ');
  const name = s.derived[token];
  const state = pin?.origin === 'editor' ? 'byHand' : pin ? 'designed' : 'computed';
  const note =
    state === 'designed'
      ? s.strip.designedNote.replace('{colour}', sourceName)
      : s.strip.from.replace('{colour}', sourceName);

  return (
    <li
      className="flex flex-col gap-3 rounded-base border border-border bg-surface p-3"
      data-admin-derived={token}
      data-admin-derived-state={state}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="size-10 shrink-0 rounded-inner border border-border"
          style={{ backgroundColor: waiting ? 'transparent' : colour }}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-small font-medium text-text">{name}</span>
          {waiting ? (
            <span className="text-caption text-text-muted">{s.strip.waiting}</span>
          ) : (
            <bdi dir="ltr" className="text-caption tabular text-text-muted">
              {colour}
            </bdi>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge tone={state === 'byHand' ? 'warning' : 'muted'} className="whitespace-nowrap">
          {s.strip[state]}
        </Badge>
        <span className="text-caption text-text-muted">{note}</span>
      </div>
      {state === 'byHand' && pin ? (
        <HandValue token={token} value={pin.value} pins={pins} off={off} onChange={onChange} />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {state === 'byHand' || state === 'designed' ? (
          <RowAction disabled={off} onClick={() => onChange(withoutPin(pins, token))}>
            {s.strip.compute}
          </RowAction>
        ) : null}
        {state !== 'byHand' ? (
          <RowAction
            disabled={off || waiting || !toHex(colour)}
            onClick={() => {
              const hex = toHex(colour);
              if (hex) onChange(editorPin(pins, token, hex));
            }}
          >
            {s.strip.setByHand}
          </RowAction>
        ) : null}
      </div>
    </li>
  );
}

/** A colour set by hand: the picker and the hex, written into the pin once the hex is whole. */
function HandValue({
  token,
  value,
  pins,
  off,
  onChange,
}: {
  token: DerivedKey;
  value: string;
  pins: Pins;
  off: boolean;
  onChange: (pins: Pins) => void;
}) {
  const s = useAdminStrings();
  // The typed text follows the pin when it changes from outside (a reset, a reload).
  const [draft, setDraft] = useState(value);
  const [shown, setShown] = useState(value);
  if (value !== shown) {
    setShown(value);
    setDraft(value);
  }
  const label = s.appearance.strip.valueLabel.replace('{name}', s.appearance.derived[token]);
  const commit = (next: string) => {
    setDraft(next);
    const hex = toHex(next);
    if (hex) onChange(editorPin(pins, token, hex));
  };
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={toHex(draft) ?? value}
        onChange={(e) => commit(e.target.value)}
        disabled={off}
        aria-label={`${label}: ${s.fields.pickColor}`}
        className="size-11 shrink-0 cursor-pointer rounded-inner border border-border bg-surface p-1 disabled:cursor-default"
        data-admin-derived-picker={token}
      />
      <Input
        dir="ltr"
        value={draft}
        onChange={(e) => commit(e.target.value)}
        disabled={off}
        invalid={!toHex(draft)}
        aria-label={label}
        spellCheck={false}
        className="max-w-36 tabular"
        data-admin-derived-text={token}
      />
    </div>
  );
}

function RowAction({
  children,
  disabled,
  onClick,
}: {
  children: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-11 rounded-inner border border-border px-3 text-small font-medium text-text transition-colors hover:bg-ground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-50"
    >
      {children}
    </button>
  );
}
