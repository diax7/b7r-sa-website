import { env } from '@/lib/env';
import { LoginTurnstileWidget } from '@/modules/cms/auth/login-turnstile-widget';

/**
 * Renders above the admin login form (`admin.components.beforeLogin`): the Turnstile widget
 * that opens the login gate (ADR-034). Nothing without a site key.
 */
export function LoginTurnstile() {
  const siteKey = env.turnstileSiteKey;
  if (!siteKey) return null;
  return <LoginTurnstileWidget siteKey={siteKey} />;
}
