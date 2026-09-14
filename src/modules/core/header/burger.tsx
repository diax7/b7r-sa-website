import { cn } from '@/lib/cn';

const line = 'absolute start-0 h-0.5 w-[18px] rounded-pill bg-current';

/**
 * Three 2 px lines, 18 px wide (BRD 6.2). `open` draws the X. `morph` (inside the sheet,
 * ADR-044) animates the lines from the burger into the X while the sheet's `data-state` is
 * open and back while it closes, on the same tokens as the sheet's own fade, so the eye
 * reads one control morphing both ways. Under reduced motion the X shows at once.
 */
export function Burger({ open, morph = false }: { open: boolean; morph?: boolean }) {
  const animated = 'motion-reduce:animate-none';
  return (
    <span aria-hidden="true" className="relative block h-[14px] w-[18px]">
      <span
        className={cn(
          line,
          'top-0',
          open && 'translate-y-[6px] rotate-45',
          morph &&
            `${animated} group-data-[state=open]:animate-burger-top-in group-data-[state=closed]:animate-burger-top-out`,
        )}
      />
      <span
        className={cn(
          line,
          'top-[6px]',
          open && 'opacity-0',
          morph &&
            `${animated} group-data-[state=open]:animate-fade-out group-data-[state=closed]:animate-fade-in`,
        )}
      />
      <span
        className={cn(
          line,
          'top-[12px]',
          open && '-translate-y-[6px] -rotate-45',
          morph &&
            `${animated} group-data-[state=open]:animate-burger-bottom-in group-data-[state=closed]:animate-burger-bottom-out`,
        )}
      />
    </span>
  );
}

export const burgerButtonClass =
  'grid size-11 place-items-center rounded-base text-text transition-colors duration-(--duration-fast) hover:bg-accent-tint hover:text-primary lg:hidden';
