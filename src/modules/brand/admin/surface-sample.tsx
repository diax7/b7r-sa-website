'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

export interface SampleColours {
  background: { backgroundColor: string; backgroundImage: string };
  text: string;
  textMuted: string;
  link: string;
  /** The call to action on it: its fill and its words. */
  button: { fill: string; words: string };
}

/**
 * A background set as a visitor meets it (spec 010, phase 1c): the background with its
 * gradient and grain, a heading, a line of body text, a line of secondary text, a link and
 * the call to action, each in the set's own colour. The colours are the set's values, drawn
 * inline because they are the editor's data, not the panel's theme. Decorative: the words
 * are samples, so the block is hidden from assistive technology and the verdict beside it
 * carries the meaning.
 */
export function SurfaceSample({
  colours,
  children,
}: {
  colours: SampleColours;
  children?: ReactNode;
}) {
  const s = useAdminStrings().appearance.surfaces.preview;
  const box: CSSProperties = {
    backgroundColor: colours.background.backgroundColor,
    backgroundImage: colours.background.backgroundImage,
    color: colours.text,
  };
  return (
    <div
      aria-hidden="true"
      className="flex min-h-40 flex-col justify-center gap-2 rounded-base border border-border p-5"
      style={box}
      data-admin-surface-sample=""
    >
      <span className="text-h4 font-bold">{s.heading}</span>
      <span className="text-small">{s.text}</span>
      <span className="text-small" style={{ color: colours.textMuted }}>
        {s.muted}
      </span>
      <div className="mt-1 flex flex-wrap items-center gap-4">
        <span className="text-small font-medium underline" style={{ color: colours.link }}>
          {s.link}
        </span>
        <span
          className="rounded-inner px-4 py-2 text-small font-medium"
          style={{ backgroundColor: colours.button.fill, color: colours.button.words }}
        >
          {s.button}
        </span>
      </div>
      {children}
    </div>
  );
}
