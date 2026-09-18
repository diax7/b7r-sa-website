import { generateText } from 'ai';
import type { Payload } from 'payload';
import { createRateLimiter } from '@/lib/rate-limit';
import {
  type ConnectionKind,
  type ConnectionSpec,
  KINDS,
  mockAllowed,
} from '@/modules/connections/kinds';
import { languageModel } from '@/modules/connections/model';
import { readConnection } from '@/modules/connections/read';
import { safeMessage } from '@/modules/connections/safe-message';

export const TEST_TIMEOUT_MS = 20_000;

/** A service kind's test (ADR-049): the secret in, a sentence out, or a throw. */
export type ServiceTest = (secret: string | null) => Promise<string>;
export type ServiceTests = Partial<Record<ConnectionKind, ServiceTest>>;
/**
 * The reply's size: OpenAI's Responses API (the `openai` kind) refuses fewer than 16 output
 * tokens; 32 leaves a thinking model room for one word and keeps the cost of a test bounded.
 */
export const TEST_MAX_OUTPUT_TOKENS = 32;
/** One test per connection per ten seconds; one container (ADR-033), so a map is enough. */
const limiter = createRateLimiter(1, 10_000);

export type TestResult =
  | { ok: true; message: string }
  | { ok: false; message: string; status: 400 | 404 | 429 | 502 };

/**
 * One short call: for an AI kind 32 output tokens, 20 s, no retry, a reply of any kind is a
 * working connection; for a service kind, the call its client makes (handed in by the route,
 * since the visibility module owns the clients and depends on this one), with that kind's own
 * timeout.
 */
async function ping(spec: ConnectionSpec, services: ServiceTests): Promise<string> {
  if (KINDS[spec.kind].speaks === 'service') {
    const test = services[spec.kind];
    if (!test) throw new Error(`no test for the kind ${spec.kind}`);
    if (!spec.apiKey && spec.kind !== 'pagespeed')
      throw new Error('no key saved on this connection');
    return test(spec.apiKey);
  }
  if (spec.kind === 'mock') {
    if (!mockAllowed()) throw new Error('mock kind: not enabled on this server');
    return 'mock';
  }
  if (!spec.apiKey) throw new Error('no API key saved on this connection');
  if (!spec.model) throw new Error('no model id on this connection');
  const model = languageModel({
    kind: spec.kind,
    model: spec.model,
    apiKey: spec.apiKey,
    baseUrl: spec.baseUrl,
  });
  await generateText({
    model,
    prompt: 'Reply with the single word: ok',
    maxOutputTokens: TEST_MAX_OUTPUT_TOKENS,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(TEST_TIMEOUT_MS),
  });
  return spec.model;
}

/**
 * Tests a saved connection and records the outcome on it (ADR-047): `lastTestAt`,
 * `lastTestOk`, `lastTestMessage` (the model id on success, the vendor's message on failure).
 * A Test is not a run: nothing lands in `ai-runs` and nothing counts against the limit.
 */
export async function testConnection(
  payload: Payload,
  id: number,
  services: ServiceTests = {},
): Promise<TestResult> {
  if (!limiter.hit(`connection:${id}`).allowed) {
    return { ok: false, status: 429, message: 'Tested a moment ago; wait ten seconds' };
  }
  const spec = await readConnection(payload, id);
  if (!spec) return { ok: false, status: 404, message: 'No such connection' };
  let result: TestResult;
  try {
    result = { ok: true, message: await ping(spec, services) };
  } catch (error) {
    result = { ok: false, status: 502, message: safeMessage(error, spec.apiKey) };
  }
  await payload.update({
    collection: 'connections',
    id,
    data: {
      lastTestAt: new Date().toISOString(),
      lastTestOk: result.ok,
      lastTestMessage: result.message,
    },
    depth: 0,
    overrideAccess: true,
  });
  return result;
}
