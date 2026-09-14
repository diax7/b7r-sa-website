import type { z } from 'zod';
import type { Usage } from '@/modules/ai-content/cost';

/**
 * What the pipeline asks of a model (BRD 10.2.6): prose, a typed object, and (one day) an
 * image. Every call carries a timeout; the SDK provider and the mock implement the same
 * shape so the pipeline is tested without a network.
 */
export interface TextRequest {
  /** Which step is calling, for the mock's fixtures and the run log. */
  step: string;
  system: string;
  prompt: string;
  maxOutputTokens?: number;
}

export interface TextResult {
  text: string;
  usage: Usage;
}

export interface ObjectRequest<T> extends TextRequest {
  schema: z.ZodType<T>;
  name: string;
}

export interface ObjectResult<T> {
  value: T;
  usage: Usage;
}

export interface ImageRequest {
  prompt: string;
}

export interface ImageResult {
  bytes: Uint8Array;
  mime: string;
}

export interface Provider {
  name: string;
  model: string;
  text(req: TextRequest): Promise<TextResult>;
  object<T>(req: ObjectRequest<T>): Promise<ObjectResult<T>>;
  /** Present only when the provider can draw; `imageMode: generate` refuses otherwise. */
  image?(req: ImageRequest): Promise<ImageResult>;
}

/** Every LLM call gets this long (BRD 10.2.4: each task ≤ 120 s). */
export const CALL_TIMEOUT_MS = 120_000;

export const PROVIDER_NAMES = ['openai', 'deepseek', 'anthropic', 'google', 'mock'] as const;
export type ProviderName = (typeof PROVIDER_NAMES)[number];
