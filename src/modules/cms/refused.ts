import { APIError } from 'payload';

/**
 * A save the site refuses on purpose (a sixth home FAQ, a reserved page slug, a looping
 * redirect, a weak password): HTTP 400 with the Arabic reason as the response message, and
 * its own name so `loggingLevels` files it under info, an editor's expected outcome, not a
 * server error (ADR-031).
 */
export class Refused extends APIError {
  override name = 'Refused';

  constructor(message: string) {
    super(message, 400, undefined, true);
  }
}
