import { cn } from '@/lib/cn';

export type WaveFill = 'primary' | 'navy';

const FILL: Record<WaveFill, string> = {
  primary: 'fill-primary',
  navy: 'fill-navy',
};

/** The layers' paths in the SVG's 2880 × 48 box: a lighter wave of amplitude 12 and a solid
 *  one of amplitude 8, in antiphase. */
const RISE = {
  // The colour above each curve: the footer's navy rising into the band (turned over).
  lighter:
    'M0 24 C120 12 240 12 360 24 S600 36 720 24 S960 12 1080 24 S1320 36 1440 24 S1680 12 1800 24 S2040 36 2160 24 S2400 12 2520 24 S2760 36 2880 24 L2880 0 L0 0 Z',
  solid:
    'M0 24 C120 32 240 32 360 24 S600 16 720 24 S960 32 1080 24 S1320 16 1440 24 S1680 32 1800 24 S2040 16 2160 24 S2400 32 2520 24 S2760 16 2880 24 L2880 0 L0 0 Z',
};

/**
 * The colour below the curves: the band rising into the section above, which shows over them.
 * The lighter layer lies below the solid wave's curve and the solid layer below the lower of
 * the two curves (the solid wave's troughs, then the lighter's), so a still frame has the pixels
 * the wave drew when it filled the section's colour down into the band (spec 010, phase 2).
 */
const FALL = {
  lighter:
    'M0 24 C120 32 240 32 360 24 S600 16 720 24 S960 32 1080 24 S1320 16 1440 24 S1680 32 1800 24 S2040 16 2160 24 S2400 32 2520 24 S2760 16 2880 24 L2880 48 L0 48 Z',
  solid:
    'M0 24 C120 32 240 32 360 24 C480 36 600 36 720 24 C840 32 960 32 1080 24 C1200 36 1320 36 1440 24 C1560 32 1680 32 1800 24 C1920 36 2040 36 2160 24 C2280 32 2400 32 2520 24 C2640 36 2760 36 2880 24 L2880 48 L0 48 Z',
};

interface WaveDividerProps {
  /** Colour of the band the wave rises from. */
  fill: WaveFill;
  /**
   * The edge of its parent the box sits at. At `top` the band's colour rises from the box's
   * lower edge and the rest is see-through, so the section above shows over the wave whatever it
   * paints (a set of its own, a gradient, grain); at `bottom` the footer's navy rises into the
   * band.
   */
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
  const paths = position === 'top' ? FALL : RISE;
  // The lighter layer: the footer's navy over the band at 60 %; at the top, the band's blue
  // over the section above at 40 %, the blend of the section's colour at 60 % over the blue.
  const lighter = position === 'top' ? '0.4' : '0.6';
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
        opacity={lighter}
      >
        <path d={paths.lighter} />
      </svg>
      <svg
        className={cn(
          'absolute top-0 start-0 h-full w-[200%] max-w-none animate-wave-reverse motion-reduce:animate-none',
          cls,
        )}
        viewBox="0 0 2880 48"
        preserveAspectRatio="none"
      >
        <path d={paths.solid} />
      </svg>
    </div>
  );
}
