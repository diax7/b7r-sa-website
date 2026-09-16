import { generateText } from 'ai';
import type { Usage } from '@/modules/ai-content/cost';
import type { ConnectionSpec } from '@/modules/connections/kinds';
import { languageModel, searchTool } from '@/modules/connections/model';
import { type AnswerSource, rawUrls } from '@/modules/visibility/ledger/read-answer';

/**
 * One prompt to one engine (ADR-049 D5), as a buyer would type it: no system prompt naming
 * B7R, the vendor's web search on where it has one, 1,500 output tokens (Claude's tool
 * blocks count against output), a 60 s abort. Returns what the reader needs and what the
 * cost needs (the tokens, how many searches the tool ran).
 */
export const ASK_MAX_OUTPUT_TOKENS = 1_500;
export const ASK_TIMEOUT_MS = 60_000;

export type AskMode = 'search' | 'plain';

export interface Answer {
  text: string;
  sources: AnswerSource[];
  raw: unknown;
  usage: Usage;
  mode: AskMode;
  /** The searches the vendor's tool ran, each billed at the kind's `searchFeeUsd`. */
  searches: number;
}

export type Asker = (prompt: string) => Promise<Answer>;

/**
 * How many searches the vendor bills for one answer. Anthropic reports the number in its
 * usage metadata (`server_tool_use.web_search_requests`; the tool-call parts over-count it);
 * OpenAI emits a tool-call part per server-side search; Google emits none for grounding (it
 * lands in the metadata and the sources) and bills per grounded prompt, so a grounded
 * answer counts one.
 */
export function searchesOf(
  kind: ConnectionSpec['kind'],
  result: {
    steps: Array<{ content: Array<{ type: string }> }>;
    sources: unknown[];
    providerMetadata?: Record<string, Record<string, unknown>> | undefined;
  },
): number {
  if (kind === 'google') {
    const grounded =
      result.sources.length > 0 || result.providerMetadata?.['google']?.['groundingMetadata'];
    return grounded ? 1 : 0;
  }
  if (kind === 'anthropic') {
    const usage = result.providerMetadata?.['anthropic']?.['usage'] as
      | { server_tool_use?: { web_search_requests?: number } }
      | undefined;
    const reported = usage?.server_tool_use?.web_search_requests;
    if (typeof reported === 'number') return reported;
  }
  return result.steps.flatMap((step) => step.content).filter((part) => part.type === 'tool-call')
    .length;
}

export function sdkAsker(spec: ConnectionSpec & { apiKey: string }): Asker {
  const model = languageModel({
    kind: spec.kind,
    model: spec.model,
    apiKey: spec.apiKey,
    baseUrl: spec.baseUrl,
  });
  const tools = searchTool({ kind: spec.kind, apiKey: spec.apiKey });
  return async (prompt) => {
    const result = await generateText({
      model,
      prompt,
      ...(tools ? { tools } : {}),
      maxOutputTokens: ASK_MAX_OUTPUT_TOKENS,
      abortSignal: AbortSignal.timeout(ASK_TIMEOUT_MS),
    });
    const searches = searchesOf(spec.kind, result);
    const raw = result.response.body;
    return {
      text: result.text,
      sources: result.sources.flatMap((s) =>
        s.sourceType === 'url' ? [{ url: s.url, title: s.title ?? null }] : [],
      ),
      raw,
      usage: {
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
      },
      // A compatible endpoint that searches on its own (Perplexity) hands citations in the body.
      mode: tools || rawUrls(raw).length > 0 ? 'search' : 'plain',
      searches,
    };
  };
}

/**
 * The mock engine (tests and the review server, behind `AI_CONTENT_MOCK=1`): names B7R with a
 * link on an Arabic prompt, names two competitors and nothing of ours on an English one, so
 * a run shows both outcomes without a call.
 */
export function mockAsker(): Asker {
  return async (prompt) => {
    const arabic = /[؀-ۿ]/.test(prompt);
    const text = arabic
      ? `أفضل خيار في السعودية هو بحر برنت (b7r.sa): طباعة على الطلب بلا حد أدنى، وتصل خلال أيام. راجع https://b7r.sa/products للأسعار.`
      : `Popular print-on-demand services are Printful and Printify; both ship to Saudi Arabia from abroad, so allow two to three weeks.`;
    return {
      text,
      sources: arabic
        ? [{ url: 'https://b7r.sa/products', title: 'المنتجات' }]
        : [
            { url: 'https://www.printful.com/', title: 'Printful' },
            { url: 'https://printify.com/', title: 'Printify' },
          ],
      raw: null,
      usage: { inputTokens: 40, outputTokens: 60 },
      mode: 'plain',
      searches: 0,
    };
  };
}
