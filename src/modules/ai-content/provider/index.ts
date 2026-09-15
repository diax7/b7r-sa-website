import type { FactsSheet } from '@/modules/ai-content/facts';
import type { EngineSettings } from '@/modules/ai-content/pipeline/types';
import { mockProvider } from '@/modules/ai-content/provider/mock';
import { sdkProvider } from '@/modules/ai-content/provider/sdk';
import type { Provider } from '@/modules/ai-content/provider/types';
import { mockAllowed } from '@/modules/connections/kinds';

/**
 * The provider the settings' connection stands for (BRD 10.2.6, ADR-047): the mock behind
 * its gate, otherwise the SDK with the connection's kind, model and decrypted key. No
 * connection, an off connection or a missing key is a run error with a clear message, not a
 * silent fallback.
 */
export function providerFor(
  settings: EngineSettings,
  facts: FactsSheet,
  env: Record<string, string | undefined> = process.env,
): Provider {
  const connection = settings.connection;
  if (!connection) throw new Error('no connection: pick one in the engine settings');
  if (!connection.enabled) throw new Error(`the connection "${connection.label}" is off`);
  if (connection.kind === 'mock') {
    if (!mockAllowed(env)) {
      throw new Error(
        'a mock connection needs AI_CONTENT_MOCK=1 (tests and the review server only)',
      );
    }
    return mockProvider({ facts });
  }
  if (!connection.apiKey) {
    throw new Error(`no API key on the connection "${connection.label}": add it under Connections`);
  }
  if (!connection.model) {
    throw new Error(
      `no model id on the connection "${connection.label}": add it under Connections`,
    );
  }
  return sdkProvider({ ...connection, apiKey: connection.apiKey });
}

/**
 * What a job runs with when no provider can be built: a missing or off connection is refused
 * by the guards before any call (a skipped row for a manual run); a missing key fails the
 * first model call with the same message, recorded on the run. The job never dies without a
 * row that says why.
 */
export function providerOrRefusal(
  settings: EngineSettings,
  facts: FactsSheet,
  env: Record<string, string | undefined> = process.env,
): Provider {
  try {
    return providerFor(settings, facts, env);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const refuse = () => Promise.reject(new Error(reason));
    return {
      name: settings.connection?.kind ?? 'none',
      model: settings.connection?.model ?? '',
      text: refuse,
      object: refuse,
    };
  }
}
