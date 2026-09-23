'use client';

import { useFormFields } from '@payloadcms/ui';
import { useMemo } from 'react';
import { type Pins, SOURCE_KEYS, type SourceKey, toAppearance } from '@/modules/brand/appearance';
import type { Brand } from '@/modules/brand/css';
import { type Hex, toHex } from '@/modules/brand/types';

export interface AppearanceForm {
  /** The five colours as typed, valid or not. */
  typed: Record<SourceKey, string>;
  /** The five colours as last saved: what a designed value is kept against. */
  saved: Record<SourceKey, string>;
  /** Whether every colour typed is a colour; nothing is computed from a half-typed hex. */
  valid: boolean;
  /** The brand the form describes now: the typed colours, the shipped ones where a colour is unreadable. */
  brand: Brand;
}

const SEPARATOR = ' ';

/**
 * The form's brand colours and pins, read the way the validators read them (`toAppearance`),
 * so the live strip and the contrast check say what a save would. The selectors return
 * strings, which the form context compares by value: a keystroke in another field does not
 * re-render the widgets.
 */
export function useAppearanceForm(pinsOverride?: unknown): AppearanceForm {
  const typedKey = useFormFields(([fields]) =>
    SOURCE_KEYS.map((key) => String(fields[`sources.${key}`]?.value ?? '')).join(SEPARATOR),
  );
  const savedKey = useFormFields(([fields]) =>
    SOURCE_KEYS.map((key) => String(fields[`sources.${key}`]?.initialValue ?? '')).join(SEPARATOR),
  );
  const formPins = useFormFields(([fields]) => fields['pins']?.value);
  const pins = pinsOverride === undefined ? formPins : pinsOverride;

  return useMemo(() => {
    const typed = record(typedKey);
    const saved = record(savedKey);
    const valid = SOURCE_KEYS.every((key) => toHex(typed[key]) !== null);
    const { brand } = toAppearance({ sources: typed, pins }).appearance;
    return { typed, saved, valid, brand };
  }, [typedKey, savedKey, pins]);
}

function record(joined: string): Record<SourceKey, string> {
  const values = joined.split(SEPARATOR);
  return Object.fromEntries(SOURCE_KEYS.map((key, i) => [key, values[i] ?? ''])) as Record<
    SourceKey,
    string
  >;
}

/** A derived colour set by hand at a colour. */
export function editorPin(pins: Pins, key: keyof Pins, value: Hex): Pins {
  return { ...pins, [key]: value };
}

/** A derived colour handed back: to its designed value or its rule, whichever applies. */
export function withoutPin(pins: Pins, key: keyof Pins): Pins {
  const next = { ...pins };
  delete next[key];
  return next;
}
