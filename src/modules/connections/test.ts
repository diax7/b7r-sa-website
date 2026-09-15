import { generateText } from 'ai';
import type { Payload } from 'payload';
import { createRateLimiter } from '@/lib/rate-limit';
import { type ConnectionSpec, mockAllowed } from '@/modules/connections/kinds';
import { languageModel } from '@/modules/connections/model';
import { readConnection } from '@/modules/connections/read';

export const TEST_TIMEOUT_MS = 20_000;
export const TEST_MESSAGE_MAX = 200;
/** One test per connection per ten seconds; one container (ADR-033), so a map is enough. */
const limiter = createRateLimiter(1, 10_000);

export type TestResult =
  | { ok: true; message: string }
  | { ok: false; message: string; status: 400 | 404 | 429 | 502 };

/**
 * A vendor's error as the admin may see it: one line, at most 200 characters, never the key
 * and never a URL (a query string may carry a key). The stored message is the same line.
 */
export function safeMessage(error: unknown, apiKey: string | null): string {
  const raw = error instanceof Error ? error.message : String(error);
  let text = raw
    .replace(/https?:\/\/\S+/g, '[url]')
    .replace(/\s+/g, ' ')
    .trim();
  if (apiKey && apiKey.length >= 8) text = text.replaceAll(apiKey, '[key]');
  if (!text) text = 'the call failed with no message';
  return text.length > TEST_MESSAGE_MAX ? `${text.slice(0, TEST_MESSAGE_MAX - 1)}…` : text;
}

/** One short call (`maxOutputTokens: 8`, 20 s): a reply of any kind is a working connection. */
async function ping(spec: ConnectionSpec): Promise<string> {
  if (spec.kind === 'mock') {
    if (!mockAllowed()) throw new Error('the mock kind needs AI_CONTENT_MOCK=1');
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
    maxOutputTokens: 8,
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
export async function testConnection(payload: Payload, id: number): Promise<TestResult> {
  if (!limiter.hit(`connection:${id}`).allowed) {
    return { ok: false, status: 429, message: 'Tested a moment ago; wait ten seconds' };
  }
  const spec = await readConnection(payload, id);
  if (!spec) return { ok: false, status: 404, message: 'No such connection' };
  let result: TestResult;
  try {
    result = { ok: true, message: await ping(spec) };
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
