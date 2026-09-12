'use client';

import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
} from 'react';
import { cn } from '@/lib/cn';

interface RevealProps extends ComponentPropsWithoutRef<'div'> {
  as?: ElementType;
  /** Stagger index inside a group: delay = index * 60 ms (BRD 3.7). */
  index?: number;
}

/**
 * Scroll reveal: fade up 12 px over 400 ms, once, when 20 % visible (BRD 3.7). The hidden
 * state exists only under `html.js` (see globals.css), so content is always visible without
 * JS. Reduced motion disables it in CSS. Never wrap hero content.
 */
export function Reveal({ as, index = 0, className, style, ...rest }: RevealProps) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-visible');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-visible');
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn('reveal', className)}
      style={{ '--i': index, ...style } as CSSProperties}
      {...rest}
    />
  );
}
