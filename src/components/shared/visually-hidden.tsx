import type { ComponentPropsWithoutRef } from 'react';

/** Screen-reader-only text. */
export function VisuallyHidden(props: ComponentPropsWithoutRef<'span'>) {
  return <span className="sr-only" {...props} />;
}
