import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cn } from '@/lib/cn';

type ContainerProps<T extends ElementType> = {
  as?: T;
  prose?: boolean;
} & ComponentPropsWithoutRef<T>;

/** Page container (§3.4): max 1280 px, side padding 24 px (16 px below 640 px). */
export function Container<T extends ElementType = 'div'>({
  as,
  prose,
  className,
  ...rest
}: ContainerProps<T>) {
  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag
      className={cn(
        'mx-auto w-full px-4 sm:px-6',
        prose ? 'max-w-(--container-prose)' : 'max-w-(--container-page)',
        className,
      )}
      {...rest}
    />
  );
}
