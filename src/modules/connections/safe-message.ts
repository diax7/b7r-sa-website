/** The most characters a recorded test message keeps. */
export const TEST_MESSAGE_MAX = 200;

/**
 * A vendor's error as an admin may read it (ADR-047): one line, never the key and never a URL
 * (a query string may carry a key), cut at `max` characters. The test route, the stored test
 * outcome, a run's error and the failure e-mail all go through it.
 */
export function safeMessage(
  error: unknown,
  apiKey: string | null,
  max: number = TEST_MESSAGE_MAX,
): string {
  const raw = error instanceof Error ? error.message : String(error);
  let text = raw
    .replace(/https?:\/\/\S+/g, '[url]')
    .replace(/\s+/g, ' ')
    .trim();
  if (apiKey && apiKey.length >= 8) text = text.replaceAll(apiKey, '[key]');
  if (!text) text = 'the call failed with no message';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
