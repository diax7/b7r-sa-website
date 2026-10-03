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
  const [{ isBuildPhase }, { cms }] = await Promise.all([
    import('@/lib/cms/env'),
    import('@/lib/cms/payload'),
  ]);
  if (isBuildPhase()) return;
  void cms().catch((error: unknown) => {
    const name = error instanceof Error ? error.name : 'an unknown error';
    console.error(
      `Payload did not start at boot (${name}); the first request starts it, and the jobs cron then runs inside that request's context (ADR-066).`,
    );
  });
}
