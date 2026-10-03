import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cms = vi.fn<() => Promise<unknown>>();
const assertProductionEnv = vi.fn();

vi.mock('@/lib/cms/payload', () => ({ cms }));
vi.mock('@/lib/env-server', () => ({ assertProductionEnv }));

const { register } = await import('@/instrumentation');

/** Lets the boot's fire-and-forget promise settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('the server start (ADR-066)', () => {
  beforeEach(() => {
    cms.mockReset();
    assertProductionEnv.mockReset();
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('NEXT_PHASE', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('asserts the production env, then starts Payload and its cron outside any request', async () => {
    const order: string[] = [];
    assertProductionEnv.mockImplementation(() => order.push('assert'));
    cms.mockImplementation(async () => order.push('cms'));
    await register();
    expect(order).toEqual(['assert', 'cms']);
  });

  it('does not wait for Payload: a slow database never holds the server back', async () => {
    cms.mockReturnValue(new Promise(() => {}));
    await expect(register()).resolves.toBeUndefined();
    expect(cms).toHaveBeenCalledOnce();
  });

  it('logs a start that fails by its name and still resolves', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const refused = Object.assign(new Error('connect ECONNREFUSED 10.0.0.5:5432'), {
      name: 'ConnectionError',
      code: 'ECONNREFUSED',
    });
    cms.mockRejectedValue(refused);
    await expect(register()).resolves.toBeUndefined();
    await settle();
    expect(error).toHaveBeenCalledOnce();
    const line = String(error.mock.calls[0]![0]);
    expect(line).toMatch(/did not start at boot \(ConnectionError ECONNREFUSED\)/);
    expect(line).not.toContain('10.0.0.5');
  });

  it('starts nothing during the build or in the edge runtime', async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    await register();
    expect(cms).not.toHaveBeenCalled();
    // The env check runs at build as it always has; only Payload waits for the server.
    expect(assertProductionEnv).toHaveBeenCalledOnce();
    assertProductionEnv.mockClear();
    vi.stubEnv('NEXT_PHASE', '');
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    await register();
    expect(cms).not.toHaveBeenCalled();
    expect(assertProductionEnv).not.toHaveBeenCalled();
  });
});
