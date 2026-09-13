import { APIError, type CollectionBeforeOperationHook } from 'payload';
import { cmsEnv } from '@/lib/cms/env';
import { LOGIN_GATE_COOKIE, readCookie, verifyLoginGate } from '@/lib/login-gate';

const MESSAGE = 'أكمل التحقق من أنك لست روبوتاً ثم حاول مرة أخرى.';

/** Filed under info by `loggingLevels`: a bot or an expired gate, not a server error. */
class GateClosed extends APIError {
  override name = 'AuthenticationError';

  constructor(message: string) {
    super(message, 401, undefined, true);
  }
}

let warnedOpen = false;

/** Whether a login request may proceed (pure over the inputs; unit-tested). */
export function loginAllowed(args: {
  cookieHeader: string | null | undefined;
  secret: string;
  turnstileSecret: string | undefined;
  now?: number;
}): boolean {
  if (!args.turnstileSecret) return true;
  return verifyLoginGate(readCookie(args.cookieHeader, LOGIN_GATE_COOKIE), args.secret, args.now);
}

/**
 * Runs before Payload's login operation — before the password is checked or the attempt
 * counted — so a request without a verified gate cookie never reaches the password oracle
 * (ADR-034). Fail-open, logged once, when no Turnstile secret is configured.
 */
export const gateLogin: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== 'login') return args;
  const turnstileSecret = process.env['TURNSTILE_SECRET_KEY'] || undefined;
  if (!turnstileSecret) {
    if (!warnedOpen) {
      warnedOpen = true;
      req.payload.logger.warn(
        'login gate: TURNSTILE_SECRET_KEY unset, the admin login is not challenged',
      );
    }
    return args;
  }
  const cookieHeader = req.headers.get('cookie');
  if (!loginAllowed({ cookieHeader, secret: cmsEnv().secret, turnstileSecret })) {
    // 401 with the Arabic reason as the message; the admin shows it as the login error.
    throw new GateClosed(MESSAGE);
  }
  return args;
};
