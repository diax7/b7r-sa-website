import { APICallError, type LanguageModelUsage, NoObjectGeneratedError, RetryError } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { runPipeline } from '@/modules/ai-content/pipeline/run';
import { PipelineStop } from '@/modules/ai-content/pipeline/stop';
import type { PipelineContext } from '@/modules/ai-content/pipeline/types';
import { mockProvider } from '@/modules/ai-content/provider/mock';
import { retryable, withRetries } from '@/modules/ai-content/provider/retry';
import type { Provider, TextRequest } from '@/modules/ai-content/provider/types';
import { ontoRows } from '@/modules/ai-content/store/rows';
import { FACTS, memoryStore } from './helpers/engine-store';

const timeout = () => new DOMException('The operation timed out.', 'TimeoutError');

const apiError = (statusCode: number, isRetryable: boolean) =>
  new APICallError({
    message: `status ${statusCode}`,
    url: 'https://api.example.test/v1/responses',
    requestBodyValues: {},
    statusCode,
    isRetryable,
  });

const usage = (inputTokens: number, outputTokens: number): LanguageModelUsage => ({
  inputTokens,
  inputTokenDetails: {
    noCacheTokens: inputTokens,
    cacheReadTokens: undefined,
    cacheWriteTokens: undefined,
  },
  outputTokens,
  outputTokenDetails: { textTokens: outputTokens, reasoningTokens: undefined },
  totalTokens: inputTokens + outputTokens,
});

const schemaMiss = () =>
  new NoObjectGeneratedError({
    message: 'No object generated: response did not match schema.',
    text: '{}',
    response: { id: 'resp_1', timestamp: new Date(0), modelId: 'gpt-6.1-sol' },
    usage: usage(500, 100),
    finishReason: 'stop',
  });

const REQUEST: TextRequest = { step: 'draft', system: 's', prompt: 'p' };

/** A provider whose `text` throws the given errors in turn, then answers. */
function flaky(errors: unknown[]): Provider & { attempts: () => number } {
  let n = 0;
  return {
    name: 'openai',
    model: 'gpt-6.1-sol',
    attempts: () => n,
    async text() {
      const error = errors[n];
      n += 1;
      if (error !== undefined) throw error;
      return { text: 'ok', usage: { inputTokens: 1200, outputTokens: 900 } };
    },
    async object() {
      throw new Error('not used');
    },
  };
}

describe('model calls retried in process (ADR-066)', () => {
  it('retries what a fresh attempt can fix, and nothing else', () => {
    const exhausted = new RetryError({
      message: 'Failed after 3 attempts',
      reason: 'maxRetriesExceeded',
      errors: [apiError(503, true)],
    });
    const notRetryable = new RetryError({
      message: 'Failed after 2 attempts',
      reason: 'errorNotRetryable',
      errors: [apiError(429, true), apiError(401, false)],
    });
    expect(retryable(exhausted)).toBe(true);
    expect(retryable(timeout())).toBe(true);
    expect(retryable(new DOMException('aborted', 'AbortError'))).toBe(true);
    expect(retryable(schemaMiss())).toBe(true);
    expect(retryable(notRetryable)).toBe(false);
    expect(retryable(apiError(401, false))).toBe(false);
    expect(retryable(new PipelineStop('refused: an em dash', 'failed'))).toBe(false);
    expect(retryable(new Error('no API key on the connection "OpenAI"'))).toBe(false);
  });

  it('waits 3 s then 10 s between attempts and answers when one succeeds', async () => {
    const sleep = vi.fn(async (_ms: number) => {});
    const provider = flaky([timeout(), timeout()]);
    const result = await withRetries(provider, { sleep }).text(REQUEST);
    expect(result.text).toBe('ok');
    expect(provider.attempts()).toBe(3);
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([3_000, 10_000]);
  });

  it('gives up after the last wait with the error of the last attempt', async () => {
    const provider = flaky([timeout(), timeout(), timeout()]);
    const retried = withRetries(provider, { sleep: async () => {} });
    await expect(retried.text(REQUEST)).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(provider.attempts()).toBe(3);
  });

  it('fails at once on a bad key, without waiting', async () => {
    const sleep = vi.fn(async (_ms: number) => {});
    const provider = flaky([apiError(401, false)]);
    await expect(withRetries(provider, { sleep }).text(REQUEST)).rejects.toThrow('status 401');
    expect(provider.attempts()).toBe(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('counts the tokens of a schema miss in the attempt that succeeds', async () => {
    let n = 0;
    const provider: Provider = {
      name: 'openai',
      model: 'gpt-6.1-sol',
      text: async () => ({ text: '', usage: { inputTokens: 0, outputTokens: 0 } }),
      async object<T>() {
        n += 1;
        if (n === 1) throw schemaMiss();
        return { value: { ok: true } as T, usage: { inputTokens: 1200, outputTokens: 900 } };
      },
    };
    const result = await withRetries(provider, { sleep: async () => {} }).object({
      ...REQUEST,
      step: 'seo',
      name: 'seo',
      schema: { parse: (v: unknown) => v } as never,
    });
    expect(result.usage).toEqual({ inputTokens: 1700, outputTokens: 1000 });
  });

  it('lets a run whose draft timed out once publish on the retry', async () => {
    const { store, state } = memoryStore();
    const mock = mockProvider({ facts: FACTS });
    let timedOut = false;
    const draftTimesOutOnce: Provider = {
      ...mock,
      async text(req) {
        if (req.step === 'draft' && !timedOut) {
          timedOut = true;
          throw timeout();
        }
        return mock.text(req);
      },
    };
    const ctx: PipelineContext = {
      store,
      provider: withRetries(draftTimesOutOnce, { sleep: async () => {} }),
      now: () => new Date('2026-09-14T07:30:00Z'),
      run: async (_name, fn) => fn(),
      env: { AI_CONTENT_MOCK: '1' },
    };
    const result = await runPipeline(ctx);
    expect(result.status, result.reason ?? '').toBe('done');
    expect(timedOut).toBe(true);
    expect(state.posts).toHaveLength(1);
  });
});

describe('a language written onto the post’s shared rows (ADR-057, ADR-066)', () => {
  it('keeps each row’s id and adds a row past the ones the post has', () => {
    expect(ontoRows([{ id: 'a' }, { id: 'b' }, { id: 'c' }], ['one', 'two', 'three'])).toEqual([
      { id: 'a', text: 'one' },
      { id: 'b', text: 'two' },
      { id: 'c', text: 'three' },
    ]);
    expect(ontoRows([{ id: 'a' }], ['one', 'two'])).toEqual([
      { id: 'a', text: 'one' },
      { text: 'two' },
    ]);
    expect(ontoRows(null, ['one'])).toEqual([{ text: 'one' }]);
  });
});
