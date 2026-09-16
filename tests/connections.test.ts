import type { Payload } from 'payload';
import { describe, expect, it } from 'vitest';
import { Connections } from '@/modules/connections/collection';
import {
  CONNECTION_KINDS,
  isConnectionKind,
  KINDS,
  ratesForModel,
  searchFeeFor,
} from '@/modules/connections/kinds';
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

describe('the mock kind in the picker', () => {
  const row = Connections.fields.find((f) => f.type === 'row') as {
    fields: Array<Record<string, unknown>>;
  };
  const kind = row.fields.find((f) => f['name'] === 'kind') as {
    options: Array<{ value: string }>;
    filterOptions: (args: { options: Array<{ value: string }> }) => Array<{ value: string }>;
  };

  it('lists every kind in `options`, so the generated type never depends on the environment', () => {
    expect(kind.options.map((o) => o.value)).toEqual([...CONNECTION_KINDS]);
  });

  it('shows and accepts the mock only where AI_CONTENT_MOCK=1', () => {
    const before = process.env['AI_CONTENT_MOCK'];
    try {
      process.env['AI_CONTENT_MOCK'] = '1';
      expect(kind.filterOptions({ options: kind.options }).map((o) => o.value)).toContain('mock');
      delete process.env['AI_CONTENT_MOCK'];
      const shown = kind.filterOptions({ options: kind.options }).map((o) => o.value);
      expect(shown).not.toContain('mock');
      expect(shown).toHaveLength(CONNECTION_KINDS.length - 1);
    } finally {
      if (before === undefined) delete process.env['AI_CONTENT_MOCK'];
      else process.env['AI_CONTENT_MOCK'] = before;
    }
  });
});

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

  it('brings a known model its own rates when the model changes; an unknown one keeps the rates the row has', async () => {
    const fill = Connections.hooks!.beforeValidate![0]!;
    const change = (model: string, original: Record<string, unknown>) =>
      fill({
        data: { model },
        originalDoc: original,
        operation: 'update',
        req: {} as never,
        context: {},
        collection: Connections as never,
      } as never);
    // gpt-4.1's rates were on the row; the mini is a fifth of the price.
    expect(
      await change('gpt-4.1-mini', {
        kind: 'openai',
        model: 'gpt-4.1',
        inputPerMillionUsd: 2,
        outputPerMillionUsd: 8,
      }),
    ).toEqual({ model: 'gpt-4.1-mini', inputPerMillionUsd: 0.4, outputPerMillionUsd: 1.6 });
    expect(await change('claude-haiku-4-5-20251001', { kind: 'anthropic', model: 'x' })).toEqual({
      model: 'claude-haiku-4-5-20251001',
      inputPerMillionUsd: 1,
      outputPerMillionUsd: 5,
    });
    // The admin form posts every field: a model change with the row's own rates untouched
    // takes the known ones; a rate the admin edited in the same save wins.
    const form = (model: string, rates: [number, number], original: Record<string, unknown>) =>
      fill({
        data: {
          kind: original['kind'],
          model,
          inputPerMillionUsd: rates[0],
          outputPerMillionUsd: rates[1],
        },
        originalDoc: original,
        operation: 'update',
        req: {} as never,
        context: {},
        collection: Connections as never,
      } as never);
    const row = { kind: 'openai', model: 'gpt-4.1', inputPerMillionUsd: 2, outputPerMillionUsd: 8 };
    expect(await form('gpt-4.1-mini', [2, 8], row)).toMatchObject({
      inputPerMillionUsd: 0.4,
      outputPerMillionUsd: 1.6,
    });
    expect(await form('gpt-4.1-mini', [2, 9], row)).toMatchObject({
      inputPerMillionUsd: 2,
      outputPerMillionUsd: 9,
    });
    // Unknown: the rates are left as they are; the same model again: untouched.
    expect(await change('my-fine-tune', { kind: 'openai', model: 'gpt-4.1' })).toEqual({
      model: 'my-fine-tune',
    });
    expect(await change('gpt-4.1-mini', { kind: 'openai', model: 'gpt-4.1-mini' })).toEqual({
      model: 'gpt-4.1-mini',
    });
    // A new row with a known model and no rates sent takes the model's, not the kind's.
    const created = await fill({
      data: { label: 'B', kind: 'google', model: 'gemini-2.5-flash' },
      operation: 'create',
      req: {} as never,
      context: {},
      collection: Connections as never,
    } as never);
    expect(created).toMatchObject({ inputPerMillionUsd: 0.3, outputPerMillionUsd: 2.5 });
    expect(ratesForModel('GEMINI-3.1-PRO-PREVIEW')).toEqual({ input: 2, output: 12 });
    // The longest family wins: a dated mini id is the mini, not its parent.
    expect(ratesForModel('gpt-4.1-mini-2025-04-14')).toEqual({ input: 0.4, output: 1.6 });
    expect(ratesForModel('gpt-5-mini-2025-08-07')).toEqual({ input: 0.25, output: 2 });
    expect(ratesForModel('gemini-2.5-flash-lite-preview-06-17')).toEqual({
      input: 0.1,
      output: 0.4,
    });
    expect(ratesForModel('nope')).toBeNull();
    expect(searchFeeFor('openai', 'gpt-4.1')).toBe(0.01);
    expect(searchFeeFor('openai', 'gpt-4.1-mini')).toBe(0.025);
    expect(searchFeeFor('google', 'gemini-2.5-pro')).toBe(0.035);
    expect(searchFeeFor('google', 'gemini-3-flash-preview')).toBe(0.014);
    expect(searchFeeFor('deepseek', 'deepseek-chat')).toBe(0);
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
