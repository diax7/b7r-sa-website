import type { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Lucide icons whose meaning depends on reading direction (§3.8, §3.12.6). */
const MIRRORED = new Set([
  'ArrowRight',
  'ArrowLeft',
  'ChevronRight',
  'ChevronLeft',
  'ChevronsRight',
  'ChevronsLeft',
  'ExternalLink',
  'Undo2',
  'Redo2',
  'CornerDownLeft',
  'CornerDownRight',
]);

interface IconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon;
  /** Force mirroring on/off; by default inferred from the icon's display name. */
  mirror?: boolean;
}

/**
 * RTL-aware Lucide wrapper: 24 px, 1.75 stroke, colour inherits. Directional icons are
 * flipped under `dir="rtl"` through the `mirror-rtl` utility; non-directional icons are not.
 * Decorative by default (`aria-hidden`); pass `aria-label` to make one meaningful.
 */
export function Icon({
  icon: Lucide,
  mirror,
  className,
  size = 24,
  strokeWidth = 1.75,
  ...rest
}: IconProps) {
  const shouldMirror = mirror ?? MIRRORED.has(Lucide.displayName ?? '');
  return (
    <Lucide
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={rest['aria-label'] ? undefined : true}
      focusable="false"
      className={cn('shrink-0', shouldMirror && 'mirror-rtl', className)}
      {...rest}
    />
  );
}
