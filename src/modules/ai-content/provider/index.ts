import type { FactsSheet } from '@/modules/ai-content/facts';
import type { EngineSettings } from '@/modules/ai-content/pipeline/types';
import { mockProvider } from '@/modules/ai-content/provider/mock';
import { sdkProvider } from '@/modules/ai-content/provider/sdk';
import type { Provider } from '@/modules/ai-content/provider/types';

/** `AI_CONTENT_MOCK=1` lets the settings select the mock; the production assert refuses it. */
export function mockAllowed(raw: Record<string, string | undefined> = process.env): boolean {
  return raw['AI_CONTENT_MOCK'] === '1';
}

/**
 * The provider the settings name (BRD 10.2.6): the mock behind its gate, otherwise the SDK
 * with the vendor's model and decrypted key. A missing key is a run error with a clear
 * message, not a silent fallback.
 */
export function providerFor(
  settings: EngineSettings,
  facts: FactsSheet,
  env: Record<string, string | undefined> = process.env,
): Provider {
  if (settings.activeProvider === 'mock') {
    if (!mockAllowed(env)) {
      throw new Error(
        'activeProvider "mock" needs AI_CONTENT_MOCK=1 (tests and the review server only)',
      );
    }
    return mockProvider({ facts });
  }
  const vendor = settings.providers[settings.activeProvider];
  if (!vendor.apiKey)
    throw new Error(`no API key for ${settings.activeProvider}: add it in the engine settings`);
  if (!vendor.model)
    throw new Error(`no model id for ${settings.activeProvider}: add it in the engine settings`);
  return sdkProvider(settings.activeProvider, vendor.model, vendor.apiKey);
}
