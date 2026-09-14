import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogle } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, generateText, type LanguageModel } from 'ai';
import type { Usage } from '@/modules/ai-content/cost';
import {
  CALL_TIMEOUT_MS,
  type ObjectRequest,
  type ObjectResult,
  type Provider,
  type ProviderName,
  type TextRequest,
  type TextResult,
} from '@/modules/ai-content/provider/types';

/**
 * The Vercel AI SDK behind the `Provider` interface (BRD 10.2.6): one factory per vendor,
 * the model id a settings string, the key decrypted by the caller. Nothing here runs in the
 * browser. `image` is absent: no image provider is wired yet (ADR-042).
 */
function usageOf(usage: {
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
}): Usage {
  return { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 };
}

export function languageModel(
  name: Exclude<ProviderName, 'mock'>,
  model: string,
  apiKey: string,
): LanguageModel {
  switch (name) {
    case 'openai':
      return createOpenAI({ apiKey })(model);
    case 'deepseek':
      return createDeepSeek({ apiKey })(model);
    case 'anthropic':
      return createAnthropic({ apiKey })(model);
    case 'google':
      return createGoogle({ apiKey })(model);
    default:
      throw new Error(`Unknown provider ${String(name)}`);
  }
}

export function sdkProvider(
  name: Exclude<ProviderName, 'mock'>,
  model: string,
  apiKey: string,
): Provider {
  const lm = languageModel(name, model, apiKey);
  return {
    name,
    model,
    async text(req: TextRequest): Promise<TextResult> {
      const result = await generateText({
        model: lm,
        system: req.system,
        prompt: req.prompt,
        ...(req.maxOutputTokens ? { maxOutputTokens: req.maxOutputTokens } : {}),
        abortSignal: AbortSignal.timeout(CALL_TIMEOUT_MS),
      });
      return { text: result.text, usage: usageOf(result.usage) };
    },
    async object<T>(req: ObjectRequest<T>): Promise<ObjectResult<T>> {
      const result = await generateObject({
        model: lm,
        schema: req.schema,
        schemaName: req.name,
        system: req.system,
        prompt: req.prompt,
        ...(req.maxOutputTokens ? { maxOutputTokens: req.maxOutputTokens } : {}),
        abortSignal: AbortSignal.timeout(CALL_TIMEOUT_MS),
      });
      return { value: result.object as T, usage: usageOf(result.usage) };
    },
  };
}
