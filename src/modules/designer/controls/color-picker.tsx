'use client';

import type { ProductColor } from '@/content/schema';
import { cn } from '@/lib/cn';

interface ColorPickerProps {
  colors: ProductColor[];
  value: string;
  onChange: (slug: string) => void;
  label: string;
  /** "اللون {color}" template for each swatch's accessible name. */
  optionLabel: string;
}

/** 28 px colour swatches with a 2 px ring on selection (BRD 6.4.3). */
export function ColorPicker({ colors, value, onChange, label, optionLabel }: ColorPickerProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-small font-medium text-text">{label}</legend>
      <div className="flex items-center gap-3">
        {colors.map((color) => {
          const checked = color.slug === value;
          return (
            <label
              key={color.slug}
              className={cn(
                'relative grid size-11 cursor-pointer place-items-center rounded-pill',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/50',
              )}
              title={color.name}
            >
              <input
                type="radio"
                name="designer-color"
                value={color.slug}
                checked={checked}
                onChange={() => onChange(color.slug)}
                aria-label={optionLabel.replace('{color}', color.name)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'block size-7 rounded-pill border border-border transition-[box-shadow] duration-(--duration-fast)',
                  checked && 'ring-2 ring-primary ring-offset-2 ring-offset-surface',
                )}
                // Swatch colours are product data (BRD Appendix A), not a design token.
                style={{ backgroundColor: color.hex }}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
