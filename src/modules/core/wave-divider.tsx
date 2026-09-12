import { cn } from '@/lib/cn';

export type WaveFill = 'surface' | 'ground' | 'primary' | 'navy';

const FILL: Record<WaveFill, string> = {
  surface: 'fill-surface',
  ground: 'fill-ground',
  primary: 'fill-primary',
  navy: 'fill-navy',
};

interface WaveDividerProps {
  /** Colour of the section the wave belongs to (it "eats" into the neighbour). */
  fill: WaveFill;
  /** `top` sits at the top edge of its parent, `bottom` at the bottom edge, flipped. */
  position: 'top' | 'bottom';
  className?: string;
}

/**
 * The sea motif (BRD 6.3.4): two overlapping wave layers, amplitude 12 px, 48 px tall on
 * desktop and 32 px on mobile. The SVG is drawn at two periods and each layer translates by
 * one period over 20 s in opposite directions for a seamless loop; static under reduced
 * motion. The only place the wave animates.
 */
export function WaveDivider({ fill, position, className }: WaveDividerProps) {
  const cls = FILL[fill];
  return (
    <div
      aria-hidden="true"
      // The SVG is 200 % wide and drifts by one period; anchoring it at the physical left
      // (via a local LTR context) keeps the container covered for the whole loop.
      dir="ltr"
      className={cn(
        'pointer-events-none absolute start-0 end-0 z-10 h-8 overflow-hidden md:h-12',
        position === 'top' ? 'top-0' : 'bottom-0 rotate-180',
        className,
      )}
    >
      <svg
        className={cn(
          'absolute top-0 start-0 h-full w-[200%] max-w-none animate-wave motion-reduce:animate-none',
          cls,
        )}
        viewBox="0 0 2880 48"
        preserveAspectRatio="none"
        opacity="0.6"
      >
        <path d="M0 24 C120 12 240 12 360 24 S600 36 720 24 S960 12 1080 24 S1320 36 1440 24 S1680 12 1800 24 S2040 36 2160 24 S2400 12 2520 24 S2760 36 2880 24 L2880 0 L0 0 Z" />
      </svg>
      <svg
        className={cn(
          'absolute top-0 start-0 h-full w-[200%] max-w-none animate-wave-reverse motion-reduce:animate-none',
          cls,
        )}
        viewBox="0 0 2880 48"
        preserveAspectRatio="none"
      >
        <path d="M0 24 C120 32 240 32 360 24 S600 16 720 24 S960 32 1080 24 S1320 16 1440 24 S1680 32 1800 24 S2040 16 2160 24 S2400 32 2520 24 S2760 16 2880 24 L2880 0 L0 0 Z" />
      </svg>
    </div>
  );
}
