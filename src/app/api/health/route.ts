import { NextResponse } from 'next/server';
import { healthReport } from '@/lib/cms/health';

export const dynamic = 'force-dynamic';

/**
 * Liveness endpoint for the container health check (BRD 8.6, 8.11): `ok` is true whenever
 * the process answers; the other fields say what is wired so a mocked, unconfigured or
 * disconnected production is visible at a glance. The dashboard shows the same report.
 */
export async function GET() {
  return NextResponse.json(await healthReport());
}
