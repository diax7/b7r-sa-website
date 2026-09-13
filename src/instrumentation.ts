/**
 * Runs once when the server starts (not at build). In the CranL runtime the production env
 * contract is asserted here so a misconfigured deploy fails its health check instead of
 * serving with integrations silently off (BRD 8.5, plan 1c §G).
 */
export async function register() {
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    const { assertProductionEnv } = await import('@/lib/env-server');
    assertProductionEnv();
  }
}
