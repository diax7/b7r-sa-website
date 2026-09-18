import type { SVGProps } from 'react';
import { cn } from '@/lib/cn';

/**
 * One official brand glyph (a Simple Icons path, CC0), inlined so it inherits `currentColor`.
 * Never mirrored in RTL (BRD 3.12.6). Decorative unless an `aria-label` is passed. The glyphs
 * live in `brand-icons.tsx`; WhatsApp has its own module because the client bundle of every
 * page carries it (the widget, the error boundary) and must not carry the other three.
 */
export type BrandIconProps = SVGProps<SVGSVGElement> & { size?: number };

export function Brand({ d, size = 20, className, ...rest }: BrandIconProps & { d: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden={rest['aria-label'] ? undefined : true}
      focusable="false"
      className={cn('shrink-0', className)}
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}
