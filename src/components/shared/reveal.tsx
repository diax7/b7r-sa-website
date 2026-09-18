import type { ComponentPropsWithoutRef, CSSProperties, ElementType } from 'react';

interface RevealProps extends ComponentPropsWithoutRef<'div'> {
  as?: ElementType;
  /** Stagger index inside a group: delay = index * 60 ms (BRD 3.7). */
  index?: number;
}

/**
 * One element that fades up 12 px over 400 ms, once, when it scrolls into view (BRD 3.7,
 * ADR-055). Renders `data-reveal`; the site's observer (`modules/core/reveal-arm`)
 * does the work, so this is a server component and costs no JavaScript of its own. A group
 * of siblings staggers by itself with `data-reveal-stagger` on the parent; `index` is for
 * a hand-placed stagger. Never wrap hero content.
 */
export function Reveal({ as, index, style, ...rest }: RevealProps) {
  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag
      data-reveal=""
      style={index === undefined ? style : ({ '--i': index, ...style } as CSSProperties)}
      {...rest}
    />
  );
}
