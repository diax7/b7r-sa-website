'use client';

import { lazy, type ReactNode } from 'react';
import type { BookingIslandProps } from '@/modules/bookings/booker/booking-island';
import type { ManageIslandProps } from '@/modules/bookings/booker/manage-island';
import { NearViewport } from '@/modules/core/lazy-mount';

// The `import()` in a client module keeps the booker, its form, the menu and the Turnstile
// hook out of every route's first-paint JS; the server-rendered stand-in stays on screen
// until the island mounts: at once on `/book` (the card is the hero) and on the manage
// page, near the viewport in the contact card.
const BookingIsland = lazy(() =>
  import('@/modules/bookings/booker/booking-island').then((m) => ({ default: m.BookingIsland })),
);
const ManageIsland = lazy(() =>
  import('@/modules/bookings/booker/manage-island').then((m) => ({ default: m.ManageIsland })),
);

/** Mounts the booking island over its stand-in: eagerly on the page, near the viewport in the card. */
export function BookingLoader({
  fallback,
  eager,
  ...props
}: BookingIslandProps & { fallback: ReactNode; eager: boolean }) {
  return (
    <NearViewport fallback={fallback} eager={eager}>
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
