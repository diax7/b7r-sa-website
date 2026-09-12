import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge must know the project's custom type-scale names (BRD 3.3) are font sizes;
 * otherwise `text-button-lg` and `text-primary` look like the same group and one is dropped.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'h1',
            'h2',
            'h3',
            'h4',
            'lead',
            'body',
            'small',
            'caption',
            'button',
            'button-lg',
          ],
        },
      ],
    },
  },
});

/** Merge Tailwind class lists without duplicate utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
