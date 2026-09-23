import type { BrandTokens } from '@/modules/brand/css';
import { SURFACE } from '@/modules/brand/defaults';
import { type BuiltInSurface, type SurfaceSet, surfaceStyle } from '@/modules/brand/surfaces';

/** What a background set paints, as a sample draws it: its background and the colours on it. */
export interface SampleColours {
  background: { backgroundColor: string; backgroundImage: string };
  text: string;
  textMuted: string;
  link: string;
  /** The call to action on it: its fill and its words. */
  button: { fill: string; words: string };
}

/** A set built from the brand, from the tokens (`globals.css` paints the same). */
export function builtInColours(set: BuiltInSurface, tokens: BrandTokens): SampleColours {
  const token = (name: string) => tokens[`color-${name}`] ?? SURFACE;
  if (set === 'deep-sea') {
    return {
      background: { backgroundColor: token('navy'), backgroundImage: 'none' },
      text: SURFACE,
      textMuted: token('accent-tint'),
      link: token('accent-tint'),
      button: { fill: SURFACE, words: token('primary') },
    };
  }
  return {
    background: {
      backgroundColor: token(set === 'ground' ? 'ground' : 'surface'),
      backgroundImage: 'none',
    },
    text: token('text'),
    textMuted: token('text-muted'),
    link: token('primary'),
    button: { fill: token('primary'), words: SURFACE },
  };
}

/** A library set: its own colours, and the page's primary for its button. */
export function libraryColours(set: SurfaceSet, tokens: BrandTokens): SampleColours {
  const primary = tokens['color-primary'] ?? set.link;
  return {
    background: surfaceStyle(set),
    text: set.text,
    textMuted: set.textMuted,
    link: set.link,
    button:
      set.button === 'inverse'
        ? { fill: SURFACE, words: primary }
        : { fill: primary, words: SURFACE },
  };
}
