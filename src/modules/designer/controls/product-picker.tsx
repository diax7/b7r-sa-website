'use client';

import Image from 'next/image';
import type { Product } from '@/content/schema';
import { cn } from '@/lib/cn';
import { designerColorFor } from '@/lib/product-helpers';

interface ProductPickerProps {
  products: Product[];
  value: string;
  onChange: (product: Product) => void;
  label: string;
  groupLabel: string;
}

/**
 * Product chips with 32 px thumbnails (BRD 6.4.3), in the colour the mockup shows (white, or
 * the product's only colour) so the chip and the preview agree. Native radios inside labels
 * give the group arrow-key navigation and screen-reader semantics for free.
 */
export function ProductPicker({
  products,
  value,
  onChange,
  label,
  groupLabel,
}: ProductPickerProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-small font-medium text-text">{label}</legend>
      <span className="sr-only">{groupLabel}</span>
      <div className="flex flex-wrap gap-2">
        {products.map((product) => {
          const checked = product.slug === value;
          const thumbColor = designerColorFor(product);
          const thumb =
            product.colors.find((c) => c.slug === thumbColor)?.images.front ??
            product.colors[0]?.images.front ??
            '';
          return (
            <label
              key={product.slug}
              className={cn(
                'inline-flex h-11 cursor-pointer items-center gap-2 rounded-pill border bg-surface ps-1.5 pe-4 text-small font-medium transition-[border-color,background-color,color,box-shadow] duration-(--duration-base)',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/50',
                checked
                  ? 'border-primary bg-accent-tint text-primary'
                  : 'border-border text-text hover:border-text-muted/60',
              )}
            >
              <input
                type="radio"
                name="designer-product"
                value={product.slug}
                checked={checked}
                onChange={() => onChange(product)}
                className="sr-only"
              />
              <Image
                src={thumb}
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-pill object-cover"
              />
              {product.name}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
