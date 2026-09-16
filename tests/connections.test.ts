import type { Payload } from 'payload';
import { describe, expect, it } from 'vitest';
import { Connections } from '@/modules/connections/collection';
import { CONNECTION_KINDS, isConnectionKind, KINDS } from '@/modules/connections/kinds';
import { languageModel } from '@/modules/connections/model';
import { toConnectionSpec } from '@/modules/connections/read';
import { connectionSpend } from '@/modules/connections/spend';
import { safeMessage, TEST_MESSAGE_MAX } from '@/modules/connections/safe-message';
import { secretField } from '@/modules/cms/fields/secret-field';
import type { Connection } from '@/payload-types';

/** The SDK's `LanguageModel` is a model object or a plain id string; the factory returns objects. */
function modelOf(spec: Parameters<typeof languageModel>[0]): { modelId: string; provider: string } {
  const model = languageModel(spec);
  if (typeof model === 'string') throw new Error('expected a model object');
  return model;
}

/** A request whose engine settings name the given connection. */
const requestWith = (connection: unknown) =>
  ({ payload: { findGlobal: async () => ({ connection }) } }) as never;

/** A `payload.find` that records its query and answers with the given run rows. */
function fakePayload(docs: Array<{ costUsd?: number | null }>) {
  const calls: unknown[] = [];
  const payload = {
    find: async (args: unknown) => {
      calls.push(args);
      return { docs };
    },
  } as unknown as Payload;
  return { payload, calls };
}

describe('connections (ADR-047)', () => {
  it('knows nine kinds, six that speak AI and three services, each with what a new row gets', () => {
    expect(CONNECTION_KINDS).toEqual([
      'openai',
      'anthropic',
      'google',
      'deepseek',
      'openai-compatible',
      'mock',
      'google-search-console',
      'bing-webmaster',
      'pagespeed',
    ]);
    expect(isConnectionKind('openai-compatible')).toBe(true);
    expect(isConnectionKind('perplexity')).toBe(false);
    expect(KINDS.openai.defaultModel).toBe('gpt-4.1');
    expect(KINDS['openai-compatible'].needsBaseUrl).toBe(true);
    expect(KINDS.mock.rates).toEqual({ input: 0, output: 0 });
  });

  it('builds the SDK model per kind; a compatible endpoint goes through chat completions', () => {
    const openai = modelOf({ kind: 'openai', model: 'gpt-4.1', apiKey: 'k', baseUrl: null });
    expect(openai.modelId).toBe('gpt-4.1');
    expect(openai.provider).toMatch(/^openai/);
    const compatible = modelOf({
      kind: 'openai-compatible',
      model: 'llama-3',
      apiKey: 'k',
      baseUrl: 'https://llm.example.com/v1',
    });
    expect(compatible.modelId).toBe('llama-3');
    expect(compatible.provider).toBe('openai.chat');
    expect(() =>
      languageModel({ kind: 'openai-compatible', model: 'x', apiKey: 'k', baseUrl: null }),
    ).toThrow(/base URL/);
    expect(() =>
      languageModel({ kind: 'mock', model: 'mock', apiKey: 'k', baseUrl: null }),
    ).toThrow(/mock/);
    for (const kind of ['anthropic', 'google', 'deepseek'] as const) {
      expect(modelOf({ kind, model: 'm', apiKey: 'k', baseUrl: null }).modelId).toBe('m');
    }
  });

  it('sums the runs of one connection since the Riyadh month began, skipped rows left out', async () => {
    const { payload, calls } = fakePayload([
      { costUsd: 0.1234 },
      { costUsd: 0.2 },
      { costUsd: null },
    ]);
    const spend = await connectionSpend(payload, 7, new Date('2026-09-14T22:30:00Z'));
    expect(spend).toEqual({ spentUsd: 0.3234, calls: 3 });
    expect(calls[0]).toMatchObject({
      collection: 'ai-runs',
      where: {
        and: [
          { connection: { equals: 7 } },
          { startedAt: { greater_than_equal: '2026-08-31T21:00:00.000Z' } },
          { status: { not_equals: 'skipped' } },
        ],
      },
    });
    expect(await connectionSpend(fakePayload([]).payload, 7)).toEqual({ spentUsd: 0, calls: 0 });
  });

  it('reads a row as the spec the engine gets, defaults where the row is empty', () => {
    const row = {
      id: 3,
      label: 'OpenAI',
      kind: 'openai',
      model: null,
      apiKey: 'sk-plain',
      baseUrl: null,
      inputPerMillionUsd: 2,
      outputPerMillionUsd: null,
      monthlyLimitUsd: 20,
      enabled: null,
      updatedAt: '',
      createdAt: '',
    } as unknown as Connection;
    expect(toConnectionSpec(row)).toEqual({
      id: 3,
      label: 'OpenAI',
      kind: 'openai',
      model: '',
      apiKey: 'sk-plain',
      baseUrl: null,
      rates: { inputPerMillionUsd: 2, outputPerMillionUsd: 0 },
      monthlyLimitUsd: 20,
      enabled: true,
    });
    expect(toConnectionSpec({ ...row, enabled: false, kind: 'nope' } as never).enabled).toBe(false);
    expect(toConnectionSpec({ ...row, kind: 'nope' } as never).kind).toBe('openai');
  });

  it('shows a vendor error without the key, a URL or a second line, at most 200 characters', () => {
    const key = 'sk-secret-key-value';
    expect(
      safeMessage(
        new Error(`401 Unauthorized for https://api.x.com/v1?key=${key}\n  at fetch`),
        key,
      ),
    ).toBe('401 Unauthorized for [url] at fetch');
    expect(safeMessage(new Error(`bad key ${key} rejected`), key)).toBe('bad key [key] rejected');
    expect(safeMessage(new Error(''), null)).toBe('the call failed with no message');
    expect(safeMessage('x'.repeat(500), null)).toHaveLength(TEST_MESSAGE_MAX);
    expect(safeMessage(new Error('short'), 'tiny')).toBe('short');
    expect(safeMessage('y'.repeat(300), null, 1000)).toHaveLength(300);
  });

  it('keeps the stored ciphertext when a save sends the mask or omits the field', async () => {
    const field = secretField('apiKey', { ar: 'مفتاح', en: 'Key' });
    if (field.type !== 'text') throw new Error('a text field');
    const hook = field.hooks!.beforeChange![0]!;
    const reads: unknown[] = [];
    const req = {
      payload: {
        encrypt: (plain: string) => `enc(${plain})`,
        db: {
          findOne: async (args: unknown) => {
            reads.push(args);
            return { id: 9, apiKey: 'enc(sk-old)' };
          },
          findGlobal: async () => ({ images: { pexelsKey: 'enc(px-old)' } }),
        },
      },
    };
    const base = {
      req,
      collection: { slug: 'connections' },
      originalDoc: { id: 9, apiKey: '••••-old' },
      path: ['apiKey'],
      context: {},
    };
    // The admin form posts the mask back; the Local API omits the field: both keep the row's value.
    expect(await hook({ ...base, value: '••••-old', previousValue: '••••-old' } as never)).toBe(
      'enc(sk-old)',
    );
    expect(await hook({ ...base, value: undefined, previousValue: '••••-old' } as never)).toBe(
      'enc(sk-old)',
    );
    expect(reads[0]).toMatchObject({ collection: 'connections', where: { id: { equals: 9 } } });
    // A new key is encrypted without a read; an empty value clears it.
    expect(await hook({ ...base, value: 'sk-new' } as never)).toBe('enc(sk-new)');
    expect(await hook({ ...base, value: '' } as never)).toBeNull();
    expect(reads).toHaveLength(2);
    // A global's secret follows its path into the row.
    expect(
      await hook({
        req,
        global: { slug: 'ai-settings' },
        originalDoc: {},
        path: ['images', 'pexelsKey'],
        context: {},
        value: '••••-old',
      } as never),
    ).toBe('enc(px-old)');
  });

  it('fills the model and the rates of a new row from its kind; leaves a sent value alone', async () => {
    const fill = Connections.hooks!.beforeValidate![0]!;
    const created = await fill({
      data: { label: 'A', kind: 'anthropic', inputPerMillionUsd: 1 },
      operation: 'create',
      req: {} as never,
      context: {},
      collection: Connections as never,
    } as never);
    expect(created).toMatchObject({
      model: 'claude-sonnet-4-5',
      inputPerMillionUsd: 1,
      outputPerMillionUsd: 15,
    });
    // A partial update does not touch what it did not send; an emptied field refills.
    const updated = await fill({
      data: { model: '' },
      originalDoc: { kind: 'deepseek' },
      operation: 'update',
      req: {} as never,
      context: {},
      collection: Connections as never,
    } as never);
    expect(updated).toEqual({ model: 'deepseek-chat' });
  });

  it('refuses to delete the connection the engine settings name', async () => {
    const guard = Connections.hooks!.beforeDelete![0]!;
    const req = requestWith;
    await expect(
      guard({ id: 4, req: req(4), collection: Connections as never, context: {} } as never),
    ).rejects.toThrow(/pick another/);
    await expect(
      guard({ id: 4, req: req({ id: 4 }), collection: Connections as never, context: {} } as never),
    ).rejects.toThrow(/pick another/);
    await expect(
      guard({ id: 4, req: req(5), collection: Connections as never, context: {} } as never),
    ).resolves.toBeUndefined();
    await expect(
      guard({ id: 4, req: req(null), collection: Connections as never, context: {} } as never),
    ).resolves.toBeUndefined();
  });
});
