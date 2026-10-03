import { NoObjectGeneratedError, RetryError } from 'ai';
import { addUsage, type Usage, ZERO_USAGE } from '@/modules/ai-content/cost';
import type { ObjectRequest, Provider } from '@/modules/ai-content/provider/types';

/** The waits before the second and the third attempt of one model call (ADR-066). */
export const RETRY_WAITS_MS: readonly number[] = [3_000, 10_000];

/**
 * Whether a fresh attempt can fix a model call's failure: the SDK gave up after its own two
 * retries of a 429 or a 5xx, the 120 s timeout fired, or the model returned no object that
 * fits the schema. A bad key or a bad request (the SDK's `errorNotRetryable`, a plain
 * `APICallError`), the engine's own refusals and anything else fail at once.
 */
export function retryable(error: unknown): boolean {
  if (RetryError.isInstance(error)) return error.reason === 'maxRetriesExceeded';
  if (NoObjectGeneratedError.isInstance(error)) return true;
  // `AbortSignal.timeout` rejects with a DOMException, which is not an `Error` everywhere.
  const name =
    typeof error === 'object' && error !== null ? (error as { name?: unknown }).name : null;
  return name === 'TimeoutError' || name === 'AbortError';
}

/** The tokens a failed attempt still spent: the SDK reports them on a schema miss only. */
function spentBy(error: unknown): Usage {
  if (!NoObjectGeneratedError.isInstance(error) || !error.usage) return ZERO_USAGE;
  return {
    inputTokens: error.usage.inputTokens ?? 0,
    outputTokens: error.usage.outputTokens ?? 0,
  };
}

export interface RetryOptions {
  sleep?: (ms: number) => Promise<void>;
  waits?: readonly number[];
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The provider with each model call retried in process (ADR-066): the inline task's own
 * retries never ran, since the pipeline records a failure instead of throwing it to the job.
 * Only the model calls are retried, never a store write. A failed attempt's tokens are added
 * to the usage of the attempt that succeeds; when every attempt fails they are lost with it.
 */
export function withRetries(provider: Provider, options: RetryOptions = {}): Provider {
  const sleep = options.sleep ?? wait;
  const waits = options.waits ?? RETRY_WAITS_MS;
  async function attempt<R extends { usage: Usage }>(call: () => Promise<R>): Promise<R> {
    let spent = ZERO_USAGE;
    for (let i = 0; ; i++) {
      try {
        // Each attempt waits on the one before it: sequential by nature.
        // oxlint-disable-next-line no-await-in-loop
        const result = await call();
        return { ...result, usage: addUsage(spent, result.usage) };
      } catch (error) {
        const pause = waits[i];
        if (pause === undefined || !retryable(error)) throw error;
        spent = addUsage(spent, spentBy(error));
        // oxlint-disable-next-line no-await-in-loop
        await sleep(pause);
      }
    }
  }
  return {
    ...provider,
    text: (req) => attempt(() => provider.text(req)),
    object: <T>(req: ObjectRequest<T>) => attempt(() => provider.object(req)),
  };
}
