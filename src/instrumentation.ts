/**
 * Runs once when the server starts (not at build). In the CranL runtime the production env
 * contract is asserted here so a misconfigured deploy fails its health check instead of
 * serving with integrations silently off (BRD 8.5, plan 1c §G).
 *
 * Then Payload starts, and with it the jobs cron, outside any request (ADR-066): a cron born
 * inside a request's render inherits that request's store, and `revalidatePath` throws in
 * every job tick after it. Not awaited: Next waits for `register()` before it serves, and an
 * unreachable database must not hold the server back. A request that arrives meanwhile waits
 * on the same start.
 */
export async function register() {
  if (process.env['NEXT_RUNTIME'] !== 'nodejs') return;
  const { assertProductionEnv } = await import('@/lib/env-server');
  assertProductionEnv();
  const { isBuildPhase } = await import('@/lib/cms/env');
  if (isBuildPhase()) return;
  const { cms } = await import('@/lib/cms/payload');
  void cms().catch((error: unknown) => {
    console.error(
      `Payload did not start at boot (${bootFailure(error)}); the first request starts it, and the jobs cron then runs inside that request's context (ADR-066).`,
    );
  });
}

/** The error's name and, when it has one, its code (`ECONNREFUSED`, `28P01`): never its message. */
function bootFailure(error: unknown): string {
  if (!(error instanceof Error)) return 'an unknown error';
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? `${error.name} ${code}` : error.name;
}
