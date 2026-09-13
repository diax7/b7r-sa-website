import { notFound } from 'next/navigation';

/**
 * With two root layouts (the site and the Payload admin) Next has no single root
 * `not-found.tsx`; this catch-all routes every unknown site path to the site's own 404
 * (`(site)/not-found.tsx`, HTTP 404), inside the site layout.
 */
export default function MissingRoute() {
  notFound();
}
