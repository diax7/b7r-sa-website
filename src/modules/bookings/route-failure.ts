/**
 * What a booking route answers when its flow throws (ADR-062, rule 18): a 500 with a
 * generic word, and one log entry naming the route and the error's name alone. Never the
 * error itself: a database failure's message carries the failed query and its parameters
 * (drizzle's `Failed query: … params: …`), which for a booking are the merchant's name,
 * phone, e-mail and note, and pino's serializer would write the message and the stack out.
 * An error that reaches Next uncaught is printed whole the same way; every route that
 * writes such a row catches its own failures.
 */
export interface FailureLogger {
  error(entry: { msg: string }): void;
}

/** The error's name, or the type of a throw that is not an `Error`. */
export function errorName(error: unknown): string {
  return error instanceof Error && error.name ? error.name : typeof error;
}

export function routeFailure(logger: FailureLogger, route: string, error: unknown): Response {
  logger.error({ msg: `bookings: ${route} failed (${errorName(error)})` });
  return Response.json(
    { ok: false, error: 'failed' },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  );
}
