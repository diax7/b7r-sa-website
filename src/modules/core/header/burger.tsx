import { cn } from '@/lib/cn';

/** Three 2 px lines, 18 px wide, morphing into an X over 300 ms (BRD 6.2). */
export function Burger({ open }: { open: boolean }) {
  const line =
    'absolute start-0 h-0.5 w-[18px] rounded-pill bg-current transition-transform duration-(--duration-slow) ease-(--ease-standard)';
  return (
    <span aria-hidden="true" className="relative block h-[14px] w-[18px]">
      <span className={cn(line, 'top-0', open && 'translate-y-[6px] rotate-45')} />
      <span className={cn(line, 'top-[6px] transition-opacity', open && 'opacity-0')} />
      <span className={cn(line, 'top-[12px]', open && '-translate-y-[6px] -rotate-45')} />
    </span>
  );
}

export const burgerButtonClass =
  'grid size-11 place-items-center rounded-base text-text transition-colors duration-(--duration-fast) hover:bg-accent-tint hover:text-primary lg:hidden';
