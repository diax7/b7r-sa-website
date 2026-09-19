import { NextResponse } from 'next/server';
import { cms } from '@/lib/cms/payload';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';
import { acceptsJsonFrom } from '@/lib/request-guards';
import {
  bookingPorts,
  cancel,
  MANAGE_RATE_LIMIT,
  MANAGE_WINDOW_MS,
  manageBodySchema,
  type ManageResult,
  readManage,
  reschedule,
  routeFailure,
} from '@/modules/bookings';

export const dynamic = 'force-dynamic';

const limiter = createRateLimiter(MANAGE_RATE_LIMIT, MANAGE_WINDOW_MS);

const NO_STORE = { 'Cache-Control': 'no-store' };

function limited(req: Request): NextResponse | null {
  const hit = limiter.hit(clientIp(req.headers));
  if (hit.allowed) return null;
  return NextResponse.json(
    { ok: false, error: 'rate_limited' },
    { status: 429, headers: { 'Retry-After': String(Math.ceil(hit.retryAfterMs / 1000)) } },
  );
}

function answer(result: ManageResult): NextResponse {
  if (result.status === 200) {
    return NextResponse.json({ ok: true, booking: result.booking }, { headers: NO_STORE });
  }
  const error = 'error' in result ? result.error : 'not_found';
  return NextResponse.json({ ok: false, error }, { status: result.status, headers: NO_STORE });
}

/**
 * The merchant's manage link (ADR-062): the signed token names the row; the row's status
 * and end decide (a cancelled or past booking refuses every action; the link lives a day
 * past the end). GET reads the booking for the page; POST moves it under the notice rule
 * or cancels it until the start; each answer is private (`no-store`).
 */
export async function GET(req: Request) {
  const refused = limited(req);
  if (refused) return refused;
  const token = new URL(req.url).searchParams.get('token');
  const payload = await cms();
  try {
    return answer(await readManage(await bookingPorts(payload), token));
  } catch (error) {
    return routeFailure(payload.logger, 'GET /api/bookings/manage', error);
  }
}

export async function POST(req: Request) {
  if (!acceptsJsonFrom(req)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  const refused = limited(req);
  if (refused) return refused;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  const parsed = manageBodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  const payload = await cms();
  const { data } = parsed;
  try {
    const ports = await bookingPorts(payload);
    return answer(
      data.action === 'reschedule'
        ? await reschedule(ports, data.token, data.start)
        : await cancel(ports, data.token),
    );
  } catch (error) {
    // Rule 18: the error's name alone; a failed query's message carries the row's fields.
    return routeFailure(payload.logger, 'POST /api/bookings/manage', error);
  }
}
