'use client';

import { lazy, type ReactNode } from 'react';
import type { BookingIslandProps } from '@/modules/bookings/picker/booking-island';
import type { ManageIslandProps } from '@/modules/bookings/picker/manage-island';
import { NearViewport } from '@/modules/core/lazy-mount';

// The `import()` in a client module keeps the picker, its form and the Turnstile hook out of
// every route's first-paint JS (the contact page shows the same island inline); the
// server-rendered stand-in stays on screen until the island mounts near the viewport.
const BookingIsland = lazy(() =>
  import('@/modules/bookings/picker/booking-island').then((m) => ({ default: m.BookingIsland })),
);
const ManageIsland = lazy(() =>
  import('@/modules/bookings/picker/manage-island').then((m) => ({ default: m.ManageIsland })),
);

/** Mounts the booking island near the viewport over its server-rendered stand-in. */
export function BookingLoader({
  fallback,
  ...props
}: BookingIslandProps & { fallback: ReactNode }) {
  return (
    <NearViewport fallback={fallback}>
      <BookingIsland {...props} />
    </NearViewport>
  );
}

/** The manage page is the island: it mounts at once (the token is in the URL). */
export function ManageLoader({ fallback, ...props }: ManageIslandProps & { fallback: ReactNode }) {
  return (
    <NearViewport fallback={fallback} eager>
      <ManageIsland {...props} />
    </NearViewport>
  );
}
