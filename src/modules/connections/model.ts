import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogle } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { ConnectionKind } from '@/modules/connections/kinds';

export interface ModelSpec {
  kind: ConnectionKind;
  model: string;
  apiKey: string;
  baseUrl: string | null;
}

/**
 * The AI SDK model a connection stands for (ADR-047): one factory per vendor, the model id
 * the connection's string, the key decrypted by the caller. An OpenAI-compatible endpoint
 * goes through the chat completions API (`.chat`): the callable OpenAI provider is the
 * Responses API, which compatible endpoints do not serve. The mock kind has no model; the
 * engine builds its mock provider and the test answers without a call.
 */
export function languageModel(spec: ModelSpec): LanguageModel {
  const { kind, model, apiKey } = spec;
  switch (kind) {
    case 'openai':
      return createOpenAI({ apiKey })(model);
    case 'anthropic':
      return createAnthropic({ apiKey })(model);
    case 'google':
      return createGoogle({ apiKey })(model);
    case 'deepseek':
      return createDeepSeek({ apiKey })(model);
    case 'openai-compatible': {
      if (!spec.baseUrl) throw new Error('an OpenAI-compatible connection needs a base URL');
      return createOpenAI({ apiKey, baseURL: spec.baseUrl }).chat(model);
    }
    case 'mock':
      throw new Error('a mock connection has no model');
    default:
      throw new Error(`Unknown connection kind ${String(kind)}`);
  }
}
