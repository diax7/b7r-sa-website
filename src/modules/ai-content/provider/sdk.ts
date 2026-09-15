import { generateObject, generateText } from 'ai';
import type { Usage } from '@/modules/ai-content/cost';
import {
  CALL_TIMEOUT_MS,
  type ObjectRequest,
  type ObjectResult,
  type Provider,
  type TextRequest,
  type TextResult,
} from '@/modules/ai-content/provider/types';
import type { ConnectionSpec } from '@/modules/connections/kinds';
import { languageModel } from '@/modules/connections/model';

/**
 * The Vercel AI SDK behind the `Provider` interface (BRD 10.2.6): the model built from the
 * connection's kind, model id, base URL and decrypted key (ADR-047). Nothing here runs in
 * the browser. `image` is absent: no image provider is wired yet (ADR-042).
 */
function usageOf(usage: {
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
}): Usage {
  return { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 };
}

export function sdkProvider(connection: ConnectionSpec & { apiKey: string }): Provider {
  const { kind, model, apiKey, baseUrl } = connection;
  const lm = languageModel({ kind, model, apiKey, baseUrl });
  return {
    name: kind,
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
