import { ICS_FILENAME } from '@/lib/booking-mail';
import { cms } from '@/lib/cms/payload';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import {
  bookingPorts,
  icsFor,
  MANAGE_RATE_LIMIT,
  MANAGE_WINDOW_MS,
  routeFailure,
} from '@/modules/bookings';

export const dynamic = 'force-dynamic';

const limiter = createRateLimiter(MANAGE_RATE_LIMIT, MANAGE_WINDOW_MS);

/** The calendar file of an active booking (ADR-062), by the same signed token as the manage link. */
export async function GET(req: Request) {
  const hit = limiter.hit(clientIp(req.headers));
  if (!hit.allowed) {
    return new Response(null, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(hit.retryAfterMs / 1000)) },
    });
  }
  const token = new URL(req.url).searchParams.get('token');
  const payload = await cms();
  let ics: string | null;
  try {
    ics = await icsFor(await bookingPorts(payload), token);
  } catch (error) {
    return routeFailure(payload.logger, 'GET /api/bookings/ics', error);
  }
  if (!ics) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${ICS_FILENAME}"`,
      'Cache-Control': 'no-store',
    },
  });
}
